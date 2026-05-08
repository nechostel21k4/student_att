import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('studentToken');
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

export const verifyStudent = async (rollNo) => {
    try {
        const response = await api.get(`/student/verify/${rollNo}`);
        return response.data;
    } catch (err) {
        throw err;
    }
};

export const verifyOtp = async (rollNo, otp) => {
    try {
        const response = await api.post(`/student-auth/verifyOTP`, { rollNo, otp });
        return response.data;
    } catch (err) {
        throw err;
    }
};

export const updatePassword = async (rollNo, newPassword, resetToken) => {
    try {
        const response = await api.put(`/student-auth/update-password`, { rollNo, newPassword, resetToken });
        return response.data;
    } catch (err) {
        throw err;
    }
};
