import { LayoutDashboard, CalendarClock, History, User, AlertTriangle, Bell, Users, CreditCard } from 'lucide-react';

export const navItems = [
    { label: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Leave', path: '/leave', icon: CalendarClock },
    { label: 'Complaints', path: '/complaint', icon: AlertTriangle },
    { label: 'History', path: '/history', icon: History },
    { label: 'Profile', path: '/profile', icon: User },
];

export const desktopNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Apply Leave', path: '/leave', icon: CalendarClock },
    { label: 'Complaints', path: '/complaint', icon: AlertTriangle },
    { label: 'Announcements', path: '/announcement', icon: Bell },
    { label: 'Roomies', path: '/roomies', icon: Users },
    { label: 'History', path: '/history', icon: History },
    { label: 'Fees & Cost', path: '/fees-cost', icon: CreditCard },
];
