import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Subject } from './models/Subject.js';
import { Lesson } from './models/Lesson.js';
import { User } from './models/User.js';
import crypto from 'crypto';
import { execSync } from 'child_process';
import ffmpeg from 'ffmpeg-static';

// Create static teacher account if it doesn't exist
const createStaticTeacher = async () => {
  try {
    const existingTeacher = await User.findOne({ phoneNumber: '5555' });
    if (!existingTeacher) {
      const teacher = new User({
        name: 'Dr. Teacher',
        phoneNumber: '5555',
        password: '5555',
        role: 'teacher'
      });
      await teacher.save();
      console.log('Static teacher account created');
    }
  } catch (error) {
    console.error('Error creating static teacher:', error);
  }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create HLS directories and encryption keys
const hlsDir = path.join(__dirname, 'hls');
const keysDir = path.join(__dirname, 'keys');
if (!fs.existsSync(hlsDir)) {
  fs.mkdirSync(hlsDir, { recursive: true });
}
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

// HLS encryption function
const createHLSEncryption = (videoId) => {
  const keyPath = path.join(keysDir, `${videoId}.key`);
  const keyInfoPath = path.join(keysDir, `${videoId}.keyinfo`);
  
  if (!fs.existsSync(keyPath)) {
    const key = crypto.randomBytes(16);
    fs.writeFileSync(keyPath, key);
    fs.writeFileSync(keyInfoPath, `${videoId}.key\n${keyPath}\n`);
  }
  
  return { keyPath, keyInfoPath };
};

// Process video to HLS with encryption
const processVideoToHLS = async (inputPath, videoId) => {
  try {
    const { keyInfoPath } = createHLSEncryption(videoId);
    const outputDir = path.join(hlsDir, videoId);
    const outputPath = path.join(outputDir, 'index.m3u8');
    
    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    if (!fs.existsSync(outputPath)) {
      console.log(`🔄 Processing video ${videoId} to encrypted HLS...`);
        // FFmpeg command with proper segment naming
      const segmentPattern = path.join(outputDir, 'segment_%03d.ts').replace(/\\/g, '/');
      const command = `"${ffmpeg}" -i "${inputPath}" -c:v libx264 -c:a aac -hls_time 10 -hls_key_info_file "${keyInfoPath}" -hls_playlist_type vod -hls_segment_filename "${segmentPattern}" "${outputPath}"`;
      
      try {
        execSync(command, { stdio: 'inherit' });
        
        // Update m3u8 file to use correct key URL
        if (fs.existsSync(outputPath)) {
          let m3u8Content = fs.readFileSync(outputPath, 'utf8');
          m3u8Content = m3u8Content.replace(`URI="${videoId}.key"`, `URI="/api/hls/key/${videoId}"`);
          fs.writeFileSync(outputPath, m3u8Content);
        }
        
        console.log(`✅ Video ${videoId} processed successfully`);
      } catch (ffmpegError) {
        console.error('FFmpeg error:', ffmpegError);
        throw ffmpegError;
      }
    }
    
    return `/api/hls/${videoId}/index.m3u8`;
  } catch (error) {
    console.error('Error processing video to HLS:', error);
    throw error;
  }
};

// Serve static files
app.use('/uploads', express.static(uploadsDir));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'video') {
      if (file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only video files are allowed for video field'), false);
      }
    } else if (file.fieldname === 'thumbnail') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for thumbnail field'), false);
      }
    } else if (file.fieldname === 'pdfs') {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed for pdfs field'), false);
      }
    } else {
      cb(null, true);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:Gckbm3vbtphhnxai@cluster0.cdc8rmo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    createStaticTeacher();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { phoneNumber, password, role } = req.body;
    
    const user = await User.findOne({ phoneNumber, role });
    
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const userResponse = {
      id: user._id,
      name: user.name,
      phoneNumber: user.phoneNumber,
      role: user.role,
      avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`,
      createdAt: user.createdAt
    };
    
    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, phoneNumber, password, role } = req.body;
    
    // Only allow student registration
    if (role === 'teacher') {
      return res.status(403).json({ message: 'Teacher registration is not allowed' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this phone number' });
    }
    
    // Create new student user
    const user = new User({
      name,
      phoneNumber,
      password,
      role: 'student', // Force role to be student
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`
    });
    
    const savedUser = await user.save();
    
    const userResponse = {
      id: savedUser._id,
      name: savedUser.name,
      phoneNumber: savedUser.phoneNumber,
      role: savedUser.role,
      avatar: savedUser.avatar,
      createdAt: savedUser.createdAt
    };
    
    res.status(201).json(userResponse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all subjects
app.get('/api/subjects', async (req, res) => {
  try {
    const subjects = await Subject.find();
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new subject with file upload
app.post('/api/subjects', upload.single('thumbnail'), async (req, res) => {
  try {
    const subjectData = req.body;
    
    // Handle thumbnail file
    if (req.file) {
      subjectData.thumbnail = `/uploads/${req.file.filename}`;
    }
    
    const subject = new Subject(subjectData);
    const savedSubject = await subject.save();
    res.status(201).json(savedSubject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Enrollment endpoints
// Enroll student in a subject
app.post('/api/enroll/:subjectId', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ message: 'Invalid subject ID format' });
    }

    // Find user and subject
    const user = await User.findById(userId);
    const subject = await Subject.findById(subjectId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Check if already enrolled
    if (user.enrolledSubjects.includes(subjectId)) {
      return res.json({ message: 'Already enrolled', isEnrolled: true });
    }

    // Add subject to user's enrolled subjects
    user.enrolledSubjects.push(subjectId);
    await user.save();

    // Increment students count in subject
    subject.studentsCount = (subject.studentsCount || 0) + 1;
    await subject.save();

    res.json({ 
      message: 'Successfully enrolled', 
      isEnrolled: true,
      studentsCount: subject.studentsCount 
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Unenroll student from a subject
app.post('/api/unenroll/:subjectId', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ message: 'Invalid subject ID format' });
    }

    // Find user and subject
    const user = await User.findById(userId);
    const subject = await Subject.findById(subjectId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Check if enrolled
    if (!user.enrolledSubjects.includes(subjectId)) {
      return res.json({ message: 'Not enrolled', isEnrolled: false });
    }

    // Remove subject from user's enrolled subjects
    user.enrolledSubjects = user.enrolledSubjects.filter(id => id.toString() !== subjectId);
    await user.save();

    // Decrement students count in subject
    subject.studentsCount = Math.max((subject.studentsCount || 1) - 1, 0);
    await subject.save();

    res.json({ 
      message: 'Successfully unenrolled', 
      isEnrolled: false,
      studentsCount: subject.studentsCount 
    });
  } catch (error) {
    console.error('Unenrollment error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Check enrollment status
app.get('/api/enrollment/:userId/:subjectId', async (req, res) => {
  try {
    const { userId, subjectId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isEnrolled = user.enrolledSubjects.includes(subjectId);
    res.json({ isEnrolled });
  } catch (error) {
    console.error('Enrollment check error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user's enrolled subjects
app.get('/api/user/:userId/enrollments', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await User.findById(userId).populate('enrolledSubjects');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ enrolledSubjects: user.enrolledSubjects });
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all lessons
app.get('/api/lessons', async (req, res) => {
  try {
    const lessons = await Lesson.find();
    // Convert ObjectId to string for subjectId to match frontend filtering
    const formattedLessons = lessons.map(lesson => ({
      ...lesson.toObject(),
      id: lesson._id.toString(),
      subjectId: lesson.subjectId.toString()
    }));
    res.json(formattedLessons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new lesson with file uploads
app.post('/api/lessons', upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
  { name: 'pdfs', maxCount: 10 }
]), async (req, res) => {
  try {
    console.log('Received lesson request:', req.body);
    console.log('Files:', req.files);
    
    let lessonData;
    try {
      lessonData = typeof req.body.lessonData === 'string' 
        ? JSON.parse(req.body.lessonData)
        : req.body.lessonData;
    } catch (error) {
      console.error('Error parsing lessonData:', error);
      return res.status(400).json({ message: 'Invalid lesson data format' });
    }

    console.log('Parsed lessonData.subjectId:', lessonData.subjectId);

    if (!lessonData.subjectId) {
      return res.status(400).json({ message: 'subjectId is required' });
    }

    // Validate subjectId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(lessonData.subjectId)) {
      return res.status(400).json({ message: 'Invalid subject ID format' });
    }

    // Check if subject exists
    const subject = await Subject.findById(lessonData.subjectId);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }    // Handle video file and process to HLS
    if (req.files.video) {
      const videoFile = req.files.video[0];
      const videoId = `lesson-${Date.now()}`;
      const videoPath = path.join(__dirname, 'uploads', videoFile.filename);
      
      try {
        // Process video to encrypted HLS
        const hlsUrl = await processVideoToHLS(videoPath, videoId);
        lessonData.videoUrl = hlsUrl;
        lessonData.videoId = videoId; // Store video ID for key retrieval
        console.log(`✅ HLS URL created: ${hlsUrl}`);
      } catch (error) {
        console.error('Error processing video to HLS:', error);
        // Fallback to regular video URL if HLS processing fails
        lessonData.videoUrl = `/uploads/${videoFile.filename}`;
        console.log(`⚠️ Using fallback video URL: ${lessonData.videoUrl}`);
      }
    }
    
    // Handle thumbnail file
    if (req.files.thumbnail) {
      lessonData.thumbnail = `/uploads/${req.files.thumbnail[0].filename}`;
    }
      // Handle PDF files
    if (req.files.pdfs) {
      lessonData.pdfFiles = req.files.pdfs.map(file => {
        // Properly decode the filename to handle Arabic characters
        let decodedName = file.originalname;
        try {
          // If the filename is URL encoded, decode it
          if (decodedName.includes('%')) {
            decodedName = decodeURIComponent(decodedName);
          }
          // Ensure proper UTF-8 encoding
          decodedName = Buffer.from(decodedName, 'latin1').toString('utf8');
        } catch (e) {
          console.log('Filename encoding error:', e);
          // Keep original name if decoding fails
          decodedName = file.originalname;
        }
        
        return {
          id: `pdf-${Date.now()}-${Math.random()}`,
          name: decodedName,
          url: `/uploads/${file.filename}`,
          size: file.size
        };
      });
    }
    
    const lesson = new Lesson(lessonData);
    const savedLesson = await lesson.save();
    
    // Update subject's lesson count
    await Subject.findByIdAndUpdate(
      lessonData.subjectId,
      { $inc: { lessonsCount: 1 } }
    );
    
    res.status(201).json(savedLesson);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Create new lesson (JSON only - for backward compatibility)
app.post('/api/lessons-json', async (req, res) => {
  try {
    console.log('Received lesson JSON request:', req.body);

    if (!req.body.subjectId) {
      return res.status(400).json({ message: 'subjectId is required' });
    }

    // Validate subjectId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.body.subjectId)) {
      return res.status(400).json({ message: 'Invalid subject ID format' });
    }

    // Check if subject exists
    const subject = await Subject.findById(req.body.subjectId);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const lesson = new Lesson(req.body);
    const savedLesson = await lesson.save();
    
    // Update subject's lesson count
    await Subject.findByIdAndUpdate(
      req.body.subjectId,
      { $inc: { lessonsCount: 1 } }
    );
    
    res.status(201).json(savedLesson);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get lessons by subject
app.get('/api/subjects/:subjectId/lessons', async (req, res) => {
  try {
    const lessons = await Lesson.find({ subjectId: req.params.subjectId });
    // Convert ObjectId to string for subjectId to match frontend filtering
    const formattedLessons = lessons.map(lesson => ({
      ...lesson.toObject(),
      id: lesson._id.toString(),
      subjectId: lesson.subjectId.toString()
    }));
    res.json(formattedLessons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update lesson views
app.patch('/api/lessons/:id/view', async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewsCount: 1 } },
      { new: true }
    );
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// HLS streaming routes
// Serve HLS manifests
app.get('/api/hls/:videoId/index.m3u8', (req, res) => {
  const { videoId } = req.params;
  const hlsPath = path.join(hlsDir, videoId, 'index.m3u8');
  
  if (fs.existsSync(hlsPath)) {
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.sendFile(hlsPath);
  } else {
    res.status(404).json({ message: 'HLS manifest not found' });
  }
});

// Serve encryption keys (with security) - Must come before segment route
app.get('/api/hls/key/:videoId', (req, res) => {
  const { videoId } = req.params;
  const keyPath = path.join(keysDir, `${videoId}.key`);
  
  if (fs.existsSync(keyPath)) {
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.sendFile(keyPath);
  } else {
    res.status(404).json({ message: 'Encryption key not found' });
  }
});

// Serve HLS segments
app.get('/api/hls/:videoId/:segment', (req, res) => {
  const { videoId, segment } = req.params;
  const segmentPath = path.join(hlsDir, videoId, segment);
  
  if (fs.existsSync(segmentPath)) {
    if (segment.endsWith('.ts')) {
      res.setHeader('Content-Type', 'video/mp2t');
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.sendFile(segmentPath);
  } else {
    res.status(404).json({ message: 'Segment not found' });
  }
});

// Convert existing lesson to HLS
app.post('/api/lessons/:id/convert-hls', async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    // Check if already HLS
    if (lesson.videoUrl.includes('/api/hls/')) {
      return res.json({ message: 'Lesson already uses HLS', videoUrl: lesson.videoUrl });
    }

    // Convert to HLS
    const videoId = `lesson-${lesson._id}-${Date.now()}`;
    const originalVideoPath = path.join(__dirname, 'uploads', path.basename(lesson.videoUrl));
    
    if (!fs.existsSync(originalVideoPath)) {
      return res.status(404).json({ message: 'Original video file not found' });
    }

    try {
      const hlsUrl = await processVideoToHLS(originalVideoPath, videoId);
      
      // Update lesson with HLS URL
      lesson.videoUrl = hlsUrl;
      lesson.videoId = videoId;
      await lesson.save();
      
      res.json({ 
        message: 'Video converted to HLS successfully', 
        videoUrl: hlsUrl,
        videoId: videoId 
      });
    } catch (error) {
      console.error('HLS conversion error:', error);
      res.status(500).json({ message: 'Failed to convert video to HLS', error: error.message });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Auto-convert existing videos to HLS
const convertExistingVideosToHLS = async () => {
  try {
    console.log('🔄 Checking for videos to convert to HLS...');
    const lessons = await Lesson.find({ 
      $or: [
        { videoUrl: { $not: /\/api\/hls\// } },
        { videoUrl: { $exists: true, $not: /\.m3u8$/ } }
      ]
    });

    console.log(`Found ${lessons.length} videos to convert to HLS`);

    for (const lesson of lessons) {
      if (!lesson.videoUrl.includes('/api/hls/') && !lesson.videoUrl.includes('.m3u8')) {
        try {
          const videoId = `lesson-${lesson._id}-${Date.now()}`;
          const originalVideoPath = path.join(__dirname, 'uploads', path.basename(lesson.videoUrl));
          
          if (fs.existsSync(originalVideoPath)) {
            console.log(`🔄 Converting lesson "${lesson.title}" to HLS...`);
            const hlsUrl = await processVideoToHLS(originalVideoPath, videoId);
            
            lesson.videoUrl = hlsUrl;
            lesson.videoId = videoId;
            await lesson.save();
            
            console.log(`✅ Converted lesson "${lesson.title}" to HLS: ${hlsUrl}`);
          } else {
            console.log(`⚠️ Video file not found for lesson "${lesson.title}": ${originalVideoPath}`);
          }
        } catch (error) {
          console.error(`❌ Failed to convert lesson "${lesson.title}":`, error.message);
        }
      }
    }
    
    console.log('✅ Finished converting existing videos to HLS');
  } catch (error) {
    console.error('❌ Error during auto-conversion:', error);
  }
};

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Auto-convert existing videos to HLS after server starts
  setTimeout(() => {
    convertExistingVideosToHLS();
  }, 2000); // Wait 2 seconds for server to be fully ready
});
