import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  teacherId: {
    type: String,
    required: true
  },
  teacherName: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    required: true
  },
  lessonsCount: {
    type: Number,
    default: 0
  },
  studentsCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const Subject = mongoose.model('Subject', subjectSchema);
