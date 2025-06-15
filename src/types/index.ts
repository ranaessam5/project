export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  role: 'teacher' | 'student';
  avatar?: string;
  createdAt: Date;
}

export interface Subject {
  _id: string;  // MongoDB ObjectId
  id: string;   // Keep for backward compatibility
  name: string;
  description: string;
  teacherId: string;
  teacherName: string;
  thumbnail?: string;
  createdAt: Date;
  lessonsCount: number;
  studentsCount: number;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  teacherId: string;
  videoUrl: string;
  duration: number;
  thumbnail?: string;
  pdfFiles: PDFFile[];
  createdAt: Date;
  viewsCount: number;
}

export interface PDFFile {
  id: string;
  name: string;
  url: string;
  size: number;
}

export interface Comment {
  id: string;
  lessonId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
  replies: Comment[];
}

export interface Enrollment {
  id: string;
  studentId: string;
  subjectId: string;
  enrolledAt: Date;
  progress: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'lesson' | 'enrollment' | 'system';
  read: boolean;
  createdAt: Date;
}