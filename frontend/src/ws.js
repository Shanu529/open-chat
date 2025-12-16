import { io } from 'socket.io-client';

export function connectWS() {
  return io(import.meta.env.VITE_BACKEND_URL);
}
