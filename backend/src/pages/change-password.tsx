import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import ProtectedRoute from '../components/ProtectedRoute';

export default function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { changePassword, user } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (oldPassword === newPassword) {
      setError('New password must be different from old password');
      return;
    }

    setLoading(true);

    try {
      await changePassword(oldPassword, newPassword);
      setSuccess('Password changed successfully!');
      
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Change Password
          </h1>
          
          {user?.passwordChangeRequired && (
            <div className="alert alert-warning mb-4">
              <p className="font-semibold">Password change required</p>
              <p className="text-sm mt-1">
                You must change your password before continuing.
              </p>
            </div>
          )}

          {error && (
            <div className="alert alert-error mb-4">
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="alert alert-success mb-4">
              <p>{success}</p>
              <p className="text-sm mt-1">Redirecting to dashboard...</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="oldPassword" className="form-label">
                Current Password
              </label>
              <input
                id="oldPassword"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="form-input"
                placeholder="Enter current password"
                required
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label htmlFor="newPassword" className="form-label">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="form-input"
                placeholder="Enter new password (min 8 characters)"
                required
                minLength={8}
              />
            </div>

            <div className="mb-6">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
                placeholder="Confirm new password"
                required
                minLength={8}
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
              
              {!user?.passwordChangeRequired && (
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="mt-6 text-sm text-gray-600">
            <p className="font-semibold">Password requirements:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Minimum 8 characters</li>
              <li>Must be different from current password</li>
              <li>Recommended: Use mix of letters, numbers, and symbols</li>
            </ul>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
