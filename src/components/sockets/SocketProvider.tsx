'use client';

import { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  ReactNode, 
  useCallback,
  useRef 
} from 'react';
import { io, Socket } from 'socket.io-client';


interface ThumbnailProgress {
  thumbnailVersionId: string;
  status: string;
  pct: number;
  message?: string;
  meta?: any;
  timestamp?: number;
  operation?: 'generate' | 'edit'; 
}

interface ThumbnailStatus {
  thumbnailVersionId: string;
  status: string;
  progress: number;
  s3Key?: string;
  timestamp?: number;
  operation?: 'generate' | 'edit';
}

interface ConnectionMetrics {
  latency: number;
  lastPing: number;
  transportUpgrades: number;
  reconnectionAttempts: number;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  transport: string;
  connectionError: string | null;
  connectionMetrics: ConnectionMetrics;
  forceReconnect: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  transport: '',
  connectionError: null,
  connectionMetrics: {
    latency: 0,
    lastPing: 0,
    transportUpgrades: 0,
    reconnectionAttempts: 0
  },
  forceReconnect: () => {}
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
  debug?: boolean;
  maxReconnectionAttempts?: number;
  reconnectionDelay?: number;
}

export function SocketProvider({ 
  children, 
  debug = false,
  maxReconnectionAttempts = 10,
  reconnectionDelay = 1000
}: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState('');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionMetrics, setConnectionMetrics] = useState<ConnectionMetrics>({
    latency: 0,
    lastPing: 0,
    transportUpgrades: 0,
    reconnectionAttempts: 0
  });

  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectionAttemptsRef = useRef(0);


  const startPingMonitoring = useCallback((socketInstance: Socket) => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }

    pingIntervalRef.current = setInterval(() => {
      const startTime = Date.now();
      
      socketInstance.emit('ping', (response: any) => {
        const latency = Date.now() - startTime;
        setConnectionMetrics(prev => ({
          ...prev,
          latency,
          lastPing: Date.now()
        }));
        
      });
    }, 10000); // Ping every 10 seconds
  }, []);

  const forceReconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      socket.connect();
    }
  }, [socket]);

  useEffect(() => {

    const socketInstance = io(process.env.FRONTEND_URL,{
      path: "/socket",
      transports: ['websocket'],
      timeout: 20000,
      forceNew: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: maxReconnectionAttempts,
      reconnectionDelay: reconnectionDelay,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      closeOnBeforeunload: false,
    });

    // Connection success
    socketInstance.on('connect', () => {
      const currentTransport = socketInstance.io.engine.transport.name;      
      setIsConnected(true);
      setTransport(currentTransport);
      setConnectionError(null);
      reconnectionAttemptsRef.current = 0;
      
      setConnectionMetrics(prev => ({
        ...prev,
        reconnectionAttempts: 0
      }));

      // Start ping monitoring
      startPingMonitoring(socketInstance);
    });

    // Transport upgrade handling
    socketInstance.io.engine.on('upgrade', () => {
      const newTransport = socketInstance.io.engine.transport.name;      
      setTransport(newTransport);
      setConnectionMetrics(prev => ({
        ...prev,
        transportUpgrades: prev.transportUpgrades + 1
      }));
    });

    socketInstance.io.engine.on('upgradeError', (error) => {
    });

    // Connection errors
    socketInstance.on('connect_error', (error) => {
      reconnectionAttemptsRef.current++;
      setConnectionError(error.message);
      setIsConnected(false);
      setConnectionMetrics(prev => ({
        ...prev,
        reconnectionAttempts: reconnectionAttemptsRef.current
      }));
    });

    // Disconnection handling
    socketInstance.on('disconnect', (reason) => {
      setIsConnected(false);
      setTransport('');
      
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }

      // Handle different disconnect reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect - reconnect manually
        socketInstance.connect();
      } else if (reason === 'ping timeout') {
        setConnectionError('Connection timeout');
      }
    });

    // Reconnection attempt tracking
    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      setConnectionMetrics(prev => ({
        ...prev,
        reconnectionAttempts: attemptNumber
      }));
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      setConnectionError(null);
    });

    socketInstance.on('reconnect_failed', () => {
      setConnectionError('Failed to reconnect - max attempts reached');
    });

    // General error handler
    socketInstance.on('error', (error) => {
      setConnectionError(error.message || 'Socket error occurred');
    });

    // Browser visibility API for connection management
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
      } else {
        if (socketInstance.connected) {
          startPingMonitoring(socketInstance);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    setSocket(socketInstance);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      
      socketInstance.disconnect();
    };
  }, [ maxReconnectionAttempts, reconnectionDelay, startPingMonitoring]);

  return (
    <SocketContext.Provider value={{ 
      socket, 
      isConnected, 
      transport,
      connectionError,
      connectionMetrics,
      forceReconnect
    }}>
      {children}
    </SocketContext.Provider>
  );
}


 function useThumbnailSocket(thumbnailVersionId?: string, operation?: 'generate' | 'edit') {
  console.log("thumbnailVersionId", thumbnailVersionId, "operation", operation);
  const { socket, isConnected, transport } = useSocket();
  const [progress, setProgress] = useState<ThumbnailProgress | null>(null);
  const [generateProgress, setGenerateProgress] = useState<ThumbnailProgress | null>(null);
  const [editProgress, setEditProgress] = useState<ThumbnailProgress | null>(null);
  const [status, setStatus] = useState<ThumbnailStatus | null>(null);
  const [isInRoom, setIsInRoom] = useState(false);
  const [isInGenerateRoom, setIsInGenerateRoom] = useState(false);
  const [isInEditRoom, setIsInEditRoom] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    if (!socket || !isConnected || !thumbnailVersionId) {
      console.log("Socket not connected or thumbnailVersionId not provided");
      setIsInRoom(false);
      setIsInGenerateRoom(false);
      setIsInEditRoom(false);
      return;
    }
    
    // Always join the general thumbnail room
    socket.emit('join-thumbnail', thumbnailVersionId);

    // Join specific operation rooms based on the operation parameter
    if (operation === 'generate') {
      socket.emit('join-thumbnail-generate', thumbnailVersionId);
    }
    if (operation === 'edit') {
      socket.emit('join-thumbnail-edit', thumbnailVersionId);
    }

    const handleJoined = (data: { 
      thumbnailVersionId: string; 
      room: string; 
      transport?: string;
      clientId?: string;
    }) => {
      setIsInRoom(true);
    };

    const handleJoinedGenerate = (data: { thumbnailVersionId: string; room: string }) => {
      setIsInGenerateRoom(true);
    };

    const handleJoinedEdit = (data: { thumbnailVersionId: string; room: string }) => {
      setIsInEditRoom(true);
    };

    const handleLeft = (data: { thumbnailVersionId: string }) => {
      setIsInRoom(false);
      setIsInGenerateRoom(false);
      setIsInEditRoom(false);
    };

    const handleProgress = (data: ThumbnailProgress) => {
      if (data.thumbnailVersionId === thumbnailVersionId) {
        setProgress(data);
        setLastUpdate(Date.now());
      }
    };

    const handleGenerateProgress = (data: ThumbnailProgress) => {
      if (data.thumbnailVersionId === thumbnailVersionId) {
        setGenerateProgress(data);
        setLastUpdate(Date.now());
      }
    };

    const handleEditProgress = (data: ThumbnailProgress) => {
      if (data.thumbnailVersionId === thumbnailVersionId) {
        setEditProgress(data);
        setLastUpdate(Date.now());
      }
    };

    const handleStatus = (data: ThumbnailStatus) => {
      if (data.thumbnailVersionId === thumbnailVersionId) {
        setStatus(data);
        setLastUpdate(Date.now());
      }
    };

    const handleError = (data: { thumbnailVersionId: string; error: string; operation?: string }) => {
      if (data.thumbnailVersionId === thumbnailVersionId) {
console.log("error", data);
      }
    };

    socket.on('joined', handleJoined);
    socket.on('joined-generate', handleJoinedGenerate);
    socket.on('joined-edit', handleJoinedEdit);
    socket.on('left', handleLeft);
    socket.on('thumbnail:progress', handleProgress);
    socket.on('thumbnail:generate:progress', handleGenerateProgress);
    socket.on('thumbnail:edit:progress', handleEditProgress);
    socket.on('thumbnail:status', handleStatus);
    socket.on('thumbnail:error', handleError);


    return () => { 
      socket.emit('leave-thumbnail', thumbnailVersionId);
      socket.off('joined', handleJoined);
      socket.off('joined-generate', handleJoinedGenerate);
      socket.off('joined-edit', handleJoinedEdit);
      socket.off('left', handleLeft);
      socket.off('thumbnail:progress', handleProgress);
      socket.off('thumbnail:generate:progress', handleGenerateProgress);
      socket.off('thumbnail:edit:progress', handleEditProgress);
      socket.off('thumbnail:status', handleStatus);
      socket.off('thumbnail:error', handleError);
      
      setIsInRoom(false);
      setIsInGenerateRoom(false);
      setIsInEditRoom(false);
      setProgress(null);
      setGenerateProgress(null);
      setEditProgress(null);
      setStatus(null);
    };
  }, [socket, isConnected, thumbnailVersionId, operation, transport]);

  const requestStatus = useCallback(() => {
    if (!socket || !isConnected || !thumbnailVersionId) {
      return Promise.reject(new Error('Not connected'));
    }

    return new Promise<void>((resolve, reject) => {
      const handleStatus = (data: ThumbnailStatus) => {
        if (data.thumbnailVersionId === thumbnailVersionId) {
          if (statusTimeoutRef.current) {
            clearTimeout(statusTimeoutRef.current);
          }
          resolve();
        }
      };

      socket.once('thumbnail:status', handleStatus);
      socket.emit('get-thumbnail-status', thumbnailVersionId);
    });
  }, [socket, isConnected, thumbnailVersionId]);

  return { 
    socket, 
    isConnected, 
    transport,
    progress, 
    generateProgress,
    editProgress,
    status, 
    isInRoom,
    isInGenerateRoom,
    isInEditRoom,
    lastUpdate,
    requestStatus 
  };
}

// Convenience hooks for specific operations
export function useThumbnailGenerateSocket(thumbnailVersionId?: string) {
  return useThumbnailSocket(thumbnailVersionId, 'generate');
}

export function useThumbnailEditSocket(thumbnailVersionId?: string) {
  return useThumbnailSocket(thumbnailVersionId, 'edit');
}
