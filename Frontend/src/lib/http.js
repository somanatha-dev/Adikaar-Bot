import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE_URL;

export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Add token to requests if available
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Store token from responses
http.interceptors.response.use((response) => {
  if (response.data?.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response;
}, (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('token');
  }
  return Promise.reject(error);
});
