export function formatTime(ms: number | null): string {
  if (ms === null) return '—'
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const mm = ms % 1000
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(mm).padStart(3, '0')}`
}

export function parseTime(str: string): number | null {
  const m = str.trim().match(/^(\d{1,2}):(\d{2})\.(\d{3})$/)
  if (!m) return null
  const min = parseInt(m[1], 10)
  const sec = parseInt(m[2], 10)
  const msec = parseInt(m[3], 10)
  if (sec > 59) return null
  return (min * 60 + sec) * 1000 + msec
}
