import axios from 'axios';
import { AppConfig } from '../config'; // <--- Importamos a config aqui

const api = axios.create({
  baseURL: AppConfig.API_BASE_URL, // Usa a URL da config
  timeout: AppConfig.TIMEOUT
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AppConfig.STORAGE_KEYS.TOKEN); // Usa a chave da config
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;