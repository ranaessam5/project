import React, { useState } from 'react';
import { UserPlus, UserMinus, Loader } from 'lucide-react';

interface EnrollmentButtonProps {
  subjectId: string;
  isEnrolled: boolean;
  onEnroll: (subjectId: string) => Promise<any>;
  onUnenroll: (subjectId: string) => Promise<any>;
}

export const EnrollmentButton: React.FC<EnrollmentButtonProps> = ({
  subjectId,
  isEnrolled,
  onEnroll,
  onUnenroll,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      if (isEnrolled) {
        await onUnenroll(subjectId);
      } else {
        await onEnroll(subjectId);
      }
    } catch (error) {
      console.error('Enrollment action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <button
        disabled
        className="bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
      >
        <Loader className="w-4 h-4 animate-spin" />
        <span>Processing...</span>
      </button>
    );
  }

  if (isEnrolled) {
    return (
      <button
        onClick={handleClick}
        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
      >
        <UserMinus className="w-4 h-4" />
        <span>Unenroll</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
    >
      <UserPlus className="w-4 h-4" />
      <span>Enroll</span>
    </button>
  );
};
