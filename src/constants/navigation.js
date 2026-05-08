import { Home, User, FileText, Clock, Shield, AlertCircle, Users, Activity, Megaphone, IndianRupee } from 'lucide-react';

export const NAV_ITEMS = [
    { label: "Home", path: "/dashboard", icon: Home },
    { label: "Announcements", path: "/announcement", icon: Megaphone },
    { label: "Leave", path: "/leave", icon: FileText },
    { label: "Last Request", path: "/last-request", icon: Activity },
    { label: "History", path: "/history", icon: Clock },
    { label: "Complaint", path: "/complaint", icon: AlertCircle },
    { label: "Roomies", path: "/roomies", icon: Users },
    { label: "Incharge", path: "/incharge", icon: Shield },
    { label: "Fees Cost", path: "/fees-cost", icon: IndianRupee },
    { label: "Profile", path: "/profile", icon: User },
];

export const NAV_CATEGORIES = [
    {
        title: "Overview",
        items: [
            { label: "Home", path: "/dashboard", icon: Home },
            { label: "Announcements", path: "/announcement", icon: Megaphone },
        ]
    },
    {
        title: "Services",
        items: [
            { label: "Leave", path: "/leave", icon: FileText },
            { label: "Last Request", path: "/last-request", icon: Activity },
            { label: "History", path: "/history", icon: Clock },
            { label: "Complaint", path: "/complaint", icon: AlertCircle },
        ]
    },
    {
        title: "Community",
        items: [
            { label: "Roomies", path: "/roomies", icon: Users },
            { label: "Incharge", path: "/incharge", icon: Shield },
        ]
    },
    {
        title: "Financials",
        items: [
            { label: "Fees Cost", path: "/fees-cost", icon: IndianRupee },
        ]
    },
    {
        title: "Account",
        items: [
            { label: "Profile", path: "/profile", icon: User },
        ]
    }
];
