'use client'

import { useEffect, useState } from 'react'
import type { Request } from '../types'

// Demo requests for initial state
const demoRequests: Request[] = [
  // {
  //   id: "1",
  //   method: "GET",
  //   path: "/utils/notification",
  //   status: 200,
  //   duration: "2.2s",
  //   timestamp: new Date().toISOString(),
  //   request: {
  //     headers: {
  //       "Accept": "application/json",
  //     },
  //     params: {
  //       "offset": "0"
  //     }
  //   },
  //   response: {
  //     headers: {
  //       "Content-Type": "application/json"
  //     },
  //     body: {
  //       statusCode: 200,
  //       data: {
  //         notifications: []
  //       },
  //       message: "Notifications retrieved successfully",
  //       success: true
  //     }
  //   }
  // }
]

export function useRequests() {
  const [requests, setRequests] = useState<Request[]>(demoRequests)

  useEffect(() => {
    // Fetch initial requests
    fetch('/requests')
      .then(res => res.json())
      .then(data => setRequests(prev => [...prev, ...data]))

    // Setup SSE for real-time updates
    const events = new EventSource('/events')

    events.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setRequests(prev => [data, ...prev])
    }

    return () => events.close()
  }, [])

  return requests
}

