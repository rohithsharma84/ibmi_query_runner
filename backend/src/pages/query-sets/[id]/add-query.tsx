import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import ProtectedRoute from '../../../components/ProtectedRoute';

export default function AddQueryPage() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    queryName: '',
    sqlText: '',
    description: '',
    qroHash: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/queries/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          qroHash: formData.qroHash || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add query');
      }

      router.push(`/query-sets/${id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="card">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Add Query</h1>

            {error && (
              <div className="alert alert-error mb-4">
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="queryName" className="form-label">
                    Query Name *
                  </label>
                  <input
                    id="queryName"
                    type="text"
                    value={formData.queryName}
                    onChange={(e) =>
                      setFormData({ ...formData, queryName: e.target.value })
                    }
                    className="form-input"
                    placeholder="e.g., Customer List Query"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="sqlText" className="form-label">
                    SQL Statement *
                  </label>
                  <textarea
                    id="sqlText"
                    value={formData.sqlText}
                    onChange={(e) =>
                      setFormData({ ...formData, sqlText: e.target.value })
                    }
                    className="form-textarea sql-editor"
                    rows={12}
                    placeholder="Enter your SQL query here..."
                    required
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Enter the complete SQL statement to execute
                  </p>
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
                    placeholder="Optional description or notes about this query"
                  />
                </div>

                <div>
                  <label htmlFor="qroHash" className="form-label">
                    QRO Hash (Optional)
                  </label>
                  <input
                    id="qroHash"
                    type="text"
                    value={formData.qroHash}
                    onChange={(e) =>
                      setFormData({ ...formData, qroHash: e.target.value })
                    }
                    className="form-input font-mono"
                    placeholder="e.g., 1A2B3C4D5E6F7G8H"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Query Reference Object hash for comparison tracking (from SQL Plan Cache)
                  </p>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding Query...' : 'Add Query'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/query-sets/${id}`)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* SQL Tips */}
          <div className="card mt-6 bg-blue-50">
            <h3 className="font-semibold text-gray-800 mb-2">SQL Tips:</h3>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>Use fully qualified table names (LIBRARY.TABLE)</li>
              <li>Avoid SELECT * in production queries</li>
              <li>Include WHERE clauses to limit result sets</li>
              <li>Consider using indexes for better performance</li>
              <li>Test queries before adding to production sets</li>
            </ul>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
