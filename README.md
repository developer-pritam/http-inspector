
# Network Inspector

A powerful network inspection tool that allows you to intercept, monitor, and manipulate HTTP requests in real-time. It consists of two main components: an interceptor server that handles the request forwarding and a modern web UI for visualization and interaction.

## Features

- 🔍 Real-time request monitoring
- 🔄 Request replay capability
- 📝 Request modification
- 📋 cURL command generation
- 🎯 Request filtering by method or route
- 📊 Detailed request/response inspection
- 💾 Form data handling
- ⚡ Server-Sent Events for live updates

## Project Structure

The project is divided into two main parts:

- `interceptor/`: The Node.js server that handles request interception and forwarding
- `ui/`: A Next.js web application that provides the user interface

## Prerequisites

- Node.js (v18 or later)
- npm or yarn
- A target server to forward requests to

## Installation

1. Clone the repository:
```bash
git clone https://github.com/developer-pritam/http-inspector
cd http-inspector
```

2. Install dependencies for both the interceptor and UI:
```bash
# Install interceptor dependencies
cd interceptor
npm install

# Install UI dependencies
cd ../ui
npm install
```

## Configuration

### Interceptor

The interceptor accepts the following command-line arguments:

- `--target`: (Required) The target URI to forward requests to
- `--interceptor-port`: (Optional) Port for the interceptor to listen on (default: 8000)
- `--api-port`: (Optional) Port for the API routes (default: 8001)

### UI

The UI is configured to connect to the interceptor API by default. If you need to modify the connection settings, update the environment variables in a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8001
```

## Running the Application

1. Start the interceptor:
```bash
cd interceptor
npm start -- --target="http://your-target-server.com"
```

2. Start the UI development server:
```bash
cd ui
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Configure your application to send requests through the interceptor by updating your API base URL to `http://localhost:8000`

2. All requests will now be visible in the Network Inspector UI

3. Use the UI to:
   - Monitor incoming requests in real-time
   - Filter requests by method or route
   - Inspect request and response details
   - Modify and replay requests
   - Copy requests as cURL commands

## Development

- UI is built with Next.js 14 and Tailwind CSS
- Interceptor uses Express.js
- Real-time updates are handled through Server-Sent Events
- TypeScript is used throughout the project


