# 🎓 Learning Management System (LMS)

A modern, full-stack Learning Management System built with React, TypeScript, Node.js, and MongoDB. Features include video streaming with HLS encryption, enrollment management, and a responsive UI.

## ✨ Features

### 🎥 **Video Management**
- **HLS Encryption**: Secure video streaming with encrypted segments
- **Multiple Formats**: Support for various video formats with automatic conversion
- **Thumbnails**: Automatic thumbnail generation for videos
- **Progress Tracking**: Video completion tracking and analytics

### 👥 **User Management**
- **Role-based Access**: Separate interfaces for teachers and students
- **Authentication**: Secure login/registration system
- **Enrollment System**: Students can enroll/unenroll from subjects

### 📚 **Content Management**
- **Subjects & Lessons**: Organize content hierarchically
- **File Uploads**: Support for videos, PDFs, and thumbnails
- **Search Functionality**: Find subjects and lessons quickly
- **Responsive Design**: Works on desktop, tablet, and mobile

### 🔒 **Security**
- **Video Encryption**: HLS with AES encryption
- **Access Control**: Enrollment-based content access
- **Secure File Handling**: Safe upload and storage

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (running locally or cloud)
- **FFmpeg** (for video processing)

### 1. Clone & Install
```bash
# Clone the repository
git clone <repository-url>
cd project

# Install all dependencies (client + server)
npm run setup
```

### 2. Environment Setup
Create a `.env` file in the `server` directory:
```env
MONGODB_URI=mongodb://localhost:27017/lms
PORT=5000
NODE_ENV=development
```

### 3. Start the Application
```bash
# Start both server and client in development mode
npm run start:dev

# Or start in production mode
npm start
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000

## 📂 Project Structure

```
project/
├── src/                          # React frontend
│   ├── components/              # React components
│   │   ├── Auth/               # Authentication components
│   │   ├── Student/            # Student dashboard & features
│   │   ├── Teacher/            # Teacher dashboard & features
│   │   ├── Video/              # Video player components
│   │   ├── Layout/             # Layout components
│   │   └── Modals/             # Modal dialogs
│   ├── hooks/                  # Custom React hooks
│   ├── types/                  # TypeScript type definitions
│   └── index.css              # Global styles
├── server/                     # Node.js backend
│   ├── models/                # MongoDB models
│   ├── uploads/               # File uploads
│   ├── hls/                   # HLS video segments
│   ├── keys/                  # Encryption keys
│   └── index.js              # Main server file
├── public/                    # Static files
└── package.json              # Dependencies & scripts
```

## 🛠️ Available Scripts

### Development
```bash
npm run start:dev      # Start both server and client in dev mode
npm run dev           # Start only the frontend
npm run server:dev    # Start only the server in dev mode
```

### Production
```bash
npm start            # Start both server and client
npm run build        # Build frontend for production
npm run preview      # Preview production build
```

### Setup & Maintenance
```bash
npm run setup         # Install all dependencies
npm run install:all   # Install client + server dependencies
npm run install:server # Install only server dependencies
npm run lint          # Run ESLint
```

## 🎯 Usage Guide

### For Teachers
1. **Login** with teacher credentials (phone: 5555, password: 5555)
2. **Create Subjects** with descriptions and thumbnails
3. **Upload Lessons** with videos, PDFs, and metadata
4. **Monitor** student enrollments and progress

### For Students
1. **Register** as a new student or login
2. **Browse Subjects** in the dashboard
3. **Enroll** in subjects to access content
4. **Watch Videos** with the enhanced video player
5. **Download Resources** (PDFs, materials)

## 🔧 Configuration

### Video Processing
The system automatically converts uploaded videos to HLS format with encryption:
- **Segments**: 10-second chunks
- **Encryption**: AES-128 encryption
- **Quality**: Configurable bitrates
- **Thumbnails**: Auto-generated from video

### Database Models
- **User**: Students and teachers with role-based access
- **Subject**: Course subjects with metadata
- **Lesson**: Individual lessons with videos and resources

### API Endpoints
- `POST /api/auth/login` - User authentication
- `GET /api/subjects` - List all subjects
- `GET /api/lessons` - List all lessons
- `POST /api/enroll/:subjectId` - Enroll in subject
- `GET /api/hls/:videoId/index.m3u8` - HLS playlist
- `GET /api/hls/key/:videoId` - Encryption keys

## 🚀 Deployment

### Development
```bash
npm run start:dev
```

### Production
1. **Build the frontend**:
   ```bash
   npm run build
   ```

2. **Set environment variables**:
   ```bash
   export NODE_ENV=production
   export MONGODB_URI=your-mongodb-connection
   ```

3. **Start the application**:
   ```bash
   npm start
   ```

### Docker (Optional)
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm run setup
RUN npm run build
EXPOSE 5000 5173
CMD ["npm", "start"]
```

## 🔐 Security Features

- **HLS Encryption**: Video content is encrypted with rotating keys
- **Access Control**: Content locked behind enrollment
- **File Validation**: Safe file upload handling
- **Authentication**: Secure login system
- **CORS Protection**: Configured for security

## 🎨 UI Features

- **Responsive Design**: Mobile-first approach
- **Modern Interface**: Clean, professional design
- **Video Player**: Custom player with full controls
- **Thumbnails**: Optimized image display (200x150px)
- **Loading States**: Smooth user experience
- **Error Handling**: Graceful error management

## 🐛 Troubleshooting

### Common Issues

1. **Video not playing**:
   - Check FFmpeg installation
   - Verify HLS files are generated
   - Check encryption keys

2. **MongoDB connection**:
   - Ensure MongoDB is running
   - Check connection string
   - Verify database permissions

3. **File uploads failing**:
   - Check disk space
   - Verify upload directory permissions
   - Check file size limits

### Debug Mode
Set `NODE_ENV=development` for detailed logging.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the console logs
3. Create an issue with detailed information

---

**Built with ❤️ using React, TypeScript, Node.js, and MongoDB**
