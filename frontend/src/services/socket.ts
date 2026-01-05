import { io, Socket } from "socket.io-client";
import config from "../config/config";

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect() {
    if (this.socket?.connected) {
      console.log("Socket already connected");
      return;
    }

    this.socket = io(config.wsUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on("connect", () => {
      console.log("WebSocket connected to parking-pay backend");
    });

    this.socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
    });

    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
    });

    // Listen for payment:confirmed event and forward to listeners
    this.socket.on("payment:confirmed", (data) => {
      console.log("📨 Received payment:confirmed event:", data);
      const callbacks = this.listeners.get("payment:confirmed");
      if (callbacks) {
        callbacks.forEach((callback) => {
          try {
            callback(data);
          } catch (error) {
            console.error("Error in payment:confirmed callback:", error);
          }
        });
      } else {
        console.warn("No listeners registered for payment:confirmed event");
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
export default socketService;
