import { format, formatDistanceToNow, parseISO } from 'date-fns'

/**
 * Format a date string to a readable format
 */
export function formatDate(dateString, formatStr = 'MMM dd, yyyy HH:mm:ss') {
  if (!dateString) return 'N/A'
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString
    return format(date, formatStr)
  } catch (error) {
    return 'Invalid Date'
  }
}

/**
 * Format a date as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return 'N/A'
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString
    return formatDistanceToNow(date, { addSuffix: true })
  } catch (error) {
    return 'Invalid Date'
  }
}

/**
 * Format duration in milliseconds to readable format
 */
export function formatDuration(ms) {
  if (ms === null || ms === undefined) return 'N/A'
  
  if (ms < 1000) {
    return `${ms.toFixed(2)} ms`
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)} sec`
  } else if (ms < 3600000) {
    const minutes = Math.floor(ms / 60000)
    const seconds = ((ms % 60000) / 1000).toFixed(0)
    return `${minutes}m ${seconds}s`
  } else {
    const hours = Math.floor(ms / 3600000)
    const minutes = Math.floor((ms % 3600000) / 60000)
    return `${hours}h ${minutes}m`
  }
}

/**
 * Format a number with thousand separators
 */
export function formatNumber(num, decimals = 0) {
  if (num === null || num === undefined) return 'N/A'
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes) {
  if (bytes === null || bytes === undefined) return 'N/A'
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Format percentage
 */
export function formatPercentage(value, decimals = 2) {
  if (value === null || value === undefined) return 'N/A'
  return `${value.toFixed(decimals)}%`
}

/**
 * Format percentage change with sign and color class
 */
export function formatPercentageChange(value, decimals = 2) {
  if (value === null || value === undefined) return { text: 'N/A', class: '' }
  
  const sign = value > 0 ? '+' : ''
  const text = `${sign}${value.toFixed(decimals)}%`
  
  let colorClass = ''
  if (value > 0) {
    colorClass = 'text-danger-600'
  } else if (value < 0) {
    colorClass = 'text-success-600'
  } else {
    colorClass = 'text-gray-600'
  }
  
  return { text, class: colorClass }
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text, maxLength = 50) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * Get status badge class
 */
export function getStatusBadgeClass(status) {
  const statusMap = {
    PENDING: 'badge-gray',
    RUNNING: 'badge-primary',
    COMPLETED: 'badge-success',
    FAILED: 'badge-danger',
    CANCELLED: 'badge-warning',
    SUCCESS: 'badge-success',
    ERROR: 'badge-danger'
  }
  return statusMap[status] || 'badge-gray'
}

/**
 * Get metrics level badge class
 */
export function getMetricsLevelBadgeClass(level) {
  const levelMap = {
    BASIC: 'badge-gray',
    STANDARD: 'badge-primary',
    COMPREHENSIVE: 'badge-success'
  }
  return levelMap[level] || 'badge-gray'
}

/**
 * Format SQL query for display
 */
export function formatSQL(sql, maxLength = 200) {
  if (!sql) return ''
  
  // Remove extra whitespace
  let formatted = sql.replace(/\s+/g, ' ').trim()
  
  // Truncate if needed
  if (formatted.length > maxLength) {
    formatted = formatted.substring(0, maxLength) + '...'
  }
  
  return formatted
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value, total) {
  if (!total || total === 0) return 0
  return (value / total) * 100
}

/**
 * Get deviation severity class
 */
export function getDeviationSeverityClass(percentage) {
  const abs = Math.abs(percentage)
  if (abs >= 50) return 'text-danger-600 font-bold'
  if (abs >= 25) return 'text-warning-600 font-semibold'
  if (abs >= 10) return 'text-warning-500'
  return 'text-gray-600'
}

/**
 * Format user profile name
 */
export function formatUserProfile(profile) {
  if (!profile) return 'N/A'
  return profile.toUpperCase()
}