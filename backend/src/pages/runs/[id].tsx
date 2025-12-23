import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import ProtectedRoute from '../../components/ProtectedRoute';

interface Run {
  id: number;
  runName: string;
  runDescription: string;
  querySetName: string;
  status: string;
  totalExecutionTimeMs: number;
  createdAt: string;
  completedAt: string;
}

interface QueryResult {
  id: number;
  queryName: string;
  iterationNumber: number;
  executionTimeMs: number;
  rowCount: number;
  status: string;
  errorMessage: string;
}

export default function RunDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [run, setRun] = useState<Run | null>(null);
  const [results, setResults] = useState<QueryResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchRunDetails();
    }
  }, [id]);

  const fetchRunDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // In a real implementation, you'd have a dedicated API endpoint
      // For now, we'll fetch from the runs list and filter
      const response = await fetch('/api/runs', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch run details');

      const data = await response.json();
      const foundRun = data.runs.find((r: Run) => r.id === parseInt(id as string));
      
      if (!foundRun) throw new Error('Run not found');
      
      setRun(foundRun);
      
      // TODO: Fetch actual query results when API is ready
      setResults([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  const formatExecutionTime = (ms: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex justify-center py-12">
            <div className="spinner"></div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (error || !run) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="alert alert-error">
            <p>{error || 'Run not found'}</p>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          {/* Run Header */}
          <div className="card">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {run.runName}
            </h1>
            {run.runDescription && (
              <p className="text-gray-600 mb-4">{run.runDescription}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Query Set</p>
                <p className="font-semibold">{run.querySetName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span
                  className={`badge ${
                    run.status === 'completed'
                      ? 'badge-success'
                      : run.status === 'failed'
                      ? 'badge-error'
                      : 'badge-warning'
                  }`}
                >
                  {run.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Execution Time</p>
                <p className="font-semibold">
                  {formatExecutionTime(run.totalExecutionTimeMs)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="font-semibold text-sm">{formatDate(run.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Query Results */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Query Results
            </h2>

            {results.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                {run.status === 'running' ? (
                  <>
                    <div className="spinner mx-auto mb-4"></div>
                    <p>Execution in progress...</p>
                  </>
                ) : (
                  <p>No results available for this run.</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Query</th>
                      <th>Iteration</th>
                      <th>Status</th>
                      <th>Execution Time</th>
                      <th>Rows</th>
                      <th>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result) => (
                      <tr key={result.id}>
                        <td>{result.queryName}</td>
                        <td>{result.iterationNumber}</td>
                        <td>
                          <span
                            className={`badge ${
                              result.status === 'success'
                                ? 'badge-success'
                                : 'badge-error'
                            }`}
                          >
                            {result.status}
                          </span>
                        </td>
                        <td>{formatExecutionTime(result.executionTimeMs)}</td>
                        <td>{result.rowCount}</td>
                        <td className="text-sm text-red-600">
                          {result.errorMessage || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
