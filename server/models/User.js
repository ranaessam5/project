import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['teacher', 'student'],
    required: true
  },  avatar: {
    type: String
  },
  enrolledSubjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const User = mongoose.model('User', userSchema);
