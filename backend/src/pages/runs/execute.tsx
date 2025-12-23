import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import ProtectedRoute from '../../components/ProtectedRoute';

interface QuerySet {
  id: number;
  querySetName: string;
}

export default function ExecuteRunPage() {
  const router = useRouter();
  const { querySetId } = router.query;
  const [querySet, setQuerySet] = useState<QuerySet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    runDescription: '',
    iterations: '1',
    concurrentRuns: '1',
  });

  useEffect(() => {
    if (querySetId) {
      fetchQuerySet();
    }
  }, [querySetId]);

  const fetchQuerySet = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/query-sets/${querySetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setQuerySet(data.querySet);
      }
    } catch (err) {
      console.error('Failed to fetch query set:', err);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/runs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          querySetId: parseInt(querySetId as string),
          runDescription: formData.runDescription || undefined,
          iterations: parseInt(formData.iterations),
          concurrentRuns: parseInt(formData.concurrentRuns),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to execute run');
      }

      const data = await response.json();
      setSuccess(true);
      
      setTimeout(() => {
        router.push(`/runs/${data.run.id}`);
      }, 1500);
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Execute Query Set
            </h1>
            {querySet && (
              <p className="text-gray-600 mb-6">
                Query Set: <span className="font-semibold">{querySet.querySetName}</span>
              </p>
            )}

            {error && (
              <div className="alert alert-error mb-4">
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="alert alert-success mb-4">
                <p>Run started successfully! Redirecting to run details...</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="runDescription" className="form-label">
                    Run Description (Optional)
                  </label>
                  <textarea
                    id="runDescription"
                    value={formData.runDescription}
                    onChange={(e) =>
                      setFormData({ ...formData, runDescription: e.target.value })
                    }
                    className="form-textarea"
                    rows={3}
                    placeholder="Optional description for this run..."
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Run name will be auto-generated with timestamp
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="iterations" className="form-label">
                      Iterations
                    </label>
                    <input
                      id="iterations"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.iterations}
                      onChange={(e) =>
                        setFormData({ ...formData, iterations: e.target.value })
                      }
                      className="form-input"
                      required
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Number of times to run each query
                    </p>
                  </div>

                  <div>
                    <label htmlFor="concurrentRuns" className="form-label">
                      Concurrent Runs
                    </label>
                    <input
                      id="concurrentRuns"
                      type="number"
                      min="1"
                      max="10"
                      value={formData.concurrentRuns}
                      onChange={(e) =>
                        setFormData({ ...formData, concurrentRuns: e.target.value })
                      }
                      className="form-input"
                      required
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Number of parallel executions
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
                  <p className="text-sm text-yellow-800">
                    <span className="font-semibold">Note:</span> Maximum 5 concurrent runs allowed per user.
                    Execution will fail if this limit is exceeded.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  disabled={loading || success}
                  className="btn btn-success disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <span className="spinner mr-2"></span>
                      Starting Execution...
                    </span>
                  ) : success ? (
                    'Run Started!'
                  ) : (
                    'Start Execution'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Execution Info */}
          <div className="card mt-6 bg-blue-50">
            <h3 className="font-semibold text-gray-800 mb-2">
              How Execution Works:
            </h3>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>All queries in the set will be executed sequentially</li>
              <li>Each query will run for the specified number of iterations</li>
              <li>Execution times and results will be recorded</li>
              <li>You can compare this run with others later</li>
              <li>Individual query failures won't stop the entire set</li>
            </ul>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
