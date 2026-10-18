// "2026-11-10" -> "10 Nov"
export function formatDate(value) {
    if (!value) return ''
    const d = new Date(`${String(value).slice(0, 10)}T00:00:00`)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }
  
  // 3000 -> "₹3,000"
  export function inr(value) {
    return `₹${Math.round(Number(value) || 0).toLocaleString('en-IN')}`
  }
  
  // Number of days from start to end, counting both. Returns 0 if the dates are missing or wrong.
  export function daysBetween(start, end) {
    if (!start || !end) return 0
    const a = new Date(`${start}T00:00:00`)
    const b = new Date(`${end}T00:00:00`)
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b < a) return 0
    return Math.round((b - a) / 86400000) + 1
  }
  
  // "2026-11-10" + 1 -> "2026-11-11"
  export function addDays(iso, n) {
    const d = new Date(`${String(iso).slice(0, 10)}T00:00:00`)
    if (Number.isNaN(d.getTime())) return ''
    d.setDate(d.getDate() + n)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }