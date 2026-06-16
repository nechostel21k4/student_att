import axios from 'axios';
import { API_BASE_URL } from '../config';

import { getToken } from './studentStorage';

const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            window.dispatchEvent(new Event('app:session-expired'));
        }
        return Promise.reject(error);
    }
);

export default api;
