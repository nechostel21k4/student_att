/**
 * Security Utility: Simple obfuscation for local storage.
 * Note: For production, consider SubtleCrypto or a library like CryptoJS.
 */
const _key = 0x58; // Secret key for XOR
const encrypt = (str) => {
    if (!str) return null;
    try {
        // Handle Unicode characters correctly before btoa
        const utf8 = unescape(encodeURIComponent(str));
        const obfuscated = utf8.split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ _key)).join('');
        return btoa(obfuscated);
    } catch (e) {
        return null;
    }
};

const decrypt = (encoded) => {
    if (!encoded) return null;
    try {
        const decoded = atob(encoded).split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ _key)).join('');
        // Reverse Unicode handling with safety catch
        try {
            return decodeURIComponent(escape(decoded));
        } catch (e) {
            return decoded; // Fallback to raw decoded string if it's not UTF-8
        }
    } catch (e) {
        return null;
    }
};



export const saveStudentSession = (token, rollNo) => {
    localStorage.setItem('studentToken', token);
    localStorage.setItem('studentId', rollNo);
};

export const saveSecureProfile = (profile) => {
    if (!profile) return;
    localStorage.setItem('student_p_secure', encrypt(JSON.stringify(profile)));
};

export const getSecureProfile = () => {
    const data = localStorage.getItem('student_p_secure');
    if (!data) return null;
    const decrypted = decrypt(data);
    try {
        return decrypted ? JSON.parse(decrypted) : null;
    } catch (e) {
        return null;
    }
};

export const clearStudentSession = () => {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentId');
    localStorage.removeItem('student_p_secure');
    localStorage.removeItem('studentProfilePicCache');
};

export const getToken = () => localStorage.getItem('studentToken');
export const getStudentId = () => localStorage.getItem('studentId');

