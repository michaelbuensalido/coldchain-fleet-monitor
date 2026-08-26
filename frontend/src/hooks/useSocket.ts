import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('vehicle:telemetry', (data) => {
      setTelemetry(data);
    });

    newSocket.on('vehicle:status', (data) => {
      setStatus(data);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return { socket, telemetry, status };
}
