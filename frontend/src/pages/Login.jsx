import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Activity, Lock, User, AlertCircle } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            const res = await api.post('/api/auth/login', { username, password });
            if (res.data.success) {
                login(res.data.token, res.data.user);
                navigate(res.data.user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login gagal. Periksa koneksi Anda.');
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
                
                <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Selamat Datang</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    Silakan masuk ke akun Anda
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

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Username</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                <User size={18} />
                            </span>
                            <input 
                                type="text" 
                                className="input-control" 
                                style={{ paddingLeft: '3rem' }}
                                placeholder="Masukkan username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
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
                                className="input-control" 
                                style={{ paddingLeft: '3rem' }}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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
                        {loading ? 'Memproses...' : 'Masuk'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Belum punya akun? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Daftar sekarang</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
