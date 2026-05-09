import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { 
    saveSecureProfile, 
    getSecureProfile, 
    clearStudentSession,
    getToken,
    getStudentId
} from '../services/studentStorage';

const StudentContext = createContext(null);

export const useStudent = () => useContext(StudentContext);

export const StudentProvider = ({ children }) => {
    // Initialize profile from secure local storage to avoid "Student not found" on reload
    const [profile, setProfile] = useState(() => getSecureProfile());
    
    // If we have a profile in storage, we might still want to refresh it, 
    // but we can start with loading=false if we already have data.
    const [loading, setLoading] = useState(() => {
        const token = getToken();
        const existingProfile = getSecureProfile();
        // If we have a token but NO profile, we MUST load, so loading = true.
        // If we have both, we can show existing data immediately (loading = false).
        return (token && !existingProfile) ? true : false;
    });

    const updateProfileState = (newProfile) => {
        setProfile(newProfile);
        saveSecureProfile(newProfile);
    };

    const loadProfile = useCallback(async () => {
        const token = getToken();
        const sid = getStudentId();
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
        } finally {
            setLoading(false);
        }
    }, []);

    // Load profile when app starts
    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const clearSession = () => {
        clearStudentSession();
        setProfile(null);
    };

    return (
        <StudentContext.Provider value={{ profile, loading, loadProfile, clearSession, setProfile: updateProfileState }}>
            {children}
        </StudentContext.Provider>
    );
};

