/**
 * Only the auth token and roll number ID are persisted in localStorage.
 * All other student profile data (name, phone, email, etc.) stays in
 * React Context (in-memory) and is never written to browser storage.
 */

export const saveStudentSession = (token, rollNo) => {
    localStorage.setItem('studentToken', token);
    localStorage.setItem('studentId', rollNo);
};

export const clearStudentSession = () => {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentId');
};

export const getToken = () => localStorage.getItem('studentToken');
export const getStudentId = () => localStorage.getItem('studentId');
