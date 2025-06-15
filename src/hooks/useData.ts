import { useState, useEffect } from 'react';
import { Subject, Lesson, Comment, Notification } from '../types';

const API_BASE_URL = '/api';

export const useData = (currentUser?: any) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [enrolledSubjects, setEnrolledSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subjectsRes, lessonsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/subjects`),
          fetch(`${API_BASE_URL}/lessons`)
        ]);

        if (!subjectsRes.ok || !lessonsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const subjectsData = await subjectsRes.json();
        const lessonsData = await lessonsRes.json();

        // Map _id to id for subjects
        const mappedSubjects = subjectsData.map((subject: any) => ({
          ...subject,
          id: subject._id,
        }));

        setSubjects(mappedSubjects);
        setLessons(lessonsData);

        // Fetch user's enrollments if user is logged in
        if (currentUser?.id) {
          console.log('User ID:', currentUser.id, 'Length:', currentUser.id.length);
          
          // Only fetch enrollments if user ID looks like a valid MongoDB ObjectId
          if (currentUser.id.length === 24 && /^[0-9a-fA-F]+$/.test(currentUser.id)) {
            try {
              const enrollmentsRes = await fetch(`${API_BASE_URL}/user/${currentUser.id}/enrollments`);
              if (enrollmentsRes.ok) {
                const enrollmentsData = await enrollmentsRes.json();
                const enrolledIds = enrollmentsData.enrolledSubjects.map((subject: any) => subject._id);
                setEnrolledSubjects(enrolledIds);
              } else {
                console.warn('Failed to fetch enrollments:', await enrollmentsRes.text());
              }
            } catch (err) {
              console.error('Failed to fetch enrollments:', err);
            }
          } else {
            console.warn('Invalid user ID format, clearing localStorage and requiring re-login');
            localStorage.removeItem('user');
            window.location.reload();
          }
        }

        setNotifications([
          {
            id: '1',
            userId: 'current-user',
            title: 'New Lesson Available',
            message: 'A new lesson has been added',
            type: 'lesson',
            read: false,
            createdAt: new Date(),
          },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const createSubject = async (subjectData: Omit<Subject, 'id' | 'createdAt'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/subjects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subjectData),
      });

      if (!response.ok) {
        throw new Error('Failed to create subject');
      }

      const newSubject = await response.json();
      setSubjects(prev => [...prev, newSubject]);
      return newSubject;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subject');
      throw err;
    }
  };

  const createLesson = async (formData: FormData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/lessons`, {
        method: 'POST',
        body: formData, // Send FormData directly without Content-Type header
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create lesson' }));
        throw new Error(errorData.message || 'Failed to create lesson');
      }

      const newLesson = await response.json();
      setLessons(prev => [...prev, newLesson]);
      return newLesson;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create lesson');
      throw err;
    }
  };

  const searchContent = (query: string) => {
    const filteredSubjects = subjects.filter(
      subject =>
        subject.name.toLowerCase().includes(query.toLowerCase()) ||
        subject.description.toLowerCase().includes(query.toLowerCase())
    );
    
    const filteredLessons = lessons.filter(
      lesson =>
        lesson.title.toLowerCase().includes(query.toLowerCase()) ||
        lesson.description.toLowerCase().includes(query.toLowerCase())
    );

    return { subjects: filteredSubjects, lessons: filteredLessons };
  };

  const enrollInSubject = async (subjectId: string) => {
    try {
      if (!currentUser?.id) {
        throw new Error('User not logged in');
      }

      // Validate user ID format
      if (currentUser.id.length !== 24 || !/^[0-9a-fA-F]+$/.test(currentUser.id)) {
        throw new Error('Invalid user ID format. Please log in again.');
      }

      const response = await fetch(`${API_BASE_URL}/enroll/${subjectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: currentUser.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to enroll');
      }

      const result = await response.json();
      
      // Update local state
      if (!enrolledSubjects.includes(subjectId)) {
        setEnrolledSubjects(prev => [...prev, subjectId]);
      }

      // Update subject's student count locally
      setSubjects(prev => prev.map(subject => 
        subject.id === subjectId 
          ? { ...subject, studentsCount: result.studentsCount }
          : subject
      ));

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll in subject');
      throw err;
    }
  };

  const unenrollFromSubject = async (subjectId: string) => {
    try {
      if (!currentUser?.id) {
        throw new Error('User not logged in');
      }

      // Validate user ID format
      if (currentUser.id.length !== 24 || !/^[0-9a-fA-F]+$/.test(currentUser.id)) {
        throw new Error('Invalid user ID format. Please log in again.');
      }

      const response = await fetch(`${API_BASE_URL}/unenroll/${subjectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: currentUser.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to unenroll');
      }

      const result = await response.json();
      
      // Update local state
      setEnrolledSubjects(prev => prev.filter(id => id !== subjectId));

      // Update subject's student count locally
      setSubjects(prev => prev.map(subject => 
        subject.id === subjectId 
          ? { ...subject, studentsCount: result.studentsCount }
          : subject
      ));

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unenroll from subject');
      throw err;
    }
  };

  const isEnrolledInSubject = (subjectId: string) => {
    return enrolledSubjects.includes(subjectId);
  };

  return {
    subjects,
    lessons,
    notifications,
    enrolledSubjects,
    loading,
    error,
    searchContent,
    createSubject,
    createLesson,
    enrollInSubject,
    unenrollFromSubject,
    isEnrolledInSubject,
  };
};
