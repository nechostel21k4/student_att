import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const StudentContext = createContext(null);

export const useStudent = () => useContext(StudentContext);

export const StudentProvider = ({ children }) => {
    // Initialize profile solely from memory
    const [profile, setProfile] = useState(null);
    
    // Always start with loading true if there is a token, so we can fetch the profile
    const [loading, setLoading] = useState(() => {
        return localStorage.getItem('studentToken') ? true : false;
    });

    const updateProfileState = (newProfile) => {
        setProfile(newProfile);
    };

    const loadProfile = useCallback(async () => {
        const token = localStorage.getItem('studentToken');
        const sid = localStorage.getItem('studentId');
        if (!token || !sid) {
            setLoading(false);
            return;
        }
        
        try {
            const res = await axios.get(`${API_BASE_URL}/student/${sid}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.isExist) {
                updateProfileState(res.data.hosteler);
            }
        } catch (err) {
            // Only clear session on auth failure — ignore network errors silently
            if (err.response?.status === 401) {
                clearSession();
            }
            // 404, 500, network errors: keep existing profile in memory
        } finally {
            setLoading(false);
        }
    }, []);

    // Load profile when app starts (if token exists)
    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const clearSession = () => {
        localStorage.removeItem('studentToken');
        localStorage.removeItem('studentId');
        localStorage.removeItem('studentProfilePicCache');
        setProfile(null);
    };

    return (
        <StudentContext.Provider value={{ profile, loading, loadProfile, clearSession, setProfile: updateProfileState }}>
            {children}
        </StudentContext.Provider>
    );
};
