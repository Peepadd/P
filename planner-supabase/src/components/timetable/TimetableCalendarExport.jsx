const DAYS_EN = ['MO', 'TU', 'WE', 'TH', 'FR']

/**
 * Generate .ics (iCalendar) content from timetable data
 */
export function generateICS({ config, cells, subjects, timetableName }) {
  if (!config || !cells) return null

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Planner Supabase//Timetable//TH',
    `X-WR-CALNAME:${timetableName || 'ตารางเรียน'}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  // Calculate the start of this week (Monday)
  const now = new Date()
  const currentDay = now.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay
  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset)
  monday.setHours(0, 0, 0, 0)

  // Parse start time
  const startParts = config.tStart.split(':').map(Number)

  Object.entries(cells).forEach(([key, cell]) => {
    if (!cell?.subject) return

    const [dayIdx, periodIdx] = key.split('_').map(Number)
    if (dayIdx < 0 || dayIdx > 4) return

    // Calculate period time
    let currentMin = startParts[0] * 60 + startParts[1]
    for (let i = 0; i < periodIdx; i++) {
      currentMin += config.pMin + config.bMin
    }
    const startMin = currentMin
    const endMin = currentMin + config.pMin

    // Calculate the date for this day
    const eventDate = new Date(monday)
    eventDate.setDate(monday.getDate() + dayIdx)

    const startDate = new Date(eventDate)
    startDate.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0)

    const endDate = new Date(eventDate)
    endDate.setHours(Math.floor(endMin / 60), endMin % 60, 0, 0)

    // Format dates to iCal format (YYYYMMDDTHHMMSS)
    const formatDate = (d) => {
      const pad = (n) => String(n).padStart(2, '0')
      return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
    }

    const uid = `${key}-${Date.now()}@planner-supabase`
    const summary = cell.subject
    const location = cell.room || ''
    const description = [
      cell.teacher ? `ผู้สอน: ${cell.teacher}` : '',
      cell.note ? `หมายเหตุ: ${cell.note}` : '',
      `คาบที่ ${periodIdx + 1}`,
    ]
      .filter(Boolean)
      .join('\\n')

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${uid}`)
    lines.push(`DTSTART:${formatDate(startDate)}`)
    lines.push(`DTEND:${formatDate(endDate)}`)
    lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${DAYS_EN[dayIdx]}`)
    lines.push(`SUMMARY:${summary}`)
    if (location) lines.push(`LOCATION:${location}`)
    if (description) lines.push(`DESCRIPTION:${description}`)
    lines.push('STATUS:CONFIRMED')
    lines.push('END:VEVENT')
  })

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

/**
 * Download the generated .ics file
 */
export function downloadICS({ config, cells, subjects, timetableName }) {
  const icsContent = generateICS({ config, cells, subjects, timetableName })
  if (!icsContent) return false

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `ตารางเรียน-${timetableName || 'default'}-${new Date().toISOString().split('T')[0]}.ics`
  link.click()
  URL.revokeObjectURL(url)
  return true
}
