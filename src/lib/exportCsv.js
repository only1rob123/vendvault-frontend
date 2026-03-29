/**
 * Export an array of objects to a CSV file download.
 * @param {Object[]} rows  - Array of flat objects
 * @param {string}   filename - e.g. 'sales-report.csv'
 * @param {string[]} [columns] - Optional ordered column list; defaults to all keys of first row
 */
export function exportCsv(rows, filename, columns) {
  if (!rows || rows.length === 0) return

  const cols = columns || Object.keys(rows[0])

  const escape = (val) => {
    if (val === null || val === undefined) return ''
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const header = cols.map(escape).join(',')
  const body = rows.map(row => cols.map(col => escape(row[col])).join(',')).join('\n')
  const csv = `${header}\n${body}`

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
