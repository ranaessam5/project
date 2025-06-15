import React, { useState } from 'react';
import { X, Image } from 'lucide-react';
import { Subject } from '../../types';

interface CreateSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (subjectData: Omit<Subject, 'id' | 'createdAt'>) => Promise<void>;
  teacherId: string;
  teacherName: string;
}

export const CreateSubjectModal: React.FC<CreateSubjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  teacherId,
  teacherName,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setThumbnailFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      
      // Add subject data
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('teacherId', teacherId);
      formDataToSend.append('teacherName', teacherName);
      formDataToSend.append('lessonsCount', '0');
      formDataToSend.append('studentsCount', '0');

      // Add thumbnail file if selected
      if (thumbnailFile) {
        formDataToSend.append('thumbnail', thumbnailFile);
      }

      const response = await fetch('/api/subjects', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('Failed to create subject');
      }

      const newSubject = await response.json();
      setFormData({ name: '', description: '' });
      setThumbnailFile(null);
      onClose();
      
      // Refresh the page to show the new subject
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subject');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Create New Subject</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter subject name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter subject description"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thumbnail Image
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="hidden"
                id="thumbnail-upload"
                required
              />
              <label
                htmlFor="thumbnail-upload"
                className="flex flex-col items-center cursor-pointer"
              >
                <Image className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {thumbnailFile ? thumbnailFile.name : 'Click to upload thumbnail'}
                </span>
              </label>
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
