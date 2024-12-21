'use client'

import { useState, useCallback, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Clock, Search, Trash2 } from 'lucide-react'
import { apiClient } from "@/lib/api-client"
import { RequestRecord } from "@/types/request"

export default function AdvancedNetworkInspector() {
  const [requests, setRequests] = useState<RequestRecord[]>([])
  const [selectedRequest, setSelectedRequest] = useState<RequestRecord | null>(null)
  const [filter, setFilter] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [editableRequest, setEditableRequest] = useState<Partial<RequestRecord> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await apiClient.getAllRequests();
        setRequests(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch requests');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRequests();
    // Subscribe to SSE events
    const handleNewRequest = (data: RequestRecord) => {
      setRequests(prev => [data, ...prev]);
    };
    const handleUpdateRequest = (data: { id: string; response?: any; error?: string }) => {
      setRequests(prev => prev.map(req =>
        req.id === data.id
          ? { ...req, response: data.response, error: data.error }
          : req
      ));
    };
    apiClient.subscribeToEvents(handleNewRequest, handleUpdateRequest);
    // Cleanup
    return () => {
      apiClient.unsubscribeFromEvents();
    };
  }, []);

  const filteredRequests = requests.filter(request => {
    if (filterType === "all") {
      return request.url.toLowerCase().includes(filter.toLowerCase()) ||
        request.method.toLowerCase().includes(filter.toLowerCase());
    } else if (filterType === "method") {
      return request.method.toLowerCase().includes(filter.toLowerCase());
    } else if (filterType === "route") {
      return request.url.toLowerCase().includes(filter.toLowerCase());
    }
    return true;
  });

  const handleReplay = async (request: RequestRecord) => {
    try {
      await apiClient.replayRequest(request.id);
    } catch (err) {
      console.error('Failed to replay request:', err);
    }
  };

  const copyAsCurl = useCallback((request: RequestRecord) => {
    const headers = Object.entries(request.headers || {})
      .map(([key, value]) => `-H "${key}: ${value}"`)
      .join(" ")

    const body = request.body ? `-d '${request.body}'` : ""

    const curl = `curl -X ${request.method} ${headers} ${body} "${request.url}"`
    navigator.clipboard.writeText(curl)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-muted/40 backdrop-blur supports-[backdrop-filter]:bg-muted/60">
        <div className="container flex h-14 items-center pl-6 gap-4">
          <h1 className="text-lg font-semibold">Advanced Network Inspector</h1>
          <Badge variant="secondary" className="rounded-md">online</Badge>
        </div>
      </header>

      <div className="container py-4">
        <div className="grid grid-cols-[35%_1px_calc(70%-1px)] pl-4 gap-4">
          <div className="w-full min-w-0">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
                <Input
                  placeholder="Filter requests..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="pl-8 w-full"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="method">Method</SelectItem>
                  <SelectItem value="route">Route</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-12rem)] rounded-lg border">
              <div className="w-full">
                {isLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <span>Loading...</span>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center p-4 text-red-500">
                    {error}
                  </div>
                ) : filteredRequests.map((request) => (
                  <button
                    key={request.id}
                    onClick={() => setSelectedRequest(request)}
                    className={`w-full space-y-2 border-b p-4 text-left transition-colors hover:bg-muted/50 ${selectedRequest?.id === request.id ? "bg-muted" : ""
                      }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm text-blue-500 whitespace-nowrap">{request.method}</span>
                      <Badge
                        variant={request.response?.statusCode && request.response.statusCode < 400 ? "default" : "destructive"}
                        className="flex-shrink-0"
                      >
                        {request.response?.statusCode || 'Pending'}
                      </Badge>
                    </div>

                    <div className="font-mono text-sm text-muted-foreground break-all">
                      {request.url}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{new Date(request.timestamp).toLocaleString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="hidden md:block bg-border" />

          <div className="w-full min-w-0 overflow-hidden">
            {selectedRequest ? (
              <div className="space-y-4 h-[calc(100vh-12rem)] overflow-y-auto">
                <div className="flex items-center justify-between sticky top-0 bg-background z-10 py-2">
                  <h2 className="text-lg font-semibold truncate max-w-[60%]">
                    {selectedRequest.method} {selectedRequest.url}
                  </h2>
                  <div className="flex gap-2 flex-shrink-0">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">Modify</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Modify Request</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={(e) => {
                          e.preventDefault()
                          // Here you would typically send the modified request
                          console.log('Modified request:', editableRequest)
                          setEditableRequest(null)
                        }}>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="method" className="text-right">
                                Method
                              </Label>
                              <Input
                                id="method"
                                value={editableRequest?.method || ''}
                                onChange={(e) => setEditableRequest(prev => ({ ...prev, method: e.target.value }))}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="path" className="text-right">
                                Path
                              </Label>
                              <Input
                                id="path"
                                value={editableRequest?.url || ''}
                                onChange={(e) => setEditableRequest(prev => ({ ...prev, url: e.target.value }))}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="headers" className="text-right">
                                Headers
                              </Label>
                              <Textarea
                                id="headers"
                                className="col-span-3"
                                value={JSON.stringify(editableRequest?.headers || {}, null, 2)}
                                onChange={(e) => setEditableRequest(prev => ({
                                  ...prev,
                                  headers: JSON.parse(e.target.value)
                                }))}
                              />
                            </div>
                            {editableRequest?.body && (
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="body" className="text-right">
                                  Body
                                </Label>
                                <Textarea
                                  id="body"
                                  className="col-span-3"
                                  value={editableRequest.body}
                                  onChange={(e) => setEditableRequest(prev => prev ? {
                                    ...prev,
                                    body: e.target.value
                                  } : null)}
                                />
                              </div>
                            )}
                          </div>
                          <Button type="submit">Save changes</Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" onClick={() => copyAsCurl(selectedRequest)}>
                      Copy as cURL
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Tabs defaultValue="request" className="w-full">
                    <TabsList className="w-full justify-start">
                      <TabsTrigger value="request">Request</TabsTrigger>
                      <TabsTrigger value="response">Response</TabsTrigger>
                    </TabsList>
                    <TabsContent value="request" className="space-y-4">
                      <ScrollArea className="w-full">
                        <Tabs defaultValue="summary">
                          <TabsList>
                            <TabsTrigger value="summary">Summary</TabsTrigger>
                            <TabsTrigger value="headers">Headers</TabsTrigger>
                            {selectedRequest?.body && <TabsTrigger value="body">Body</TabsTrigger>}
                            {selectedRequest?.query && <TabsTrigger value="params">Params</TabsTrigger>}
                          </TabsList>
                          <TabsContent value="summary" className="rounded-lg border p-4 mt-4">
                            <dl className="space-y-2">
                              <div className="flex justify-between">
                                <dt className="text-sm text-muted-foreground">Method</dt>
                                <dd className="font-mono text-sm">{selectedRequest.method}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm text-muted-foreground">Path</dt>
                                <dd className="font-mono text-sm">{selectedRequest.url}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm text-muted-foreground">Timestamp</dt>
                                <dd className="font-mono text-sm">
                                  {new Date(selectedRequest.timestamp).toLocaleString()}
                                </dd>
                              </div>
                            </dl>
                          </TabsContent>
                          <TabsContent value="headers" className="mt-4">
                            <pre className="rounded-lg border bg-muted p-4 font-mono text-sm">
                              {JSON.stringify(selectedRequest.headers, null, 2)}
                            </pre>
                          </TabsContent>
                          {selectedRequest?.body && (
                            <TabsContent value="body" className="mt-4">
                              <pre className="rounded-lg border bg-muted p-4 font-mono text-sm">
                                {selectedRequest.body}
                              </pre>
                            </TabsContent>
                          )}
                          {selectedRequest?.query && (
                            <TabsContent value="params" className="mt-4">
                              <pre className="rounded-lg border bg-muted p-4 font-mono text-sm">
                                {JSON.stringify(selectedRequest.query, null, 2)}
                              </pre>
                            </TabsContent>
                          )}
                        </Tabs>
                      </ScrollArea>
                    </TabsContent>
                    <TabsContent value="response" className="space-y-4">
                      <ScrollArea className="w-full">
                        <Tabs defaultValue="summary">
                          <TabsList>
                            <TabsTrigger value="summary">Summary</TabsTrigger>
                            <TabsTrigger value="headers">Headers</TabsTrigger>
                            <TabsTrigger value="body">Body</TabsTrigger>
                          </TabsList>
                          <TabsContent value="summary" className="rounded-lg border p-4 mt-4">
                            <dl className="space-y-2">
                              <div className="flex justify-between">
                                <dt className="text-sm text-muted-foreground">Status</dt>
                                <dd className="font-mono text-sm">{selectedRequest.response?.statusCode || 'Pending'}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm text-muted-foreground">Duration</dt>
                                <dd className="font-mono text-sm">{selectedRequest.response?.timeTakenMs || 'Pending'}ms</dd>
                              </div>
                            </dl>
                          </TabsContent>
                          <TabsContent value="headers" className="mt-4">
                            <pre className="rounded-lg border bg-muted p-4 font-mono text-sm">
                              {JSON.stringify(selectedRequest.response?.headers || {}, null, 2)}
                            </pre>
                          </TabsContent>
                          <TabsContent value="body" className="mt-4">
                            <pre className="rounded-lg border bg-muted p-4 font-mono text-sm">
                              {JSON.stringify(selectedRequest.response?.body || {}, null, 2)}
                            </pre>
                          </TabsContent>
                        </Tabs>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            ) : (
              <div className="flex h-[calc(100vh-12rem)] items-center justify-center text-muted-foreground">
                Select a request to see its details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

