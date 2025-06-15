import React, { useState } from 'react';
import { X, Upload, File, Video, Image } from 'lucide-react';
import { Lesson, Subject } from '../../types';

interface CreateLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  teacherId: string;
  subjects: Subject[];
}

export const CreateLessonModal: React.FC<CreateLessonModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  teacherId,
  subjects,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    duration: 0,
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setThumbnailFile(e.target.files[0]);
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPdfFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate subjectId
    if (!formData.subjectId || !subjects.some(subject => subject._id === formData.subjectId)) {
      setError('Please select a valid subject');
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      
      // Add lesson data as JSON string
      formDataToSend.append('lessonData', JSON.stringify({
        ...formData,
        teacherId,
        viewsCount: 0,
        pdfFiles: [], // Initialize empty array, will be populated by server
      }));

      // Add files
      if (videoFile) {
        formDataToSend.append('video', videoFile);
      }
      if (thumbnailFile) {
        formDataToSend.append('thumbnail', thumbnailFile);
      }
      pdfFiles.forEach(file => {
        formDataToSend.append('pdfs', file);
      });

      await onSubmit(formDataToSend);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        subjectId: '',
        duration: 0,
      });
      setVideoFile(null);
      setThumbnailFile(null);
      setPdfFiles([]);
      onClose();
    } catch (err) {
      // Handle specific error messages from the backend
      if (err instanceof Error) {
        const errorMessage = err.message;
        if (errorMessage.includes('Invalid subject ID format')) {
          setError('Please select a valid subject');
        } else if (errorMessage.includes('Subject not found')) {
          setError('The selected subject no longer exists');
        } else {
          setError(errorMessage);
        }
      } else {
        setError('Failed to create lesson');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Create New Lesson</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <select
              value={formData.subjectId}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a subject</option>
              {subjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lesson Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter lesson title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter lesson description"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4">
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="hidden"
                id="video-upload"
                required
              />
              <label
                htmlFor="video-upload"
                className="flex flex-col items-center cursor-pointer"
              >
                <Video className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {videoFile ? videoFile.name : 'Click to upload video'}
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thumbnail Image
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="hidden"
                id="thumbnail-upload"
                required
              />
              <label
                htmlFor="thumbnail-upload"
                className="flex flex-col items-center cursor-pointer"
              >
                <Image className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {thumbnailFile ? thumbnailFile.name : 'Click to upload thumbnail'}
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (seconds)
            </label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter video duration in seconds"
              required
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PDF Resources (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4">
              <input
                type="file"
                accept=".pdf"
                multiple
                onChange={handlePdfChange}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="flex flex-col items-center cursor-pointer"
              >
                <File className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {pdfFiles.length > 0 
                    ? `${pdfFiles.length} PDF file(s) selected`
                    : 'Click to upload PDF files'
                  }
                </span>
              </label>
            </div>
            {pdfFiles.length > 0 && (
              <div className="mt-2 space-y-1">
                {pdfFiles.map((file, index) => (
                  <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    {file.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Lesson'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
