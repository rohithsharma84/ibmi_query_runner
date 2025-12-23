import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';

interface Run {
  id: number;
  runName: string;
  querySetName: string;
  createdAt: string;
}

interface ComparisonResult {
  qroHash: string;
  queryName: string;
  run1AvgTime: number;
  run2AvgTime: number;
  percentageDiff: number;
  significant: boolean;
}

export default function ComparisonsPage() {
  const router = useRouter();
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [comparison, setComparison] = useState<ComparisonResult[] | null>(null);
  const [formData, setFormData] = useState({
    firstRunId: '',
    secondRunId: '',
    percentageDiffThreshold: '20',
    snapshotName: '',
    exportCsv: false,
  });

  useEffect(() => {
    fetchRuns();
  }, []);

  const fetchRuns = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/runs', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setRuns(data.runs.filter((r: Run) => r.status === 'completed'));
      }
    } catch (err) {
      console.error('Failed to fetch runs:', err);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setComparison(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/comparisons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstRunId: parseInt(formData.firstRunId),
          secondRunId: parseInt(formData.secondRunId),
          percentageDiffThreshold: parseFloat(formData.percentageDiffThreshold),
          exportCsv: formData.exportCsv,
          createSnapshot: formData.snapshotName ? true : false,
          snapshotName: formData.snapshotName || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Comparison failed');
      }

      const data = await response.json();
      setComparison(data.comparison || []);

      if (formData.exportCsv && data.csvData) {
        // Download CSV
        const blob = new Blob([data.csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comparison_${formData.firstRunId}_vs_${formData.secondRunId}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-800">Compare Runs</h1>

          {/* Comparison Form */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Select Runs to Compare
            </h2>

            {error && (
              <div className="alert alert-error mb-4">
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstRunId" className="form-label">
                      First Run *
                    </label>
                    <select
                      id="firstRunId"
                      value={formData.firstRunId}
                      onChange={(e) =>
                        setFormData({ ...formData, firstRunId: e.target.value })
                      }
                      className="form-select"
                      required
                    >
                      <option value="">Select first run...</option>
                      {runs.map((run) => (
                        <option key={run.id} value={run.id}>
                          {run.runName} - {run.querySetName} ({formatDate(run.createdAt)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="secondRunId" className="form-label">
                      Second Run *
                    </label>
                    <select
                      id="secondRunId"
                      value={formData.secondRunId}
                      onChange={(e) =>
                        setFormData({ ...formData, secondRunId: e.target.value })
                      }
                      className="form-select"
                      required
                    >
                      <option value="">Select second run...</option>
                      {runs.map((run) => (
                        <option key={run.id} value={run.id} disabled={run.id.toString() === formData.firstRunId}>
                          {run.runName} - {run.querySetName} ({formatDate(run.createdAt)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="percentageDiffThreshold" className="form-label">
                    Highlight Threshold (%)
                  </label>
                  <input
                    id="percentageDiffThreshold"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={formData.percentageDiffThreshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        percentageDiffThreshold: e.target.value,
                      })
                    }
                    className="form-input"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Queries with performance differences exceeding this threshold will be highlighted
                  </p>
                </div>

                <div>
                  <label htmlFor="snapshotName" className="form-label">
                    Snapshot Name (Optional)
                  </label>
                  <input
                    id="snapshotName"
                    type="text"
                    value={formData.snapshotName}
                    onChange={(e) =>
                      setFormData({ ...formData, snapshotName: e.target.value })
                    }
                    className="form-input"
                    placeholder="Save this comparison with a name..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    id="exportCsv"
                    type="checkbox"
                    checked={formData.exportCsv}
                    onChange={(e) =>
                      setFormData({ ...formData, exportCsv: e.target.checked })
                    }
                    className="form-checkbox"
                  />
                  <label htmlFor="exportCsv" className="ml-2 text-sm text-gray-700">
                    Export results to CSV
                  </label>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Comparing...' : 'Compare Runs'}
                </button>
              </div>
            </form>
          </div>

          {/* Comparison Results */}
          {comparison && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Comparison Results
              </h2>

              {comparison.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No matching queries found between these runs.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Query</th>
                        <th>QRO Hash</th>
                        <th>Run 1 Avg Time</th>
                        <th>Run 2 Avg Time</th>
                        <th>Difference</th>
                        <th>% Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparison.map((result, index) => (
                        <tr
                          key={index}
                          className={
                            result.significant
                              ? result.percentageDiff > 0
                                ? 'bg-red-50'
                                : 'bg-green-50'
                              : ''
                          }
                        >
                          <td className="font-medium">{result.queryName}</td>
                          <td className="font-mono text-sm">
                            {result.qroHash?.substring(0, 12)}...
                          </td>
                          <td>{formatTime(result.run1AvgTime)}</td>
                          <td>{formatTime(result.run2AvgTime)}</td>
                          <td
                            className={
                              result.percentageDiff > 0
                                ? 'text-red-600 font-semibold'
                                : result.percentageDiff < 0
                                ? 'text-green-600 font-semibold'
                                : ''
                            }
                          >
                            {result.percentageDiff > 0 ? '+' : ''}
                            {formatTime(result.run2AvgTime - result.run1AvgTime)}
                          </td>
                          <td
                            className={
                              result.percentageDiff > 0
                                ? 'text-red-600 font-semibold'
                                : result.percentageDiff < 0
                                ? 'text-green-600 font-semibold'
                                : ''
                            }
                          >
                            {result.percentageDiff > 0 ? '+' : ''}
                            {result.percentageDiff.toFixed(2)}%
                            {result.significant && (
                              <span className="ml-2 badge badge-warning">!</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-4 p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Legend:</span>
                </p>
                <ul className="text-sm text-gray-700 mt-2 space-y-1">
                  <li className="flex items-center">
                    <span className="inline-block w-4 h-4 bg-green-100 border border-green-300 mr-2"></span>
                    Green = Performance improved (faster)
                  </li>
                  <li className="flex items-center">
                    <span className="inline-block w-4 h-4 bg-red-100 border border-red-300 mr-2"></span>
                    Red = Performance degraded (slower)
                  </li>
                  <li className="flex items-center">
                    <span className="badge badge-warning mr-2">!</span>
                    Significant change (exceeds threshold)
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
