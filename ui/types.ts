export interface Request {
  id: string
  method: string
  path: string
  status: number
  statusText: string
  duration: string
  timestamp: string
  queryParams?: Record<string, string>
  request: {
    headers: Record<string, string>
    body?: any
  }
  response: {
    headers: Record<string, string>
    body: any
    size?: number
  }
}

