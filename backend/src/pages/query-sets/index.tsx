import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';

interface QuerySet {
  id: number;
  querySetName: string;
  description: string;
  credentialName: string;
  credentialId: number;
  createdAt: string;
  queryCount?: number;
}

export default function QuerySetsPage() {
  const router = useRouter();
  const [querySets, setQuerySets] = useState<QuerySet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    fetchQuerySets();
  }, []);

  const fetchQuerySets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/query-sets', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch query sets');

      const data = await response.json();
      
      // Fetch query counts for each set
      const setsWithCounts = await Promise.all(
        data.querySets.map(async (qs: QuerySet) => {
          try {
            const queriesRes = await fetch(`/api/queries/${qs.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const queriesData = queriesRes.ok ? await queriesRes.json() : { queries: [] };
            return { ...qs, queryCount: queriesData.queries?.length || 0 };
          } catch {
            return { ...qs, queryCount: 0 };
          }
        })
      );

      setQuerySets(setsWithCounts);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/query-sets/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to delete query set');

      setQuerySets(querySets.filter((qs) => qs.id !== id));
      setDeleteConfirm(null);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/query-sets/${id}/duplicate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to duplicate query set');

      await fetchQuerySets(); // Refresh list
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">Query Sets</h1>
            <Link href="/query-sets/new" className="btn btn-primary">
              Create New Query Set
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
          ) : querySets.length === 0 ? (
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Query Sets Yet
              </h3>
              <p className="text-gray-600 mb-4">
                Create your first query set to start testing DB2 queries.
              </p>
              <Link href="/query-sets/new" className="btn btn-primary inline-block">
                Create Query Set
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {querySets.map((querySet) => (
                <div key={querySet.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800 flex-1">
                      {querySet.querySetName}
                    </h3>
                    <span className="badge badge-info ml-2">
                      {querySet.queryCount || 0} queries
                    </span>
                  </div>

                  {querySet.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {querySet.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                        />
                      </svg>
                      {querySet.credentialName}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Created {formatDate(querySet.createdAt)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/query-sets/${querySet.id}`}
                      className="flex-1 btn btn-primary text-center text-sm"
                    >
                      View
                    </Link>
                    <Link
                      href={`/query-sets/${querySet.id}/edit`}
                      className="flex-1 btn btn-secondary text-center text-sm"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDuplicate(querySet.id)}
                      className="btn btn-secondary text-sm"
                      title="Duplicate"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                    {deleteConfirm === querySet.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDelete(querySet.id)}
                          className="btn btn-danger text-sm"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="btn btn-secondary text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(querySet.id)}
                        className="btn btn-danger text-sm"
                        title="Delete"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
