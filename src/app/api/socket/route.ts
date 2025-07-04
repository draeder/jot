// Simple WebSocket endpoint info
export async function GET() {
  return Response.json({
    message: 'WebSocket endpoint available',
    endpoint: '/api/socket',
    usage: 'WebSocket server will be initialized when the app starts',
    note: 'This endpoint provides WebSocket connection info'
  })
}

// Handle WebSocket upgrade in a different way
export async function PATCH() {
  return Response.json({
    message: 'WebSocket upgrade endpoint',
    status: 'ready'
  })
}
