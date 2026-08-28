import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL, getAuthToken } from '../config';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    const token = getAuthToken();

    // Explicitly configure transports and bearer auth so Safari (ITP) and
    // Mobile Chrome (WebKit / Android) do not fall back to insecure cookie-based
    // session handshakes which get blocked cross-origin.
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      secure: SOCKET_URL.startsWith('https'),
      auth: { token },
      withCredentials: false, // Use bearer token only — not cookies
    });

    setSocket(newSocket);

    newSocket.on('vehicle:telemetry', (data) => {
      setTelemetry(data);
    });

    newSocket.on('vehicle:status', (data) => {
      setStatus(data);
    });

    return () => {
      newSocket.removeAllListeners();
      // Defer disconnect so transient unmounts (like React 18 Strict Mode double-invokes)
      // don't abort the WebSocket handshake synchronously while CONNECTING.
      setTimeout(() => {
        newSocket.disconnect();
      }, 0);
    };
  }, []);

  return { socket, telemetry, status };
}
