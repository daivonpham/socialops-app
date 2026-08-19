import axios from 'axios'

/** Single HTTP client for every feature service. Base URL comes from env only. */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})
