import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Clock, FileText, Send, History, Loader, Keyboard } from 'lucide-react';
import { API_BASE_URL } from '../config';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useStudent } from '../context/StudentContext';

// SmartDatePicker Component
const SmartDatePicker = ({ ...props }) => {
    const [isManual, setIsManual] = useState(false);
    const datePickerRef = React.useRef(null);

    const toggleManual = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsManual(!isManual);
        if (!isManual && datePickerRef.current) {
            datePickerRef.current.setFocus();
        }
    };

    const handleChange = (date, event) => {
        if (props.onChange) {
            props.onChange(date, event);
        }

        // Auto-close logic for "read-only" (picker) mode
        if (!isManual && datePickerRef.current) {
            // If it's a simple Date picker or Time only picker, close immediately on selection
            // We check props to see what kind of picker it is
            const isDateOnly = !props.showTimeSelect && !props.showTimeInput;
            const isTimeOnly = props.showTimeSelectOnly || props.showTimeInput;

            // Note: For showTimeSelect (Date + Time), usually we want to keep it open after Date pick
            // so user can pick time. React-datepicker handles closing after Time pick by default.
            // If user is reporting "not closing", we ensure we enforce it for single-step actions at least.

            if (isDateOnly || isTimeOnly) {
                datePickerRef.current.setOpen(false);
            }
        }
    };

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            <DatePicker
                {...props}
                ref={datePickerRef}
                onChange={handleChange} // Intercept onChange
                shouldCloseOnSelect={true} // Enforce default
                // When manual is FALSE:
                // We want the picker to open on click. 
                // We do NOT want the keyboard to open.
                // Moving readOnly to the input itself via customInput ensures DatePicker still receives click events but the input doesn't trigger keyboard.

                // When manual is TRUE: 
                // We want the keyboard to open.
                // We might NOT want the picker to open automatically on focus (optional, but standard behavior is fine).

                onBlur={() => setIsManual(false)}
                customInput={
                    <input
                        // Apply readOnly ONLY to the input element when not manual
                        readOnly={!isManual}
                        // inputMode="none" helps on some mobile browsers to prevent keyboard if readOnly isn't enough
                        inputMode={!isManual ? "none" : "text"}
                        autoComplete="off"
                        style={{ paddingRight: '40px' }}
                        // Explicitly open on click if readOnly (sometimes needed depending on browser behavior)
                        onClick={() => {
                            if (!isManual && datePickerRef.current) {
                                datePickerRef.current.setOpen(true);
                            }
                        }}
                    />
                }
            />
            <button
                type="button"
                onClick={toggleManual}
                style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: isManual ? '#6366f1' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    zIndex: 10,
                    transition: 'color 0.2s'
                }}
                title="Toggle Keyboard Input"
            >
                <Keyboard size={18} />
            </button>
        </div>
    );
};

const StudentLeave = () => {
    const { profile, loadProfile } = useStudent();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [canApply, setCanApply] = useState(true);
    const [blockMessage, setBlockMessage] = useState('');

    // Form State
    const [requestType, setRequestType] = useState('LEAVE'); // LEAVE or PERMISSION
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null); // For Leave
    const [fromTime, setFromTime] = useState(null); // For Permission
    const [toTime, setToTime] = useState(null); // For Permission
    const [reason, setReason] = useState('');

    const token = localStorage.getItem('studentToken');
    const sid = localStorage.getItem('studentId');

    useEffect(() => {
        if (!token || !sid) {
            navigate('/');
            return;
        }
        if (profile) {
            setStudent(profile);
            
            // Check for active requests
            if (profile.lastRequest) {
                const prevReq = profile.lastRequest;

                if (prevReq.status === 'SUBMITTED' && prevReq.isActive) {
                    setCanApply(false);
                    setBlockMessage("Request Pending: You already have a pending request. Please wait for approval.");
                } else if (prevReq.status === 'ACCEPTED' && prevReq.isActive) {
                    const now = new Date();
                    let isActive = false;

                    if (prevReq.type === 'LEAVE' && prevReq.toDate) {
                        const toDate = new Date(prevReq.toDate);
                        if (now <= toDate) isActive = true;
                    } else if (prevReq.type === 'PERMISSION' && prevReq.toTime) {
                        const toTime = new Date(prevReq.toTime);
                        if (now <= toTime) isActive = true;
                    }

                    if (isActive) {
                        setCanApply(false);
                        setBlockMessage("Request Active: You have an active request. Cannot apply until it expires.");
                    }
                }
            }
            setLoading(false);
        }
    }, [navigate, profile]);

    const handleFromTimeChange = (time) => {
        if (!time) {
            setFromTime(null);
            return;
        }

        if (requestType === 'PERMISSION') {
            // Check if date is selected
            if (!fromDate) {
                toast.error("Please select a date first");
                return;
            }

            const fTime = new Date(fromDate);
            fTime.setHours(time.getHours(), time.getMinutes());

            // Compare with current time
            // Create a 'now' date
            const now = new Date();

            if (fTime < now) {
                toast.error("From time cannot be in the past");
                return; // Prevent setting the invalid time
            }
        }

        setFromTime(time);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!student) return;

        setSubmitting(true);

        try {
            // Construct lastRequest object
            const baseRequest = {
                name: student.name,
                rollNo: student.rollNo,
                hostelId: student.hostelId,
                id: `REQ${Date.now()} `, // Generated Unique ID
                phoneNo: student.phoneNo,
                parentPhoneNo: student.parentPhoneNo,
                reason: reason,
                type: requestType,
                isActive: true,
                status: 'SUBMITTED',
                submitted: {
                    time: new Date(),
                    name: student.name,
                    rollNo: student.rollNo
                }
            };

            let requestPayload = {};

            if (requestType === 'LEAVE') {
                // Validation: To Date cannot be before If From Date
                if (fromDate && toDate && toDate < fromDate) {
                    toast.error("To Date cannot be before From Date");
                    setSubmitting(false);
                    return;
                }

                requestPayload = {
                    ...baseRequest,
                    fromDate: fromDate,
                    toDate: toDate
                };
            } else {
                // Permission logic
                // Ensure fromDate (which acts as 'Date' in permission) is set
                const dateObj = fromDate;

                // For permission, fromTime and toTime should be Date objects already set by DatePicker
                // We just need to merge the date part if desired, but typically Permission asks for "Date" and "Time Range"
                // The current backend likely expects a full Date object for fromTime/toTime or we construct it.

                // Let's assume user picks "Date" in one picker, and "Time" in others.
                // We need to combine them to create valid Date objects for backend if it expects full ISO dates.

                // Construct full dates
                const fTime = new Date(dateObj);
                fTime.setHours(fromTime.getHours(), fromTime.getMinutes());

                // Validation: Prevent past time
                if (fTime < new Date()) {
                    toast.error("From time cannot be in the past");
                    setSubmitting(false);
                    return;
                }

                const tTime = new Date(dateObj);
                tTime.setHours(toTime.getHours(), toTime.getMinutes());

                requestPayload = {
                    ...baseRequest,
                    date: dateObj,
                    fromTime: fTime,
                    toTime: tTime
                };
            }

            const payload = {
                student: student,
                lastRequest: requestPayload
            };

            const res = await axios.post(`${API_BASE_URL}/student/createRequestAndUpdate/${sid}`, payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.data) {
                toast.success("Request Submitted Successfully!");
                setReason('');
                setFromDate(null);
                setToDate(null);
                setFromTime(null);
                setToTime(null);
                // Refresh student data to update restriction status
                await loadProfile();
            } else {
                toast.error("Submission Failed");
            }

        } catch (err) {
            console.error("Submit error", err);
            toast.error("Error submitting request");
        } finally {
            setSubmitting(false);
        }
    };


    return (
        <div className="leave-container" style={{
            width: '100%',
            display: 'flex', justifyContent: 'center',
            padding: '16px 16px 100px 16px' // Added responsive padding
        }}>
            <div style={{
                width: '100%', maxWidth: '900px',
                display: 'flex', flexDirection: 'column', gap: '24px'
            }}>
                {/* Page Title */}
                <div>
                    <h1 className="page-title" style={{
                        fontWeight: 'bold', margin: 0,
                        color: 'white',
                        fontSize: '1.75rem', // Adjusted for mobile
                        lineHeight: '1.2'
                    }}>
                        Apply Leave / Permission
                    </h1>
                </div>

                <div className="glass-card leave-card" style={{
                    padding: '20px', // Explicit padding
                    display: 'flex', flexDirection: 'column', gap: '20px'
                }}>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div className="skeleton" style={{ flex: 1, height: '40px', borderRadius: '12px' }}></div>
                                <div className="skeleton" style={{ flex: 1, height: '40px', borderRadius: '12px' }}></div>
                            </div>
                            <div className="skeleton" style={{ width: '100px', height: '16px' }}></div>
                            <div className="skeleton" style={{ width: '100%', height: '45px', borderRadius: '12px' }}></div>
                            <div className="skeleton" style={{ width: '100%', height: '50px', borderRadius: '12px', marginTop: '8px' }}></div>
                        </div>
                    ) : (
                        <>

                    {/* Sliding Toggle - Upgrade from Radio Buttons */}
                    <div style={{
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        marginBottom: '30px', paddingBottom: '10px'
                    }}>
                        <div 
                            onClick={() => setRequestType(requestType === 'LEAVE' ? 'PERMISSION' : 'LEAVE')}
                            style={{
                                position: 'relative',
                                display: 'flex',
                                width: '100%',
                                maxWidth: '340px',
                                background: 'rgba(15, 23, 42, 0.4)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '16px',
                                padding: '4px',
                                cursor: 'pointer',
                                userSelect: 'none'
                            }}
                        >
                            {/* Sliding Background */}
                            <div style={{
                                position: 'absolute',
                                top: '4px',
                                bottom: '4px',
                                left: requestType === 'PERMISSION' ? '4px' : 'calc(50% + 2px)',
                                width: 'calc(50% - 6px)',
                                background: '#2563eb',
                                borderRadius: '12px',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)',
                                zIndex: 1
                            }} />

                            <div style={{
                                flex: 1, textAlign: 'center', padding: '12px 0',
                                color: requestType === 'PERMISSION' ? 'white' : 'rgba(255,255,255,0.4)',
                                fontWeight: '600', fontSize: '15px', zIndex: 2,
                                transition: 'color 0.3s'
                            }}>
                                Permission
                            </div>
                            <div style={{
                                flex: 1, textAlign: 'center', padding: '12px 0',
                                color: requestType === 'LEAVE' ? 'white' : 'rgba(255,255,255,0.4)',
                                fontWeight: '600', fontSize: '15px', zIndex: 2,
                                transition: 'color 0.3s'
                            }}>
                                Leave
                            </div>
                        </div>
                    </div>

                    {/* Form Content */}
                    <form onSubmit={handleSubmit}>

                        {/* Warning Banner */}
                        {!canApply && (
                            <div style={{
                                padding: '16px', background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid #ef4444', borderRadius: '8px',
                                color: '#ef4444', marginBottom: '24px', fontWeight: '500'
                            }}>
                                {blockMessage}
                            </div>
                        )}

                        {/* Section Header */}
                        <div style={{ marginBottom: '24px' }}>
                            <h2 className="form-section-title" style={{ fontWeight: '600', color: 'white', margin: 0 }}>
                                {requestType === 'LEAVE' ? 'Leave Application' : 'Permission Request'}
                            </h2>
                        </div>

                        <div className="form-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', // Auto-responsive grid
                            gap: '20px'
                        }}>

                            {/* Row 1: Name & Roll Number */}
                            <div className="input-wrapper">
                                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
                                    Name <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={student?.name || ''}
                                    readOnly
                                    disabled
                                    className="responsive-input"
                                    style={{
                                        width: '100%', background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                                        padding: '12px', color: 'var(--text-muted)', outline: 'none',
                                        cursor: 'not-allowed'
                                    }}
                                />
                            </div>
                            <div className="input-wrapper">
                                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
                                    Roll Number <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={student?.rollNo || ''}
                                    readOnly
                                    disabled
                                    className="responsive-input"
                                    style={{
                                        width: '100%', background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                                        padding: '12px', color: 'var(--text-muted)', outline: 'none',
                                        cursor: 'not-allowed'
                                    }}
                                />
                            </div>

                            {/* Row 2: Hostel ID & Date */}
                            <div className="input-wrapper">
                                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
                                    Hostel ID <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={student?.hostelId || ''}
                                    readOnly
                                    disabled
                                    className="responsive-input"
                                    style={{
                                        width: '100%', background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                                        padding: '12px', color: 'var(--text-muted)', outline: 'none',
                                        cursor: 'not-allowed'
                                    }}
                                />
                            </div>

                            {/* Dynamic Fields Based on Type */}
                            {requestType === 'LEAVE' ? (
                                <>
                                    <div className="input-wrapper">
                                        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
                                            From Date <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <SmartDatePicker
                                            selected={fromDate}
                                            onChange={(date) => setFromDate(date)}
                                            showTimeSelect
                                            dateFormat="dd/MM/yyyy h:mm aa"
                                            placeholderText="dd-mm-yyyy --:-- --"
                                            className="responsive-input"
                                            wrapperClassName="w-full"
                                            required
                                        />
                                    </div>
                                    <div className="input-wrapper">
                                        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
                                            To Date <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <SmartDatePicker
                                            selected={toDate}
                                            onChange={(date) => setToDate(date)}
                                            showTimeSelect
                                            dateFormat="dd/MM/yyyy h:mm aa"
                                            placeholderText="dd-mm-yyyy --:-- --"
                                            className="responsive-input"
                                            wrapperClassName="w-full"
                                            required
                                            minDate={fromDate}
                                        />
                                    </div>
                                    {/* Empty div for grid alignment if needed, or let it flow */}
                                </>
                            ) : (
                                <>
                                    <div className="input-wrapper">
                                        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
                                            Date <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <SmartDatePicker
                                            selected={fromDate}
                                            onChange={(date) => setFromDate(date)}
                                            dateFormat="dd/MM/yyyy"
                                            placeholderText="dd-mm-yyyy"
                                            className="responsive-input"
                                            wrapperClassName="w-full"
                                            required
                                        />
                                    </div>
                                    <div className="input-wrapper">
                                        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
                                            From Time <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <SmartDatePicker
                                            selected={fromTime}
                                            onChange={handleFromTimeChange}
                                            showTimeSelect
                                            showTimeSelectOnly
                                            timeIntervals={15}
                                            timeCaption="Time"
                                            dateFormat="h:mm aa"
                                            placeholderText="--:-- --"
                                            className="responsive-input"
                                            wrapperClassName="w-full"
                                            required
                                        />
                                    </div>
                                    <div className="input-wrapper">
                                        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
                                            To Time <span style={{ color: '#ef4444' }}>*</span>
                                        </label>
                                        <SmartDatePicker
                                            selected={toTime}
                                            onChange={(date) => setToTime(date)}
                                            showTimeSelect
                                            showTimeSelectOnly
                                            timeIntervals={15}
                                            timeCaption="Time"
                                            dateFormat="h:mm aa"
                                            placeholderText="--:-- --"
                                            className="responsive-input"
                                            wrapperClassName="w-full"
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            {/* Reason Row - Spans full width */}
                            <div style={{ gridColumn: '1 / -1' }} className="reason-container">
                                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
                                    Reason <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    required
                                    rows={3}
                                    placeholder="Enter reason for leave/permission..."
                                    className="responsive-input"
                                    style={{
                                        width: '100%', background: 'rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                                        padding: '12px', color: 'white', outline: 'none',
                                        transition: 'border-color 0.2s', resize: 'vertical'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                />
                            </div>

                        </div>

                        {/* Submit Button */}
                        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-start' }} className="submit-container">
                            <button
                                type="submit"
                                disabled={submitting || !canApply}
                                className="btn-primary responsive-btn"
                                style={{
                                    padding: '12px 32px', borderRadius: '8px',
                                    fontSize: '1rem', fontWeight: '500',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    opacity: submitting || !canApply ? 0.7 : 1,
                                    cursor: !canApply ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {submitting ? <Loader size={18} className="spin" /> : null}
                                {submitting ? `Applying ${requestType === 'LEAVE' ? 'Leave' : 'Permission'}...` : `Apply ${requestType === 'LEAVE' ? 'Leave' : 'Permission'} `}
                            </button>
                        </div>

                            </form>
                        </>
                    )}
                </div>

                <style>{`
    /* Base Styles (Desktop First) */
    .leave-container {
        padding: 24px 24px 100px 24px;
    }
    .leave-card {
        padding: 32px;
    }
    .page-title {
        font-size: 2rem;
    }
    .toggle-group {
        display: none;
    }
    .sliding-toggle {
        display: flex;
    }
    .toggle-label {
        font-size: 1.1rem;
        font-weight: 500;
    }
    .toggle-text {
        font-size: 1.1rem;
    }
    .form-section-title {
        font-size: 1.5rem;
    }
    .form-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    .responsive-input {
        font-size: 1rem;
    }
    .submit-container {
        justify-content: flex-start;
    }

    /* Tablet (Medium Screens) */
    @media(max-width: 1024px) {
        .form-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    /* Mobile (Small Screens) */
    @media(max-width: 768px) {
        .leave-container {
            padding: 16px 16px 80px 16px !important;
        }
        .leave-card {
            padding: 24px;
        }
        .page-title {
            font-size: 1.75rem !important;
            text-align: center;
        }
        .toggle-group {
            gap: 24px;
            justify-content: center;
        }
        .toggle-label {
            font-size: 1rem;
        }
        .toggle-text {
            font-size: 1rem;
        }
        .form-grid {
            grid-template-columns: 1fr !important; /* Stack inputs vertically */
            gap: 16px;
        }
        .form-section-title {
            font-size: 1.25rem;
            text-align: center;
        }
        .submit-container {
            justify-content: center; /* Center button on mobile */
        }
        .responsive-btn {
            width: 100%; /* Full width button on mobile */
            justify-content: center;
        }
    }

    /* Very Small Screens */
    @media(max-width: 480px) {
        .leave-container {
            padding: 12px 12px 60px 12px !important;
        }
        .leave-card {
            padding: 16px;
        }
        .page-title {
            font-size: 1.5rem !important;
        }
        .toggle-group {
            gap: 16px;
        }
        .radio-circle {
            width: 18px !important;
            height: 18px !important;
        }
        .responsive-input {
            font-size: 16px; /* Prevent zoom on iOS input focus */
            padding: 10px !important;
        }
    }

    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    /* Custom Scrollbar for textarea */
    textarea::-webkit-scrollbar { width: 8px; }
    textarea::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); }
    textarea::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 4px; }

    /* Date Picker Style Overrides */
    .react-datepicker-wrapper {
        width: 100%;
    }
    .react-datepicker__input-container input {
        width: 100%;
        background: rgba(0,0,0,0.2) !important;
        border: 1px solid rgba(255,255,255,0.1) !important;
        border-radius: 8px;
        padding: 12px;
        color: white;
        outline: none;
        transition: border-color 0.2s;
        font-size: 1rem;
    }
    .react-datepicker__input-container input:focus {
        border-color: var(--primary) !important;
    }
    .react-datepicker {
        background: #1a1b2e !important;
        border: 1px solid rgba(255,255,255,0.1) !important;
        color: white !important;
        font-family: inherit;
    }
    .react-datepicker__header {
        background: rgba(255,255,255,0.05) !important;
        border-bottom: 1px solid rgba(255,255,255,0.1) !important;
    }
    .react-datepicker__current-month, 
    .react-datepicker__day-name, 
    .react-datepicker__day, 
    .react-datepicker__time-name {
        color: white !important;
    }
    .react-datepicker__day:hover {
        background: rgba(255,255,255,0.1) !important;
    }
    .react-datepicker__day--selected,
    .react-datepicker__day--keyboard-selected {
        background-color: var(--primary) !important;
    }
    .react-datepicker__time-container {
        border-left: 1px solid rgba(255,255,255,0.1) !important;
    }
    .react-datepicker__time-container .react-datepicker__time {
        background: #1a1b2e !important;
    }
    .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item {
        color: white !important;
    }
    .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item:hover {
        background: rgba(255,255,255,0.1) !important;
    }
    .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item--selected {
        background-color: var(--primary) !important;
    }

    /* Mobile Responsive Fixes for DatePicker */
    @media (max-width: 480px) {
        .react-datepicker {
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
        }
        .react-datepicker__time-container {
            width: 100% !important;
            border-left: none !important;
            border-top: 1px solid rgba(255,255,255,0.1) !important;
        }
        .react-datepicker__time-box {
            width: 100% !important;
        }
        .react-datepicker__navigation--next--with-time:not(.react-datepicker__navigation--next--with-today-button) {
            right: 0 !important;
        }
    }

    /* Fix for overlapping issues */
    .react-datepicker-popper {
        z-index: 99 !important;
    }
`}</style>
            </div>
        </div>
    );
};

export default StudentLeave;
