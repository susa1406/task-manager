// Format number as Indian Rupees
export function formatCurrency(amount) {
  const num = parseFloat(amount) || 0
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

// Format date as "25 Sep 2026"
export function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Format date as "September 2026"
export function formatMonth(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

// Get today's date in YYYY-MM-DD format
export function todayISO() {
  return new Date().toISOString().split('T')[0]
}

// Get greeting based on time of day
export function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

// Get current date formatted nicely
export function getCurrentDateFormatted() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Calculate goal progress percentage
export function calcGoalProgress(current, target) {
  if (!target || target <= 0) return 0
  return Math.min(100, Math.round((parseFloat(current) / parseFloat(target)) * 100))
}

// Group array of objects by a date field into months
export function groupByMonth(items, dateField = 'date') {
  const groups = {}
  items.forEach(item => {
    const key = formatMonth(item[dateField])
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  })
  return groups
}

// Truncate text with ellipsis
export function truncate(text, maxLength = 100) {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '…' : text
}

export const EXPENSE_CATEGORIES = [
  'Bus', 'Food', 'Snacks', 'Notebook', 'Books', 'Printing',
  'College', 'Mobile', 'Transport', 'Personal', 'Other',
]

export const MONEY_SOURCES = ['Parents', 'Family', 'Pocket Money', 'Scholarship', 'Other']

export const EXPERIENCE_CATEGORIES = ['College', 'Project', 'Learning', 'Personal', 'Event', 'Other']

export const GOAL_STATUSES = ['Active', 'Completed', 'Paused']

export const NOTE_CATEGORIES = ['Personal', 'College', 'Project', 'Learning', 'Ideas', 'Other']

export const CATEGORY_COLORS = {
  Bus: '#e53935',
  Food: '#fb8c00',
  Snacks: '#fdd835',
  Notebook: '#43a047',
  Books: '#00acc1',
  Printing: '#7e57c2',
  College: '#ef5350',
  Mobile: '#26c6da',
  Transport: '#ff7043',
  Personal: '#ab47bc',
  Other: '#78909c',
}
