// API Configuration
// Reads from .env.production during build

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';

export { API_BASE_URL, WS_URL };
