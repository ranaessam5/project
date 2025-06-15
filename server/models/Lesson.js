import mongoose from 'mongoose';

const pdfFileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  }
});

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  teacherId: {
    type: String,
    required: true
  },  videoUrl: {
    type: String,
    required: true
  },
  videoId: {
    type: String,
    required: false
  },
  duration: {
    type: Number,
    required: true
  },
  thumbnail: {
    type: String,
    required: true
  },
  pdfFiles: [pdfFileSchema],
  viewsCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const Lesson = mongoose.model('Lesson', lessonSchema);
