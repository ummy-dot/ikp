import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Activity, Lock, User, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        password: '',
        password_confirm: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        if (formData.password !== formData.password_confirm) {
            return setError('Konfirmasi password tidak cocok.');
        }

        setLoading(true);
        try {
            const res = await api.post('/api/auth/register', formData);
            if (res.data.success) {
                setSuccess('Registrasi berhasil! Mengalihkan ke halaman login...');
                setTimeout(() => navigate('/login'), 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registrasi gagal. Coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="sidebar-logo" style={{ justifyContent: 'center', marginBottom: '2rem' }}>
                    <Activity size={32} />
                    <span>IKP SYSTEM</span>
                </div>
                
                <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Daftar Akun</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    Lengkapi data diri Anda
                </p>

                {error && (
                    <div style={{ 
                        background: '#fef2f2', 
                        color: '#b91c1c', 
                        padding: '1rem', 
                        borderRadius: '8px', 
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        fontSize: '0.875rem',
                        border: '1px solid #fee2e2'
                    }}>
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {success && (
                    <div style={{ 
                        background: '#f0fdf4', 
                        color: '#15803d', 
                        padding: '1rem', 
                        borderRadius: '8px', 
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        fontSize: '0.875rem',
                        border: '1px solid #dcfce7'
                    }}>
                        <CheckCircle size={18} />
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Nama Lengkap</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                <UserPlus size={18} />
                            </span>
                            <input 
                                type="text" 
                                name="name"
                                className="input-control" 
                                style={{ paddingLeft: '3rem' }}
                                placeholder="Masukkan nama"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Username</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                <User size={18} />
                            </span>
                            <input 
                                type="text" 
                                name="username"
                                className="input-control" 
                                style={{ paddingLeft: '3rem' }}
                                placeholder="Pilih username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                <Lock size={18} />
                            </span>
                            <input 
                                type="password" 
                                name="password"
                                className="input-control" 
                                style={{ paddingLeft: '3rem' }}
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Konfirmasi Password</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                <Lock size={18} />
                            </span>
                            <input 
                                type="password" 
                                name="password_confirm"
                                className="input-control" 
                                style={{ paddingLeft: '3rem' }}
                                placeholder="••••••••"
                                value={formData.password_confirm}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="btn btn-primary" 
                        style={{ width: '100%', marginTop: '1rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Sudah punya akun? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Masuk di sini</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
