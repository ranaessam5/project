import React, { useState } from 'react';
import { Play, Clock, Users, FileText, BookOpen, Lock } from 'lucide-react';
import { Subject, Lesson } from '../../types';
import { EnrollmentButton } from './EnrollmentButton';

interface StudentDashboardProps {
  subjects: Subject[];
  lessons: Lesson[];
  onSelectLesson: (lesson: Lesson) => void;
  onEnroll: (subjectId: string) => Promise<any>;
  onUnenroll: (subjectId: string) => Promise<any>;
  isEnrolledInSubject: (subjectId: string) => boolean;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  subjects,
  lessons,
  onSelectLesson,
  onEnroll,
  onUnenroll,
  isEnrolledInSubject,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const filteredLessons = selectedSubject
    ? lessons.filter(lesson => {
        // Try both direct comparison and string comparison
        return lesson.subjectId === selectedSubject || lesson.subjectId.toString() === selectedSubject;
      })
    : lessons;

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8 text-white">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Welcome to Your Learning Journey
        </h1>
        <p className="text-xl opacity-90 mb-6">
          Explore high-quality courses from expert instructors
        </p>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5" />
            <span>{subjects.length} Subjects Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <Play className="w-5 h-5" />
            <span>{lessons.length} Video Lessons</span>
          </div>
        </div>
      </div>

      {/* Subject Filter */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Browse by Subject</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedSubject(null)}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              selectedSubject === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Subjects
          </button>
          {subjects.map(subject => (
            <button
              key={subject.id}
              onClick={() => setSelectedSubject(subject.id)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                selectedSubject === subject.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="arabic-text">{subject.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
        {subjects.map(subject => (
          <div key={subject.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden rounded-t-2xl">
              {subject.thumbnail ? (
                <>
                  <img
                    src={subject.thumbnail}
                    alt={subject.name}
                    className="thumbnail-image transition-transform duration-300 hover:scale-105"
                    style={{ objectFit: 'cover', objectPosition: 'center' }}
                    onError={(e) => {
                      console.log('Subject thumbnail failed to load:', subject.thumbnail);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                    onLoad={() => {
                      console.log('Subject thumbnail loaded successfully:', subject.thumbnail);
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20 z-10"></div>
                </>
              ) : (
                <div className="thumbnail-fallback bg-gradient-to-br from-blue-500 to-purple-600">
                  <div className="text-white text-4xl opacity-50">
                    <BookOpen className="w-16 h-16" />
                  </div>
                </div>
              )}
              <div className="absolute bottom-4 left-4 text-white z-20">
                <h3 className="text-lg lg:text-xl font-bold mb-1 arabic-text drop-shadow-lg">{subject.name}</h3>
                <p className="text-sm opacity-90 arabic-text drop-shadow-md">{subject.teacherName}</p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4 arabic-text">{subject.description}</p>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-1">
                  <Play className="w-4 h-4" />
                  <span>{subject.lessonsCount} lessons</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{subject.studentsCount} students</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <EnrollmentButton
                  subjectId={subject.id}
                  isEnrolled={isEnrolledInSubject(subject.id)}
                  onEnroll={onEnroll}
                  onUnenroll={onUnenroll}
                />
                <button
                  onClick={() => setSelectedSubject(subject.id)}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  View Lessons
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lessons List */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {selectedSubject ? 'Lessons in Selected Subject' : 'Recent Lessons'}
        </h2>
        <div className="space-y-4">
          {filteredLessons.map(lesson => {
            const isLessonAccessible = isEnrolledInSubject(lesson.subjectId);
            return (
              <div
                key={lesson.id}
                className={`bg-white rounded-2xl shadow-md p-6 transition-shadow ${
                  isLessonAccessible 
                    ? 'hover:shadow-lg cursor-pointer' 
                    : 'opacity-75 cursor-not-allowed'
                }`}
                onClick={() => isLessonAccessible && onSelectLesson(lesson)}
              >
              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
                <div className="thumbnail-container-fixed group">
                  {lesson.thumbnail ? (
                    <>
                      <img
                        src={lesson.thumbnail}
                        alt={lesson.title}
                        className="thumbnail-fixed-size"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 transition-opacity duration-300 group-hover:bg-opacity-40 z-10">
                        <div className="bg-white bg-opacity-90 rounded-full p-3 transition-transform duration-300 group-hover:scale-110">
                          <Play className="w-8 h-8 text-blue-600" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <div className="bg-blue-600 rounded-full p-4">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 arabic-text line-clamp-2">{lesson.title}</h3>
                  <p className="text-gray-600 mb-3 arabic-text line-clamp-2 text-sm md:text-base">{lesson.description}</p>
                  <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>{formatDuration(lesson.duration)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span>{lesson.pdfFiles.length} resources</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Play className="w-4 h-4 flex-shrink-0" />
                      <span>{lesson.viewsCount} views</span>
                    </div>
                  </div>
                </div>
                {isLessonAccessible ? (
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2">
                    <Play className="w-5 h-5" />
                    <span>Watch Now</span>
                  </button>
                ) : (
                  <div className="bg-gray-300 text-gray-500 px-6 py-3 rounded-xl font-medium flex items-center space-x-2">
                    <Lock className="w-5 h-5" />
                    <span>Enroll to Access</span>
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};