import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "../config";

let socket: Socket | null = null;

/**
 * Single shared connection. The access token is passed on the handshake and
 * refreshed on reconnect, so a rotated token never leaves a stale session open.
 */
export const connectSocket = (getToken: () => string | null): Socket => {
  if (socket) {
    socket.auth = { token: getToken() };
    if (!socket.connected) socket.connect();
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token: getToken() },
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    transports: ["websocket", "polling"],
  });

  // socket.io does not re-read `auth` automatically before a reconnect attempt.
  socket.io.on("reconnect_attempt", () => {
    if (socket) socket.auth = { token: getToken() };
  });

  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

export const getSocket = () => socket;
