/**
 * HTML Report Generator
 * Generates downloadable HTML reports for test runs and comparisons
 */

import { formatDate, formatDuration, formatNumber, formatPercentage, formatPercentageChange } from './formatters'

/**
 * Generate HTML report for a test run
 */
export function generateTestRunReport(testRun, queryResults) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Run Report - ${escapeHtml(testRun.run_name)}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #1e40af; font-size: 28px; margin-bottom: 10px; }
        .header .meta { color: #666; font-size: 14px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; }
        .summary-card .label { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 5px; }
        .summary-card .value { font-size: 24px; font-weight: bold; color: #1e40af; }
        .summary-card .sub { font-size: 12px; color: #666; margin-top: 5px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #1e40af; font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #1e40af; color: white; padding: 12px; text-align: left; font-weight: 600; }
        td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
        tr:hover { background: #f8fafc; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-warning { background: #fef3c7; color: #92400e; }
        .badge-danger { background: #fee2e2; color: #991b1b; }
        .sql-text { font-family: 'Courier New', monospace; font-size: 12px; color: #374151; max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #666; font-size: 12px; }
        @media print { body { background: white; } .container { box-shadow: none; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Test Run Report</h1>
            <h2>${escapeHtml(testRun.run_name)}</h2>
            <div class="meta">
                <strong>Query Set:</strong> ${escapeHtml(testRun.query_set_name)} | 
                <strong>Created:</strong> ${formatDate(testRun.created_at)} | 
                <strong>Status:</strong> ${testRun.status} | 
                <strong>Metrics Level:</strong> ${testRun.metrics_level}
            </div>
            ${testRun.description ? `<p style="margin-top: 10px; color: #666;">${escapeHtml(testRun.description)}</p>` : ''}
        </div>

        <div class="summary">
            <div class="summary-card">
                <div class="label">Total Executions</div>
                <div class="value">${formatNumber(testRun.total_executions)}</div>
                <div class="sub">${testRun.iterations} × ${testRun.total_queries} queries</div>
            </div>
            <div class="summary-card">
                <div class="label">Success Rate</div>
                <div class="value" style="color: ${testRun.success_rate >= 95 ? '#16a34a' : '#d97706'}">${formatPercentage(testRun.success_rate, 1)}</div>
                <div class="sub">${formatNumber(testRun.successful_executions)} / ${formatNumber(testRun.total_executions)}</div>
            </div>
            <div class="summary-card">
                <div class="label">Total Duration</div>
                <div class="value">${formatDuration(testRun.total_duration)}</div>
                <div class="sub">Avg: ${formatDuration(testRun.avg_duration)}</div>
            </div>
            <div class="summary-card">
                <div class="label">Failed Queries</div>
                <div class="value" style="color: ${testRun.failed_executions > 0 ? '#dc2626' : '#16a34a'}">${formatNumber(testRun.failed_executions)}</div>
                <div class="sub">${testRun.failed_queries} unique queries</div>
            </div>
        </div>

        <div class="section">
            <h2>Query Results (${queryResults.length} queries)</h2>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>SQL Statement</th>
                        <th>Executions</th>
                        <th>Avg Duration</th>
                        <th>Min / Max</th>
                        <th>Success Rate</th>
                    </tr>
                </thead>
                <tbody>
                    ${queryResults.map(query => `
                        <tr>
                            <td><strong>${query.sequence_number}</strong></td>
                            <td><div class="sql-text" title="${escapeHtml(query.sql_text)}">${escapeHtml(query.sql_text)}</div></td>
                            <td>${formatNumber(query.execution_count)}</td>
                            <td>${formatDuration(query.avg_duration)}</td>
                            <td style="font-size: 11px;">${formatDuration(query.min_duration)} / ${formatDuration(query.max_duration)}</td>
                            <td>
                                <span class="badge ${query.success_rate >= 95 ? 'badge-success' : query.success_rate >= 80 ? 'badge-warning' : 'badge-danger'}">
                                    ${formatPercentage(query.success_rate, 0)}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="footer">
            <p><strong>IBM i Query Runner</strong> - Test Run Report</p>
            <p>Generated on ${formatDate(new Date())}</p>
        </div>
    </div>
</body>
</html>
  `

  return html.trim()
}

/**
 * Generate HTML report for a comparison
 */
export function generateComparisonReport(comparison, queryDetails) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comparison Report - ${escapeHtml(comparison.baseline_run_name)} vs ${escapeHtml(comparison.comparison_run_name)}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #1e40af; font-size: 28px; margin-bottom: 10px; }
        .header .meta { color: #666; font-size: 14px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; }
        .summary-card .label { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 5px; }
        .summary-card .value { font-size: 24px; font-weight: bold; }
        .summary-card .sub { font-size: 12px; color: #666; margin-top: 5px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #1e40af; font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #1e40af; color: white; padding: 12px; text-align: left; font-weight: 600; }
        td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
        tr:hover { background: #f8fafc; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-danger { background: #fee2e2; color: #991b1b; }
        .badge-gray { background: #f3f4f6; color: #374151; }
        .sql-text { font-family: 'Courier New', monospace; font-size: 12px; color: #374151; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .change-positive { color: #dc2626; font-weight: 600; }
        .change-negative { color: #16a34a; font-weight: 600; }
        .change-neutral { color: #6b7280; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #666; font-size: 12px; }
        @media print { body { background: white; } .container { box-shadow: none; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Performance Comparison Report</h1>
            <h2>${escapeHtml(comparison.baseline_run_name)} vs ${escapeHtml(comparison.comparison_run_name)}</h2>
            <div class="meta">
                <strong>Created:</strong> ${formatDate(comparison.created_at)} | 
                <strong>Deviation Threshold:</strong> ${comparison.deviation_threshold}%
            </div>
        </div>

        <div class="summary">
            <div class="summary-card">
                <div class="label">Total Queries</div>
                <div class="value" style="color: #1e40af;">${formatNumber(comparison.total_queries)}</div>
                <div class="sub">Compared</div>
            </div>
            <div class="summary-card">
                <div class="label">Avg Duration Change</div>
                <div class="value" style="color: ${comparison.avg_duration_change > 0 ? '#dc2626' : comparison.avg_duration_change < 0 ? '#16a34a' : '#6b7280'}">
                    ${formatPercentageChange(comparison.avg_duration_change).text}
                </div>
                <div class="sub">${comparison.avg_duration_change > 0 ? 'Slower' : comparison.avg_duration_change < 0 ? 'Faster' : 'No change'}</div>
            </div>
            <div class="summary-card">
                <div class="label">Improved Queries</div>
                <div class="value" style="color: #16a34a;">${formatNumber(comparison.queries_improved)}</div>
                <div class="sub">${formatPercentage((comparison.queries_improved / comparison.total_queries) * 100, 0)}</div>
            </div>
            <div class="summary-card">
                <div class="label">Degraded Queries</div>
                <div class="value" style="color: #dc2626;">${formatNumber(comparison.queries_degraded)}</div>
                <div class="sub">${formatPercentage((comparison.queries_degraded / comparison.total_queries) * 100, 0)}</div>
            </div>
        </div>

        <div class="section">
            <h2>Query Comparison Details (${queryDetails.length} queries)</h2>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>SQL Statement</th>
                        <th>Baseline</th>
                        <th>Comparison</th>
                        <th>Change</th>
                        <th>Classification</th>
                    </tr>
                </thead>
                <tbody>
                    ${queryDetails.map(query => `
                        <tr>
                            <td><strong>${query.sequence_number}</strong></td>
                            <td><div class="sql-text" title="${escapeHtml(query.sql_text)}">${escapeHtml(query.sql_text)}</div></td>
                            <td>${formatDuration(query.baseline_avg_duration)}</td>
                            <td>${formatDuration(query.comparison_avg_duration)}</td>
                            <td class="${query.duration_change_percent > 0 ? 'change-positive' : query.duration_change_percent < 0 ? 'change-negative' : 'change-neutral'}">
                                ${formatPercentageChange(query.duration_change_percent).text}
                            </td>
                            <td>
                                ${query.has_deviation ? `
                                    <span class="badge ${query.classification === 'IMPROVEMENT' ? 'badge-success' : 'badge-danger'}">
                                        ${query.classification}
                                    </span>
                                ` : `
                                    <span class="badge badge-gray">NO CHANGE</span>
                                `}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="footer">
            <p><strong>IBM i Query Runner</strong> - Comparison Report</p>
            <p>Generated on ${formatDate(new Date())}</p>
        </div>
    </div>
</body>
</html>
  `

  return html.trim()
}

/**
 * Download HTML report as file
 */
export function downloadReport(html, filename) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}