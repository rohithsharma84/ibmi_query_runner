import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../hooks/useAuth';

interface DashboardStats {
  querySetsCount: number;
  runsCount: number;
  queriesCount: number;
  recentRuns: Array<{
    id: number;
    runName: string;
    querySetName: string;
    status: string;
    createdAt: string;
    totalExecutionTimeMs: number;
  }>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch query sets count
      const querySetsRes = await fetch('/api/query-sets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const querySets = querySetsRes.ok ? await querySetsRes.json() : { querySets: [] };
      
      // Fetch runs
      const runsRes = await fetch('/api/runs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const runs = runsRes.ok ? await runsRes.json() : { runs: [] };

      // Calculate total queries
      let totalQueries = 0;
      for (const qs of querySets.querySets || []) {
        const queriesRes = await fetch(`/api/queries/${qs.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (queriesRes.ok) {
          const data = await queriesRes.json();
          totalQueries += data.queries?.length || 0;
        }
      }

      setStats({
        querySetsCount: querySets.querySets?.length || 0,
        runsCount: runs.runs?.length || 0,
        queriesCount: totalQueries,
        recentRuns: (runs.runs || []).slice(0, 5),
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const formatExecutionTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="card">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Welcome back, {user?.username}!
            </h1>
            <p className="text-gray-600">
              IBM i DB2 Query Testing Platform Dashboard
            </p>
          </div>

          {/* Stats Cards */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="spinner"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card bg-blue-50 border-l-4 border-blue-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">
                        Query Sets
                      </p>
                      <p className="text-3xl font-bold text-blue-600">
                        {stats?.querySetsCount || 0}
                      </p>
                    </div>
                    <svg
                      className="w-12 h-12 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                </div>

                <div className="card bg-green-50 border-l-4 border-green-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">
                        Total Queries
                      </p>
                      <p className="text-3xl font-bold text-green-600">
                        {stats?.queriesCount || 0}
                      </p>
                    </div>
                    <svg
                      className="w-12 h-12 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </div>

                <div className="card bg-purple-50 border-l-4 border-purple-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">
                        Total Runs
                      </p>
                      <p className="text-3xl font-bold text-purple-600">
                        {stats?.runsCount || 0}
                      </p>
                    </div>
                    <svg
                      className="w-12 h-12 text-purple-600"
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
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Link href="/query-sets/new" className="btn btn-primary text-center">
                    Create Query Set
                  </Link>
                  <Link href="/query-sets" className="btn btn-secondary text-center">
                    View Query Sets
                  </Link>
                  <Link href="/runs" className="btn btn-secondary text-center">
                    View Runs
                  </Link>
                  <Link href="/comparisons" className="btn btn-secondary text-center">
                    Compare Runs
                  </Link>
                </div>
              </div>

              {/* Recent Runs */}
              <div className="card">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Recent Runs
                </h2>
                {stats?.recentRuns && stats.recentRuns.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Run Name</th>
                          <th>Query Set</th>
                          <th>Status</th>
                          <th>Execution Time</th>
                          <th>Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentRuns.map((run) => (
                          <tr key={run.id}>
                            <td>
                              <Link
                                href={`/runs/${run.id}`}
                                className="text-blue-600 hover:underline"
                              >
                                {run.runName}
                              </Link>
                            </td>
                            <td>{run.querySetName}</td>
                            <td>
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
                            </td>
                            <td>{formatExecutionTime(run.totalExecutionTimeMs)}</td>
                            <td>{formatDate(run.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">
                    No runs yet. Create a query set and execute it to see results here.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
