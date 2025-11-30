import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE_URL;

export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});
