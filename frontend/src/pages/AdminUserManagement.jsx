import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
    Users, 
    Shield, 
    User, 
    Mail, 
    Calendar,
    ArrowRightLeft,
    Check
} from 'lucide-react';

const AdminUserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updateLoading, setUpdateLoading] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = () => {
        setLoading(true);
        api.get('/api/admin/users')
            .then(res => {
                if (res.data.success) {
                    setUsers(res.data.data);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    const handleRoleChange = async (userId, newRole) => {
        setUpdateLoading(userId);
        try {
            const res = await api.post(`/api/admin/users/${userId}/role`, { role: newRole });
            if (res.data.success) {
                setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setUpdateLoading(null);
        }
    };

    if (loading) return <div style={{ padding: '5rem', textAlign: 'center' }}>Memuat data user...</div>;

    return (
        <div>
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Manajemen User</h1>
                <p style={{ color: 'var(--text-muted)' }}>Atur hak akses dan role pengguna dalam sistem IKP.</p>
            </div>

            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>NAMA & EMAIL</th>
                            <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>USERNAME</th>
                            <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>ROLE</th>
                            <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>TGL DAFTAR</th>
                            <th style={{ textAlign: 'right', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>UBAH ROLE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{u.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Mail size={12} /> {u.email || '-'}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                                        <User size={14} color="var(--text-muted)" />
                                        {u.username}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                    <div style={{ 
                                        display: 'inline-flex', 
                                        padding: '0.25rem 0.75rem', 
                                        borderRadius: '6px', 
                                        fontSize: '0.75rem', 
                                        fontWeight: 700,
                                        background: u.role === 'admin' ? '#eff6ff' : '#f1f5f9',
                                        color: u.role === 'admin' ? 'var(--primary)' : 'var(--text-muted)'
                                    }}>
                                        {u.role.toUpperCase()}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                    <div style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Calendar size={14} color="var(--text-muted)" />
                                        {new Date(u.created_at).toLocaleDateString('id-ID')}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <button 
                                            className="btn" 
                                            style={{ 
                                                padding: '0.4rem 0.75rem', 
                                                fontSize: '0.75rem',
                                                background: u.role === 'user' ? '#eff6ff' : '#f1f5f9',
                                                color: u.role === 'user' ? 'var(--primary)' : 'var(--text-muted)',
                                                opacity: updateLoading === u.id ? 0.5 : 1
                                            }}
                                            disabled={updateLoading === u.id}
                                            onClick={() => handleRoleChange(u.id, u.role === 'admin' ? 'user' : 'admin')}
                                        >
                                            <ArrowRightLeft size={14} style={{ marginRight: '0.4rem' }} />
                                            Jadikan {u.role === 'admin' ? 'User' : 'Admin'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminUserManagement;
