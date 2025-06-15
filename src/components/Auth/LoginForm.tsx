import React, { useState } from 'react';
import { User, Phone, GraduationCap, Users, Lock } from 'lucide-react';

interface LoginFormProps {
  onLogin: (user: any) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    password: '',
    role: 'student' as 'student' | 'teacher'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Authentication failed');
      }

      const user = await response.json();
      onLogin(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">EduCenter</h1>
          <p className="text-gray-600">Your gateway to quality education</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'student' })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  formData.role === 'student'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Users className="w-6 h-6 mx-auto mb-2" />
                <span className="text-sm font-medium">Student</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'teacher' })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  formData.role === 'teacher'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <GraduationCap className="w-6 h-6 mx-auto mb-2" />
                <span className="text-sm font-medium">Teacher</span>
              </button>
            </div>

            {(isRegistering) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your full name"
                    required={isRegistering}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${
                formData.role === 'teacher'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Please wait...' : (isRegistering ? 'Register' : 'Sign In')}
            </button>
          </form>

          {formData.role === 'student' ? (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError(null);
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {isRegistering ? 'Already have an account? Sign In' : 'New student? Register here'}
              </button>
            </div>
          ) : (
            <div className="mt-6 text-center text-sm text-gray-600">
              <p>Teacher account is pre-configured.</p>
              <p>Use phone: 5555, password: 5555</p>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>By signing in, you agree to our Terms of Service</p>
          </div>
        </div>
      </div>
    </div>
  );
};
