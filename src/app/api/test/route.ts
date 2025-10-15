// src/app/api/socket/route.ts

import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { NextRequest } from 'next/server';

// Global Socket.IO server instance
let io: Server | undefined;
let isInitialized = false;

// Redis connection with authentication
const redisOptions = {
  // Parse Redis URL or use individual options
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD, // Add Redis password
    username: process.env.REDIS_USERNAME, // Add Redis username if needed
  // Additional Redis options
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
  lazyConnect: true, // Don't connect immediately
};

// Create Redis clients with proper error handling
const pubClient =  new Redis(redisOptions);

const subClient =  new Redis(redisOptions);

const progressSub = new Redis(redisOptions);

// Better error handling for Redis connections
pubClient.on('error', (err) => {
  console.error('Redis Pub Client error:', err.message);
});

subClient.on('error', (err) => {
  console.error('Redis Sub Client error:', err.message);
});

progressSub.on('error', (err) => {
  console.error('Redis Progress Client error:', err.message);
});

// Add connection success logging
pubClient.on('connect', () => console.log('Redis Pub Client connected'));
subClient.on('connect', () => console.log('Redis Sub Client connected'));
progressSub.on('connect', () => console.log('Redis Progress Client connected'));

async function initializeSocketIO() {
  if (isInitialized && io) return io;

  console.log('Setting up Socket.IO with Redis Adapter for horizontal scaling');
  
  try {
    // Test Redis connections before proceeding
    await pubClient.ping();
    await subClient.ping();
    await progressSub.ping();
    console.log('✅ All Redis connections established');
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    // You might want to fall back to in-memory adapter or throw
    throw new Error('Redis connection required for Socket.IO scaling');
  }
  
  // Create Socket.IO server
  io = new Server({
     path: "/api/socket",
    transports: ['polling', 'websocket'],
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL 
        : ["http://localhost:3000", "http://localhost:3001"],
      methods: ["GET", "POST"],
      credentials: true
    },
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
  });
  
  // 🚀 CRITICAL: Redis adapter enables horizontal scaling
  io.adapter(createAdapter(pubClient, subClient));

  // Subscribe to progress updates from workers
  if (!progressSub.listenerCount('message')) {
    await progressSub.subscribe('thumbnail:progress');
    progressSub.on('message', (channel, message) => {
      if (channel === 'thumbnail:progress') {
        try {
          const data = JSON.parse(message);
          console.log(`Broadcasting progress for ${data.thumbnailId}: ${data.status} ${data.pct}%`);
          
          // This works across ALL instances thanks to Redis adapter!
          io!.to(data.thumbnailId).emit('thumbnail:progress', data);
          
        } catch (err) {
          console.error('Failed to parse progress message:', err);
        }
      }
    });
  }
    io.on("connection_error", (err) => {
  console.error("❌ Engine connection error:", err.code, err.message);
});
  // Handle client connections
  io.on('connection', (socket) => {
    console.log("🚀 Socket.IO server initialized with Redis adapter");
    console.log(`Client connected: ${socket.id}`);
    
    // Join thumbnail-specific room for progress updates
    socket.on('join-thumbnail', (thumbnailId) => {
      if (!thumbnailId) return;
      
      socket.join(thumbnailId);
      console.log(`Client ${socket.id} joined thumbnail room: ${thumbnailId}`);
      
      // Send current status if available
      socket.emit('joined', { thumbnailId, room: thumbnailId });
    });

    // // Join admin room for monitoring all thumbnails
    // socket.on('join-admin', () => {
    //   socket.join('admin');
    //   console.log(`Admin client joined: ${socket.id}`);
    // });
    
    // Leave thumbnail room
    socket.on('leave-thumbnail', (thumbnailId) => {
      socket.leave(thumbnailId);
      console.log(`Client ${socket.id} left thumbnail room: ${thumbnailId}`);
    });
    
    // Handle manual progress request
    socket.on('get-thumbnail-status', async (thumbnailId) => { 
      try {
        // Mock data for now
        socket.emit('thumbnail:status', {
          thumbnailId,
          status: 'processing',
          progress: 50,
          s3Key: null
        });
      } catch (err) {
        console.error('Error fetching thumbnail status:', err);
        socket.emit('thumbnail:error', { 
          thumbnailId, 
          error: 'Failed to fetch status' 
        });
      }
    });
    
    socket.on('disconnect', (reason) => {
      console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
    });
  });

  console.log('✅ Socket.IO server initialized with Redis adapter');
  isInitialized = true;
  return io;
}

// Convert NextRequest to Node.js IncomingMessage-like object
function createNodeRequest(req: NextRequest): any {
  const url = new URL(req.url);
  
  return {
    method: req.method,
    url: url.pathname + url.search,
    headers: Object.fromEntries(req.headers.entries()),
    connection: {
      remoteAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1'
    },
    socket: {
      remoteAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1'
    },
    httpVersion: '1.1',
    httpVersionMajor: 1,
    httpVersionMinor: 1,
    // Add stream-like methods
    on: () => {},
    once: () => {},
    emit: () => false,
    removeListener: () => {},
    pipe: () => {},
    unpipe: () => {},
    readable: true,
    readableEnded: false,
    destroyed: false
  };
}

// Create Node.js ServerResponse-like object
function createNodeResponse(resolve: (response: Response) => void): any {
  let statusCode = 200;
  let headers: Record<string, string> = {};
  let body = '';
  
  return {
    statusCode,
    headersSent: false,
    finished: false,
    
    writeHead(status: number, responseHeaders?: Record<string, string>) {
      statusCode = status;
      if (responseHeaders) {
        headers = { ...headers, ...responseHeaders };
      }
    },
    
    setHeader(name: string, value: string) {
      headers[name] = value;
    },
    
    getHeader(name: string) {
      return headers[name.toLowerCase()];
    },
    
    removeHeader(name: string) {
      delete headers[name.toLowerCase()];
    },
    
    write(chunk: string) {
      body += chunk;
    },
    
    end(chunk?: string) {
      if (chunk) body += chunk;
      
      resolve(new Response(body, {
        status: statusCode,
        headers: new Headers(headers)
      }));
    },
    
    // Add event emitter methods
    on: () => {},
    once: () => {},
    emit: () => false,
    removeListener: () => {},
    
    // Additional ServerResponse properties
    writable: true,
    writableEnded: false,
    destroyed: false
  };
}

export async function GET(req: NextRequest) {
  try {
    console.log("🚀 Socket.IO server initialized with Redis adapter in nextjs");
    const socketIO = await initializeSocketIO();
    const url = new URL(req.url);
    
    // Check if this is a Socket.IO request
    const transport = url.searchParams.get('transport');
    const EIO = url.searchParams.get('EIO');
    
    if (EIO && transport && socketIO?.engine) {
      return new Promise<Response>((resolve) => {
        const nodeReq = createNodeRequest(req);
        const nodeRes = createNodeResponse(resolve);
        
        try {
          // Let Socket.IO's engine handle the request
          socketIO.engine.handleRequest(nodeReq, nodeRes);
        } catch (error) {
          console.error('Socket.IO GET error:', error);
          resolve(new Response('Internal Server Error', { 
            status: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Credentials': 'true'
            }
          }));
        }
      });
    }
    
    // Regular health check endpoint
    return new Response(JSON.stringify({ 
      status: 'Socket.IO server running',
      initialized: isInitialized,
      engineReady: !!socketIO?.engine,
      timestamp: Date.now()
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true'
      }
    });
  } catch (error) {
    console.error('GET handler error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to initialize Socket.IO',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true'
      }
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const socketIO = await initializeSocketIO();
    const url = new URL(req.url);
    
    // Check if this is a Socket.IO request
    const transport = url.searchParams.get('transport');
    const EIO = url.searchParams.get('EIO');
    
    if (EIO && transport && socketIO?.engine) {
      return new Promise<Response>(async (resolve) => {
        const nodeReq = createNodeRequest(req);
        const nodeRes = createNodeResponse(resolve);
        
        try {
          // For POST requests, we need to handle the body
          if (req.body) {
            const body = await req.text();
            // Add the body to our mock request
            (nodeReq as any).body = body;
            (nodeReq as any).rawBody = Buffer.from(body);
            
            // Emit data events to simulate stream
            process.nextTick(() => {
              nodeReq.emit('data', Buffer.from(body));
              nodeReq.emit('end');
            });
          }
          
          // Let Socket.IO's engine handle the request
          socketIO.engine.handleRequest(nodeReq, nodeRes);
        } catch (error) {
          console.error('Socket.IO POST error:', error);
          resolve(new Response('Internal Server Error', { 
            status: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Credentials': 'true'
            }
          }));
        }
      });
    }
    
    return new Response('OK', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true'
      }
    });
  } catch (error) {
    console.error('POST handler error:', error);
    return new Response('Internal Server Error', { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true'
      }
    });
  }
}

export async function OPTIONS(req: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400'
    }
  });
}

// Export Socket.IO instance for use in other parts of your app
export function getSocketIO(): Server | undefined {
  return io;
}