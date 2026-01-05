export const config = {
  apiUrl: import.meta.env.VITE_API_URL || "http://localhost:3001",
  wsUrl: import.meta.env.VITE_WS_URL || "http://localhost:3001", // WebSocket từ parking-pay backend (relay từ parking-lock)
};

export default config;
