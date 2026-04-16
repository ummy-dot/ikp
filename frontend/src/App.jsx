import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardUser from './pages/DashboardUser';
import DashboardAdmin from './pages/DashboardAdmin';
import IncidentForm from './pages/IncidentForm';
import UserHistory from './pages/UserHistory';
import AdminReportList from './pages/AdminReportList';
import AdminUserManagement from './pages/AdminUserManagement';

// Components
import Layout from './components/Layout';

// Helper for protected routes
const ProtectedRoute = ({ children, role }) => {
    const { user, loading } = useAuth();
    
    if (loading) return <div style={{ padding: '5rem', textAlign: 'center' }}>Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    
    if (role && user.role !== role) {
        return <Navigate to={user.role === 'admin' ? "/admin/dashboard" : "/user/dashboard"} />;
    }
    
    return <Layout>{children}</Layout>;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    
                    {/* User Routes */}
                    <Route path="/user/dashboard" element={
                        <ProtectedRoute role="user">
                            <DashboardUser />
                        </ProtectedRoute>
                    } />
                    <Route path="/user/laporan/baru" element={
                        <ProtectedRoute role="user">
                            <IncidentForm />
                        </ProtectedRoute>
                    } />
                    <Route path="/user/form/:id" element={
                        <ProtectedRoute role="user">
                            <IncidentForm />
                        </ProtectedRoute>
                    } />
                    <Route path="/user/form/:id/detail" element={
                        <ProtectedRoute role="user">
                            <IncidentForm isDetail={true} />
                        </ProtectedRoute>
                    } />
                    <Route path="/user/riwayat" element={
                        <ProtectedRoute role="user">
                            <UserHistory />
                        </ProtectedRoute>
                    } />

                    {/* Admin Routes */}
                    <Route path="/admin/dashboard" element={
                        <ProtectedRoute role="admin">
                            <DashboardAdmin />
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/laporan" element={
                        <ProtectedRoute role="admin">
                            <AdminReportList />
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/laporan/:id" element={
                        <ProtectedRoute role="admin">
                            <IncidentForm isDetail={true} />
                        </ProtectedRoute>
                    } />
                    <Route path="/admin/users" element={
                        <ProtectedRoute role="admin">
                            <AdminUserManagement />
                        </ProtectedRoute>
                    } />

                    {/* Default Redirect */}
                    <Route path="/" element={<Navigate to="/login" />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
