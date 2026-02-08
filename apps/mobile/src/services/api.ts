import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.API_BASE_URL || 'http://10.0.2.2:3000'
});

export function setAccessToken(token?: string) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
}
