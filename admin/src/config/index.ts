export const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1";

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ?? "http://localhost:5000";

export const BRAND = {
  name: "WebSyner",
  colorPrimary: "#0fcda1",
  colorNavy: "#1e2d40",
} as const;
