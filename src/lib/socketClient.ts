// import { io } from 'socket.io-client';
// let socket;

// export function initSocket() {
//   if (!socket) {
//     socket = io('/', { path: '/api/socket', autoConnect: false });
//     socket.on('connect', () => { console.log('socket connected', socket.id); });
//     socket.on('disconnect', () => { console.log('socket disconnected'); });
//   }
//   if (!socket.connected) socket.connect();
//   return socket;
// }

// export function joinRoom(thumbnailId) {
//   const s = initSocket();
//   s.emit('join', thumbnailId);
//   return s;
// }
import { io, Socket } from 'socket.io-client';

let socket: Socket;

export const initSocket = (): Socket => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
  }
  return socket;
};

export const joinRoom = (roomId: string) => {
  if (socket) {
    socket.emit('join', roomId);
  }
};

export const getSocket = () => socket;