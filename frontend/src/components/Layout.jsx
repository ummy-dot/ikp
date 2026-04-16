import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    Activity, 
    LayoutDashboard, 
    FileText, 
    PlusCircle, 
    Users, 
    LogOut,
    Menu
} from 'lucide-react';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isAdmin = user?.role === 'admin';

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <Activity size={28} />
                    <span>IKP SYSTEM</span>
                </div>

                <nav style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.75rem', paddingLeft: '1rem' }}>MENU UTAMA</p>
                    
                    <NavLink to={isAdmin ? "/admin/dashboard" : "/user/dashboard"} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <LayoutDashboard size={20} />
                        Dashboard
                    </NavLink>

                    {!isAdmin && (
                        <>
                            <NavLink to="/user/laporan/baru" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <PlusCircle size={20} />
                                Lapor Insiden
                            </NavLink>
                            <NavLink to="/user/riwayat" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <FileText size={20} />
                                Riwayat Saya
                            </NavLink>
                        </>
                    )}

                    {isAdmin && (
                        <>
                            <NavLink to="/admin/laporan" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <FileText size={20} />
                                Semua Laporan
                            </NavLink>
                            <NavLink to="/admin/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <Users size={20} />
                                Manajemen User
                            </NavLink>
                        </>
                    )}
                </nav>

                <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingLeft: '0.5rem' }}>
                        <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <p style={{ fontWeight: 700, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="nav-link" style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                        <LogOut size={20} />
                        Keluar
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <button className="btn" style={{ padding: '0.5rem', background: '#f1f5f9', display: 'none' }}>
                        <Menu size={24} />
                    </button>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    </div>
                </header>
                {children}
            </main>
        </div>
    );
};

export default Layout;
