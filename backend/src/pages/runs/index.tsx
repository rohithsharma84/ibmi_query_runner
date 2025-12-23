import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';

interface Run {
  id: number;
  runName: string;
  runDescription: string;
  querySetName: string;
  querySetId: number;
  status: string;
  createdAt: string;
  completedAt: string;
  totalExecutionTimeMs: number;
  iterations: number;
  concurrentRuns: number;
}

export default function RunsPage() {
  const router = useRouter();
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRuns();
  }, []);

  const fetchRuns = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/runs', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch runs');

      const data = await response.json();
      setRuns(data.runs || []);
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

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">Query Runs</h1>
            <Link href="/comparisons" className="btn btn-secondary">
              Compare Runs
            </Link>
          </div>

          {error && (
            <div className="alert alert-error">
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="spinner"></div>
            </div>
          ) : runs.length === 0 ? (
            <div className="card text-center py-12">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Runs Yet
              </h3>
              <p className="text-gray-600 mb-4">
                Execute a query set to see runs here.
              </p>
              <Link href="/query-sets" className="btn btn-primary inline-block">
                Go to Query Sets
              </Link>
            </div>
          ) : (
            <div className="card">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Run Name</th>
                      <th>Query Set</th>
                      <th>Status</th>
                      <th>Iterations</th>
                      <th>Concurrent</th>
                      <th>Execution Time</th>
                      <th>Created</th>
                      <th>Completed</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map((run) => (
                      <tr key={run.id}>
                        <td>
                          <div>
                            <Link
                              href={`/runs/${run.id}`}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {run.runName}
                            </Link>
                            {run.runDescription && (
                              <p className="text-sm text-gray-600 mt-1">
                                {run.runDescription}
                              </p>
                            )}
                          </div>
                        </td>
                        <td>
                          <Link
                            href={`/query-sets/${run.querySetId}`}
                            className="text-blue-600 hover:underline"
                          >
                            {run.querySetName}
                          </Link>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              run.status === 'completed'
                                ? 'badge-success'
                                : run.status === 'failed'
                                ? 'badge-error'
                                : run.status === 'running'
                                ? 'badge-warning'
                                : 'badge-gray'
                            }`}
                          >
                            {run.status}
                          </span>
                        </td>
                        <td>{run.iterations}</td>
                        <td>{run.concurrentRuns}</td>
                        <td>{formatExecutionTime(run.totalExecutionTimeMs)}</td>
                        <td className="text-sm">{formatDate(run.createdAt)}</td>
                        <td className="text-sm">{formatDate(run.completedAt)}</td>
                        <td>
                          <Link
                            href={`/runs/${run.id}`}
                            className="btn btn-primary btn-sm"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
