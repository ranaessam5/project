import React, { useState } from 'react';
import { Plus, BarChart3, Users, Video, FileText, Eye } from 'lucide-react';
import { Subject, Lesson } from '../../types';

interface TeacherDashboardProps {
  subjects: Subject[];
  lessons: Lesson[];
  teacherId: string;
  onCreateSubject: () => void;
  onCreateLesson: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  subjects,
  lessons,
  teacherId,
  onCreateSubject,
  onCreateLesson,
}) => {
  const teacherSubjects = subjects.filter(s => s.teacherId === teacherId);
  const teacherLessons = lessons.filter(l => l.teacherId === teacherId);
  
  const totalStudents = teacherSubjects.reduce((sum, subject) => sum + subject.studentsCount, 0);
  const totalViews = teacherLessons.reduce((sum, lesson) => sum + lesson.viewsCount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Teacher Dashboard</h1>
          <p className="text-gray-600">Manage your courses and track student progress</p>
        </div>
        <div className="flex space-x-4 mt-4 md:mt-0">
          <button
            onClick={onCreateSubject}
            className="bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Subject</span>
          </button>
          <button
            onClick={onCreateLesson}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Lesson</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Subjects</p>
              <p className="text-3xl font-bold text-gray-900">{teacherSubjects.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Lessons</p>
              <p className="text-3xl font-bold text-gray-900">{teacherLessons.length}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <Video className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-3xl font-bold text-gray-900">{totalStudents}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-xl">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="text-3xl font-bold text-gray-900">{totalViews}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-xl">
              <Eye className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Subjects */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Subjects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teacherSubjects.map(subject => (
            <div key={subject.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 relative">
                {subject.thumbnail && (
                  <img
                    src={subject.thumbnail}
                    alt={subject.name}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-xl font-bold">{subject.name}</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">{subject.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <Video className="w-4 h-4" />
                    <span>{subject.lessonsCount} lessons</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{subject.studentsCount} students</span>
                  </div>
                </div>
                <button className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors">
                  Manage Subject
                </button>
              </div>
            </div>
          ))}
          
          {/* Create Subject Card */}
          <div
            onClick={onCreateSubject}
            className="bg-white rounded-2xl shadow-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all min-h-[300px]"
          >
            <div className="text-center">
              <Plus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700">Create New Subject</h3>
              <p className="text-gray-500">Add a new subject to start teaching</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Lessons */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Lessons</h2>
        <div className="space-y-4">
          {teacherLessons.slice(0, 5).map(lesson => (
            <div key={lesson.id} className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
                <div className="w-full md:w-48 aspect-video bg-gray-200 rounded-xl overflow-hidden">
                  {lesson.thumbnail && (
                    <img
                      src={lesson.thumbnail}
                      alt={lesson.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{lesson.title}</h3>
                  <p className="text-gray-600 mb-3">{lesson.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{lesson.viewsCount} views</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText className="w-4 h-4" />
                      <span>{lesson.pdfFiles.length} resources</span>
                    </div>
                  </div>
                </div>
                <button className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors">
                  Edit Lesson
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};