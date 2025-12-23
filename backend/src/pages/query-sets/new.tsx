import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import ProtectedRoute from '../../components/ProtectedRoute';

interface Credential {
  id: number;
  credentialName: string;
  host: string;
  port: number;
}

export default function NewQuerySetPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    querySetName: '',
    description: '',
    credentialId: '',
  });

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/credentials', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCredentials(data.credentials || []);
      }
    } catch (err) {
      console.error('Failed to fetch credentials:', err);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/query-sets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          credentialId: parseInt(formData.credentialId),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create query set');
      }

      const data = await response.json();
      router.push(`/query-sets/${data.querySet.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
              Create New Query Set
            </h1>

            {error && (
              <div className="alert alert-error mb-4">
                <p>{error}</p>
              </div>
            )}

            {credentials.length === 0 && (
              <div className="alert alert-warning mb-4">
                <p className="font-semibold">No credentials available</p>
                <p className="text-sm mt-1">
                  Please ask an administrator to create database credentials first.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="querySetName" className="form-label">
                    Query Set Name *
                  </label>
                  <input
                    id="querySetName"
                    type="text"
                    value={formData.querySetName}
                    onChange={(e) =>
                      setFormData({ ...formData, querySetName: e.target.value })
                    }
                    className="form-input"
                    placeholder="e.g., Performance Test Queries"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="description" className="form-label">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="form-textarea"
                    rows={3}
                    placeholder="Optional description of this query set"
                  />
                </div>

                <div>
                  <label htmlFor="credentialId" className="form-label">
                    Database Credential *
                  </label>
                  <select
                    id="credentialId"
                    value={formData.credentialId}
                    onChange={(e) =>
                      setFormData({ ...formData, credentialId: e.target.value })
                    }
                    className="form-select"
                    required
                    disabled={credentials.length === 0}
                  >
                    <option value="">Select a credential...</option>
                    {credentials.map((cred) => (
                      <option key={cred.id} value={cred.id}>
                        {cred.credentialName} ({cred.host}:{cred.port})
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-600 mt-1">
                    The database connection to use for all queries in this set
                  </p>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  disabled={loading || credentials.length === 0}
                  className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Query Set'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/query-sets')}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
