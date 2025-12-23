import { useEffect, useState, FormEvent } from 'react';
import Layout from '../../components/Layout';
import ProtectedRoute from '../../components/ProtectedRoute';

interface Credential {
  id: number;
  credentialName: string;
  host: string;
  port: number;
  secure: boolean;
  createdAt: string;
}

interface CredentialUsage {
  querySetId: number;
  querySetName: string;
}

export default function AdminCredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [usage, setUsage] = useState<{ [key: number]: CredentialUsage[] }>({});
  const [formData, setFormData] = useState({
    credentialName: '',
    host: '',
    port: '446',
    database: 'QSYS',
    username: '',
    password: '',
    secure: true,
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

      if (!response.ok) throw new Error('Failed to fetch credentials');

      const data = await response.json();
      setCredentials(data.credentials || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsage = async (credentialId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/credentials/usage?credentialId=${credentialId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUsage((prev) => ({ ...prev, [credentialId]: data.querySets || [] }));
      }
    } catch (err) {
      console.error('Failed to fetch usage:', err);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const token = localStorage.getItem('token');
      const url = editingId ? `/api/credentials` : '/api/credentials';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...(editingId && { credentialId: editingId }),
          ...formData,
          port: parseInt(formData.port),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Operation failed');
      }

      await fetchCredentials();
      resetForm();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/credentials`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ credentialId: id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Delete failed');
      }

      await fetchCredentials();
      setDeleteConfirm(null);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      credentialName: '',
      host: '',
      port: '446',
      database: 'QSYS',
      username: '',
      password: '',
      secure: true,
    });
    setShowForm(false);
    setEditingId(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <ProtectedRoute requireAdmin>
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">
              Database Credentials
            </h1>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary"
              >
                Add Credential
              </button>
            )}
          </div>

          {error && (
            <div className="alert alert-error">
              <p>{error}</p>
            </div>
          )}

          {/* Credential Form */}
          {showForm && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {editingId ? 'Edit Credential' : 'Add New Credential'}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="credentialName" className="form-label">
                      Credential Name *
                    </label>
                    <input
                      id="credentialName"
                      type="text"
                      value={formData.credentialName}
                      onChange={(e) =>
                        setFormData({ ...formData, credentialName: e.target.value })
                      }
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="host" className="form-label">
                      Host *
                    </label>
                    <input
                      id="host"
                      type="text"
                      value={formData.host}
                      onChange={(e) =>
                        setFormData({ ...formData, host: e.target.value })
                      }
                      className="form-input"
                      placeholder="ibmi.example.com"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="port" className="form-label">
                      Port *
                    </label>
                    <input
                      id="port"
                      type="number"
                      value={formData.port}
                      onChange={(e) =>
                        setFormData({ ...formData, port: e.target.value })
                      }
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="database" className="form-label">
                      Database
                    </label>
                    <input
                      id="database"
                      type="text"
                      value={formData.database}
                      onChange={(e) =>
                        setFormData({ ...formData, database: e.target.value })
                      }
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label htmlFor="username" className="form-label">
                      Username *
                    </label>
                    <input
                      id="username"
                      type="text"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="form-label">
                      Password *
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="form-input"
                      required={!editingId}
                      placeholder={editingId ? 'Leave blank to keep current' : ''}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center">
                      <input
                        id="secure"
                        type="checkbox"
                        checked={formData.secure}
                        onChange={(e) =>
                          setFormData({ ...formData, secure: e.target.checked })
                        }
                        className="form-checkbox"
                      />
                      <label htmlFor="secure" className="ml-2 text-sm text-gray-700">
                        Use secure connection (TLS/SSL)
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button type="submit" className="btn btn-primary">
                    {editingId ? 'Update Credential' : 'Add Credential'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Credentials List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="spinner"></div>
            </div>
          ) : credentials.length === 0 ? (
            <div className="card text-center py-12">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Credentials Yet
              </h3>
              <p className="text-gray-600">
                Add database credentials to enable query execution.
              </p>
            </div>
          ) : (
            <div className="card">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Host</th>
                      <th>Port</th>
                      <th>Database</th>
                      <th>Username</th>
                      <th>Secure</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {credentials.map((cred) => (
                      <tr key={cred.id}>
                        <td className="font-medium">{cred.credentialName}</td>
                        <td>{cred.host}</td>
                        <td>{cred.port}</td>
                        <td>QSYS</td>
                        <td className="font-mono text-sm">***</td>
                        <td>
                          {cred.secure ? (
                            <span className="badge badge-success">Yes</span>
                          ) : (
                            <span className="badge badge-warning">No</span>
                          )}
                        </td>
                        <td className="text-sm">{formatDate(cred.createdAt)}</td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                fetchUsage(cred.id);
                              }}
                              className="btn btn-secondary btn-sm"
                              title="View usage"
                            >
                              Usage
                            </button>
                            {deleteConfirm === cred.id ? (
                              <>
                                <button
                                  onClick={() => handleDelete(cred.id)}
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
                                onClick={() => setDeleteConfirm(cred.id)}
                                className="btn btn-danger btn-sm"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                          {usage[cred.id] && (
                            <div className="mt-2 text-sm text-gray-600">
                              Used by {usage[cred.id].length} query set(s)
                              {usage[cred.id].length > 0 && (
                                <ul className="list-disc list-inside ml-2 mt-1">
                                  {usage[cred.id].map((qs) => (
                                    <li key={qs.querySetId}>{qs.querySetName}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
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
