/** Seconds as TikTok shows a video length: "0:45", "3:05", "1:02:10". */
export function formatVideoLength(seconds?: number): string {
  if (seconds === undefined || seconds === null) return '—'
  const total = Math.max(0, Math.round(seconds))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const rest = String(total % 60).padStart(2, '0')
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`
}
