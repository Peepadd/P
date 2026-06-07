export async function syncLocalEventsToGoogle(providerToken, localEvents, startStr, endStr) {
  if (!providerToken) throw new Error('No Google Calendar access token found. Please sign in with Google again.')

  // 1. Fetch existing Google events in this range to avoid duplicates
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startStr}T00:00:00Z&timeMax=${endStr}T23:59:59Z&singleEvents=true`,
    {
      headers: { Authorization: `Bearer ${providerToken}` }
    }
  )
  
  if (!res.ok) {
    throw new Error('Failed to fetch Google Calendar events for sync.')
  }

  const googleData = await res.json()
  const existingGoogleEvents = googleData.items || []

  // Create a Set of existing localIds that are already in Google Calendar
  const existingLocalIds = new Set()
  existingGoogleEvents.forEach(ge => {
    if (ge.extendedProperties?.private?.localId) {
      existingLocalIds.add(ge.extendedProperties.private.localId)
    }
  })

  let syncedCount = 0

  // 2. Push missing local events
  for (const event of localEvents) {
    // Skip if it's already a Google event
    if (event.source === 'google') continue
    
    // Skip if we already synced it
    if (existingLocalIds.has(event.id)) continue

    // Prepare Google Event payload
    const isAllDay = !event.time

    // Google Calendar all-day events require the end date to be exclusive (next day)
    // We assume event.dateKey is the date string 'YYYY-MM-DD'
    const eventDate = new Date(event.dateKey)
    const nextDay = new Date(eventDate)
    nextDay.setDate(eventDate.getDate() + 1)

    const payload = {
      summary: event.title,
      description: `${event.subtitle}\n${event.note || ''}`.trim(),
      extendedProperties: {
        private: { localId: event.id }
      }
    }

    if (isAllDay) {
      payload.start = { date: event.dateKey }
      payload.end = { date: nextDay.toISOString().split('T')[0] }
    } else {
      // It has time (e.g. '14:30')
      const dateTimeStr = `${event.dateKey}T${event.time}:00`
      // We assume local timezone, but Google API expects proper timezone or offset
      // A simple way is to pass timezone
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      payload.start = { dateTime: dateTimeStr, timeZone: tz }
      
      // If no end time is specified locally, assume 1 hour later
      const endDateTime = new Date(new Date(dateTimeStr).getTime() + 60 * 60 * 1000)
      payload.end = { 
        dateTime: endDateTime.toISOString().replace('.000Z', ''), // Convert to local format roughly, better to construct it
        timeZone: tz 
      }
      
      // Better end time construction:
      const endHour = String(endDateTime.getHours()).padStart(2, '0')
      const endMin = String(endDateTime.getMinutes()).padStart(2, '0')
      payload.end.dateTime = `${endDateTime.getFullYear()}-${String(endDateTime.getMonth()+1).padStart(2,'0')}-${String(endDateTime.getDate()).padStart(2,'0')}T${endHour}:${endMin}:00`
    }

    // Assign color based on source
    // Google Calendar colors: 1: Blue, 2: Green, 4: Light Red, 5: Yellow, 10: Green, 11: Red
    if (event.source === 'transaction') payload.colorId = '11' // Red for expense/income
    if (event.source === 'checklist') payload.colorId = '5' // Yellow
    if (event.source === 'academic') payload.colorId = '1' // Blue

    // POST to Google Calendar
    try {
      const createRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${providerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (createRes.ok) {
        syncedCount++
      } else {
        console.error('Failed to sync event:', await createRes.text())
      }
    } catch (err) {
      console.error('Error syncing event:', err)
    }
  }

  return syncedCount
}
