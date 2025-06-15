import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Download,
  SkipBack,
  SkipForward,
  Settings,
  Minimize,
  PictureInPicture2
} from 'lucide-react';
import { Lesson } from '../../types';
import Hls from 'hls.js';

interface VideoPlayerProps {
  lesson: Lesson;
  onBack: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ lesson, onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasCompletedVideo, setHasCompletedVideo] = useState(false);
  const [hlsInstance, setHlsInstance] = useState<Hls | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSecureStream, setIsSecureStream] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [quality, setQuality] = useState('auto');
  const [availableQualities, setAvailableQualities] = useState<string[]>(['auto']);
  const [buffered, setBuffered] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);

  // Initialize video player
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const initializeVideo = () => {
      setIsLoading(true);
      
      // Check if this is an HLS stream (encrypted)
      const isHLSStream = lesson.videoUrl.includes('/api/hls/') || lesson.videoUrl.includes('.m3u8');
      setIsSecureStream(isHLSStream);

      if (isHLSStream && Hls.isSupported()) {
        // HLS support
        const hls = new Hls({
          debug: true,
          enableWorker: false,
          lowLatencyMode: true,
          backBufferLength: 90,
        });

        hls.loadSource(lesson.videoUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('🎬 HLS manifest loaded successfully');
          setIsLoading(false);
          
          // Get available quality levels
          const qualities = ['auto', ...hls.levels.map(level => `${level.height}p`)];
          setAvailableQualities(qualities);
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          console.error('❌ HLS error:', data);
          setIsLoading(false);
        });

        setHlsInstance(hls);
      } else {
        // Regular video or fallback
        video.src = lesson.videoUrl;
        video.addEventListener('loadeddata', () => {
          console.log('📹 Regular video loaded');
          setIsLoading(false);
        });
        video.addEventListener('error', (e) => {
          console.error('❌ Video error:', e);
          setIsLoading(false);
        });
      }
    };

    initializeVideo();

    // Cleanup
    return () => {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    };
  }, [lesson.videoUrl]); // Remove hlsInstance from dependencies to prevent loop

  // Add event listeners for fullscreen and keyboard shortcuts
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipTime(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipTime(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.1));
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'Escape':
          if (showSettings) setShowSettings(false);
          break;
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, volume, showSettings]);

  // Increment view count only when video is completed
  const incrementViews = async () => {
    if (!hasCompletedVideo) {
      try {
        await fetch(`/api/lessons/${lesson.id}/view`, {
          method: 'PATCH',
        });
        setHasCompletedVideo(true);
        console.log('View count incremented - video completed');
      } catch (error) {
        console.error('Failed to increment views:', error);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration || 0;
      
      setCurrentTime(current);
      setDuration(total);
      updateBuffered();
      
      // Check if video is completed (98% watched to account for slight timing differences)
      if (total > 0 && (current / total) >= 0.98 && !hasCompletedVideo) {
        incrementViews();
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      const newTime = pos * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(error => {
          console.error('Error playing video:', error);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Enhanced video control functions
  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else if (document.fullscreenElement) {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  const togglePictureInPicture = async () => {
    if (videoRef.current) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      } catch (error) {
        console.error('Picture-in-Picture failed:', error);
      }
    }
  };

  const handleQualityChange = (newQuality: string) => {
    if (hlsInstance && newQuality !== 'auto') {
      const level = hlsInstance.levels.findIndex(level => 
        level.height.toString() === newQuality.replace('p', '')
      );
      if (level !== -1) {
        hlsInstance.currentLevel = level;
        setQuality(newQuality);
      }
    } else if (hlsInstance && newQuality === 'auto') {
      hlsInstance.currentLevel = -1;
      setQuality('auto');
    }
  };

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Controls visibility management
  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        if (!isHovering) {
          setShowControls(false);
        }
      }, 3000);
    }
  };

  const handleMouseMove = () => {
    if (!showControls) {
      showControlsTemporarily();
    }
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
    setShowControls(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (isPlaying) {
      showControlsTemporarily();
    }
  };

  // Update buffered progress
  const updateBuffered = () => {
    if (videoRef.current && videoRef.current.buffered.length > 0) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      const bufferedPercent = (bufferedEnd / duration) * 100;
      setBuffered(bufferedPercent);
    }
  };

  const handleDownloadPDF = (pdfUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatFileName = (name: string) => {
    try {
      // This appears to be corrupted UTF-8 that was incorrectly encoded
      // Let's try to fix it by treating it as latin1 and converting to utf8
      
      // First encode the string as latin1 bytes, then decode as utf8
      const latin1Bytes = [];
      for (let i = 0; i < name.length; i++) {
        latin1Bytes.push(name.charCodeAt(i) & 0xff);
      }
      
      // Convert bytes to UTF-8 string
      const utf8String = new TextDecoder('utf-8').decode(new Uint8Array(latin1Bytes));
      
      return utf8String;
    } catch (e) {
      console.log('Error decoding filename:', name, e);
      return name;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-6 text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
      >
        <span>← Back to Lessons</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Video Player */}
        <div className="lg:col-span-2 space-y-6">
          <div 
            ref={containerRef}
            className="bg-black rounded-2xl overflow-hidden relative aspect-video"
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Loading indicator */}
            {isLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-10">
                <div className="text-center text-white">
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-lg font-medium">
                    {isSecureStream ? '🔒 Loading Encrypted Stream...' : 'Loading Video...'}
                  </p>
                </div>
              </div>
            )}

            {/* Security badge */}
            {isSecureStream && !isLoading && (
              <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium z-20 flex items-center space-x-1">
                <span>🔒</span>
                <span>Secure Stream</span>
              </div>
            )}

            {/* HTML5 Video Player */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              poster={lesson.thumbnail}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleTimeUpdate}
              onProgress={updateBuffered}
              onEnded={() => {
                setIsPlaying(false);
                incrementViews();
              }}
              onVolumeChange={(e) => {
                const video = e.target as HTMLVideoElement;
                setIsMuted(video.muted);
                setVolume(video.volume);
              }}
              controls={false}
              onClick={togglePlay}
            >
              Your browser does not support the video tag.
            </video>
            
            {/* Enhanced Video Controls */}
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4 transition-opacity duration-300 ${
              showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
            }`}>
              {/* Progress Bar */}
              <div className="mb-4">
                <div 
                  className="w-full bg-white/30 h-1 rounded-full cursor-pointer group"
                  onClick={handleSeek}
                >
                  {/* Buffered Progress */}
                  <div 
                    className="absolute bg-white/50 h-1 rounded-full"
                    style={{ width: `${buffered}%` }}
                  ></div>
                  {/* Current Progress */}
                  <div 
                    className="bg-blue-500 h-1 rounded-full relative transition-all group-hover:h-2"
                    style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                  >
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                </div>
                {/* Time Display */}
                <div className="flex justify-between text-white text-sm mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center space-x-2">
                  {/* Skip Back */}
                  <button 
                    onClick={() => skipTime(-10)} 
                    className="hover:bg-white/20 p-2 rounded transition-colors"
                    title="Skip back 10s"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>

                  {/* Play/Pause */}
                  <button 
                    onClick={togglePlay} 
                    className="hover:bg-white/20 p-3 rounded transition-colors"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </button>

                  {/* Skip Forward */}
                  <button 
                    onClick={() => skipTime(10)} 
                    className="hover:bg-white/20 p-2 rounded transition-colors"
                    title="Skip forward 10s"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>

                  {/* Volume Controls */}
                  <div 
                    className="relative flex items-center"
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    onMouseLeave={() => setShowVolumeSlider(false)}
                  >
                    <button 
                      onClick={toggleMute} 
                      className="hover:bg-white/20 p-2 rounded transition-colors"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    
                    {/* Volume Slider */}
                    {showVolumeSlider && (
                      <div className="absolute left-full ml-2 bg-black/80 rounded-lg p-2">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={volume}
                          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                          className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>
                    )}
                  </div>

                  {/* Time Display */}
                  <span className="text-sm px-2">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Playback Speed */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        const rates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
                        const currentIndex = rates.indexOf(playbackRate);
                        const nextRate = rates[(currentIndex + 1) % rates.length];
                        changePlaybackRate(nextRate);
                      }}
                      className="hover:bg-white/20 px-3 py-1 rounded text-sm transition-colors"
                      title="Playback speed"
                    >
                      {playbackRate}x
                    </button>
                  </div>

                  {/* Settings */}
                  <div className="relative">
                    <button 
                      onClick={() => setShowSettings(!showSettings)}
                      className="hover:bg-white/20 p-2 rounded transition-colors"
                      title="Settings"
                    >
                      <Settings className="w-5 h-5" />
                    </button>

                    {/* Settings Menu */}
                    {showSettings && (
                      <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-3 min-w-48">
                        <div className="space-y-3">
                          {/* Quality Settings */}
                          <div>
                            <label className="block text-sm font-medium mb-2">Quality</label>
                            <select
                              value={quality}
                              onChange={(e) => handleQualityChange(e.target.value)}
                              className="w-full bg-white/20 rounded px-2 py-1 text-sm"
                            >
                              {availableQualities.map(q => (
                                <option key={q} value={q} className="bg-black">
                                  {q === 'auto' ? 'Auto' : q}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Playback Speed */}
                          <div>
                            <label className="block text-sm font-medium mb-2">Speed</label>
                            <select
                              value={playbackRate}
                              onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
                              className="w-full bg-white/20 rounded px-2 py-1 text-sm"
                            >
                              <option value="0.25" className="bg-black">0.25x</option>
                              <option value="0.5" className="bg-black">0.5x</option>
                              <option value="0.75" className="bg-black">0.75x</option>
                              <option value="1" className="bg-black">Normal</option>
                              <option value="1.25" className="bg-black">1.25x</option>
                              <option value="1.5" className="bg-black">1.5x</option>
                              <option value="1.75" className="bg-black">1.75x</option>
                              <option value="2" className="bg-black">2x</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Picture in Picture */}
                  <button 
                    onClick={togglePictureInPicture}
                    className="hover:bg-white/20 p-2 rounded transition-colors"
                    title="Picture in Picture"
                  >
                    <PictureInPicture2 className="w-5 h-5" />
                  </button>

                  {/* Fullscreen */}
                  <button 
                    onClick={toggleFullscreen} 
                    className="hover:bg-white/20 p-2 rounded transition-colors"
                    title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                  >
                    {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Center Play Button (when paused) */}
            {!isPlaying && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={togglePlay}
                  className="bg-black/50 hover:bg-black/70 rounded-full p-6 transition-colors"
                >
                  <Play className="w-12 h-12 text-white ml-1" />
                </button>
              </div>
            )}
          </div>

          {/* Video Info */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h1 className="text-2xl font-bold text-gray-900 mb-4 arabic-text">{lesson.title}</h1>
            <p className="text-gray-600 mb-6 arabic-text">{lesson.description}</p>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
              <span>{lesson.viewsCount} views</span>
              <span>•</span>
              <span>Published {new Date(lesson.createdAt).toLocaleDateString()}</span>
            </div>

          
          </div>

 
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* PDF Resources */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Course Resources</h3>
            <div className="space-y-3">
              {lesson.pdfFiles.map(pdf => (
                <div key={pdf.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <span className="text-red-600 text-xs font-bold">PDF</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm arabic-text" title={pdf.name}>
                        {formatFileName(pdf.name)}
                      </p>
                      <p className="text-xs text-gray-500">{formatFileSize(pdf.size)}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDownloadPDF(pdf.url, formatFileName(pdf.name))}
                    className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

     
        </div>
      </div>
    </div>
  );
};