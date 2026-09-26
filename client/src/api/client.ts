import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

export interface HealthResponse {
  ok: boolean;
  db: boolean;
  timestamp: string;
  uptime: number;
  error?: string;
}

export const fetchHealth = async (): Promise<HealthResponse> => {
  const { data } = await api.get<HealthResponse>('/health');
  return data;
};
