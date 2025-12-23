import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import ProtectedRoute from '../../components/ProtectedRoute';

interface QuerySet {
  id: number;
  querySetName: string;
  description: string;
  credentialName: string;
  credentialId: number;
  createdAt: string;
}

interface Query {
  id: number;
  queryName: string;
  sqlText: string;
  description: string;
  qroHash: string;
  importedFromPlanCache: boolean;
}

export default function QuerySetDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [querySet, setQuerySet] = useState<QuerySet | null>(null);
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      fetchQuerySet();
      fetchQueries();
    }
  }, [id]);

  const fetchQuerySet = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/query-sets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch query set');

      const data = await response.json();
      setQuerySet(data.querySet);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchQueries = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/queries/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setQueries(data.queries || []);
      }
    } catch (err) {
      console.error('Failed to fetch queries:', err);
    }
  };

  const handleDeleteQuery = async (queryId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/queries/${queryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to delete query');

      setQueries(queries.filter((q) => q.id !== queryId));
      setDeleteConfirm(null);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleExecute = () => {
    router.push(`/runs/execute?querySetId=${id}`);
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

  if (error || !querySet) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="alert alert-error">
            <p>{error || 'Query set not found'}</p>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {querySet.querySetName}
                </h1>
                {querySet.description && (
                  <p className="text-gray-600">{querySet.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/query-sets/${id}/edit`}
                  className="btn btn-secondary"
                >
                  Edit
                </Link>
                <button onClick={handleExecute} className="btn btn-success">
                  Execute
                </button>
              </div>
            </div>

            <div className="flex gap-6 text-sm text-gray-600">
              <div className="flex items-center">
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
                Credential: {querySet.credentialName}
              </div>
              <div className="flex items-center">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                {queries.length} {queries.length === 1 ? 'Query' : 'Queries'}
              </div>
            </div>
          </div>

          {/* Queries List */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Queries</h2>
              <Link
                href={`/query-sets/${id}/add-query`}
                className="btn btn-primary"
              >
                Add Query
              </Link>
            </div>

            {queries.length === 0 ? (
              <div className="text-center py-12">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No Queries Yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Add queries to this set to start testing.
                </p>
                <Link
                  href={`/query-sets/${id}/add-query`}
                  className="btn btn-primary inline-block"
                >
                  Add First Query
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {queries.map((query, index) => (
                  <div
                    key={query.id}
                    className="border border-gray-300 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">
                          {index + 1}. {query.queryName}
                        </h3>
                        {query.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {query.description}
                          </p>
                        )}
                        {query.importedFromPlanCache && (
                          <span className="badge badge-info text-xs">
                            Imported from Plan Cache
                          </span>
                        )}
                        {query.qroHash && (
                          <span className="badge badge-gray text-xs ml-2">
                            QRO: {query.qroHash.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/query-sets/${id}/edit-query/${query.id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          Edit
                        </Link>
                        {deleteConfirm === query.id ? (
                          <>
                            <button
                              onClick={() => handleDeleteQuery(query.id)}
                              className="btn btn-danger btn-sm"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="btn btn-secondary btn-sm"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(query.id)}
                            className="btn btn-danger btn-sm"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded border border-gray-200 mt-2">
                      <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap">
                        {query.sqlText}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
