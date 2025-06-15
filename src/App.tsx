import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useData } from './hooks/useData';
import { LoginForm } from './components/Auth/LoginForm';
import { Header } from './components/Layout/Header';
import { StudentDashboard } from './components/Student/StudentDashboard';
import { TeacherDashboard } from './components/Teacher/TeacherDashboard';
import { VideoPlayer } from './components/Video/VideoPlayer';
import { CreateSubjectModal } from './components/Modals/CreateSubjectModal';
import { CreateLessonModal } from './components/Modals/CreateLessonModal';
import { Lesson, Subject } from './types';

function App() {
  const { user, loading: authLoading, login, logout } = useAuth();
  const { 
    subjects, 
    lessons, 
    notifications, 
    loading: dataLoading, 
    error, 
    searchContent, 
    createSubject, 
    createLesson,
    enrollInSubject,
    unenrollFromSubject,
    isEnrolledInSubject
  } = useData(user);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [searchResults, setSearchResults] = useState<{ subjects: any[], lessons: any[] } | null>(null);
  const [showCreateSubjectModal, setShowCreateSubjectModal] = useState(false);
  const [showCreateLessonModal, setShowCreateLessonModal] = useState(false);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      const results = searchContent(query);
      setSearchResults(results);
    } else {
      setSearchResults(null);
    }
  };

  const handleCreateSubject = () => {
    setShowCreateSubjectModal(true);
  };

  const handleCreateLesson = () => {
    setShowCreateLessonModal(true);
  };

  const handleSubmitSubject = async (subjectData: Omit<Subject, 'id' | 'createdAt'>) => {
    try {
      await createSubject(subjectData);
      setShowCreateSubjectModal(false);
    } catch (error) {
      console.error('Failed to create subject:', error);
    }
  };

  const handleSubmitLesson = async (formData: FormData) => {
    try {
      await createLesson(formData);
      setShowCreateLessonModal(false);
    } catch (error) {
      console.error('Failed to create lesson:', error);
    }
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLogin={login} />;
  }

  if (selectedLesson) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          user={user}
          onSearch={handleSearch}
          onLogout={logout}
          notifications={notifications.filter(n => !n.read).length}
        />
        <VideoPlayer
          lesson={selectedLesson}
          onBack={() => setSelectedLesson(null)}
        />
      </div>
    );
  }

  const displaySubjects = searchResults ? searchResults.subjects : subjects;
  const displayLessons = searchResults ? searchResults.lessons : lessons;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        user={user}
        onSearch={handleSearch}
        onLogout={logout}
        notifications={notifications.filter(n => !n.read).length}
      />
      
      {searchResults && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-blue-800">
              Found {displaySubjects.length} subjects and {displayLessons.length} lessons
            </p>
          </div>
        </div>
      )}

      {user.role === 'student' ? (
        <StudentDashboard
          subjects={displaySubjects}
          lessons={displayLessons}
          onSelectLesson={setSelectedLesson}
          onEnroll={enrollInSubject}
          onUnenroll={unenrollFromSubject}
          isEnrolledInSubject={isEnrolledInSubject}
        />
      ) : (
        <TeacherDashboard
          subjects={displaySubjects}
          lessons={displayLessons}
          teacherId={user.id}
          onCreateSubject={handleCreateSubject}
          onCreateLesson={handleCreateLesson}
        />
      )}

      {/* Modals */}
      <CreateSubjectModal
        isOpen={showCreateSubjectModal}
        onClose={() => setShowCreateSubjectModal(false)}
        onSubmit={handleSubmitSubject}
        teacherId={user?.id || ''}
        teacherName={user?.name || ''}
      />

      <CreateLessonModal
        isOpen={showCreateLessonModal}
        onClose={() => setShowCreateLessonModal(false)}
        onSubmit={handleSubmitLesson}
        teacherId={user?.id || ''}
        subjects={subjects.filter(s => s.teacherId === user?.id)}
      />
    </div>
  );
}

export default App;
