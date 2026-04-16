import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
    FileText, 
    Edit, 
    Eye, 
    MoreVertical, 
    CheckCircle, 
    Clock,
    Search,
    PlusCircle
} from 'lucide-react';

const UserHistory = () => {
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        api.get('/api/user/incidents')
            .then(res => {
                if (res.data.success) {
                    setIncidents(res.data.data);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const filteredIncidents = incidents.filter(i => 
        i.insiden?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.unit_terkait?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusStyle = (status) => {
        const s = status?.toLowerCase() || '';
        switch(s) {
            case 'pending': return { bg: '#fff1f2', text: '#e11d48' };
            case 'reviewed': return { bg: '#f0fdf4', text: '#16a34a' };
            default: return { bg: '#f1f5f9', text: '#64748b' };
        }
    };

    const getGradingStyle = (grading) => {
        const g = grading?.toLowerCase() || '';
        switch(g) {
            case 'merah': return '#ef4444';
            case 'kuning': return '#f59e0b';
            case 'hijau': return '#10b981';
            case 'biru': return '#3b82f6';
            default: return '#64748b';
        }
    };

    if (loading) return <div style={{ padding: '5rem', textAlign: 'center' }}>Memuat riwayat...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Riwayat Laporan</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Daftar seluruh insiden yang telah Anda laporkan.</p>
                </div>
                <Link to="/user/laporan/baru" className="btn btn-primary">
                    <PlusCircle size={18} style={{ marginRight: '0.5rem' }} />
                    Lapor Baru
                </Link>
            </div>

            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
                <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input 
                            type="text" 
                            className="input-control" 
                            placeholder="Cari insiden atau unit..." 
                            style={{ paddingLeft: '2.75rem' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>DATA KEJADIAN</th>
                            <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>INSIDEN</th>
                            <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>GRADING</th>
                            <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>STATUS</th>
                            <th style={{ textAlign: 'right', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>AKSI</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredIncidents.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                                    Belum ada laporan yang ditemukan.
                                </td>
                            </tr>
                        ) : (
                            filteredIncidents.map(inc => (
                                <tr key={inc.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#fcfdfe'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{new Date(inc.tanggal_insiden).toLocaleDateString('id-ID')}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Clock size={12} /> {inc.waktu_insiden}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{inc.insiden}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inc.unit_terkait}</div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ 
                                            display: 'inline-flex', 
                                            alignItems: 'center', 
                                            gap: '0.5rem', 
                                            fontSize: '0.75rem', 
                                            fontWeight: 700,
                                            color: getGradingStyle(inc.grading_risiko)
                                        }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getGradingStyle(inc.grading_risiko) }}></div>
                                            {(inc.grading_risiko || '').toUpperCase()}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ 
                                            display: 'inline-block', 
                                            padding: '0.25rem 0.75rem', 
                                            borderRadius: '20px', 
                                            fontSize: '0.6875rem', 
                                            fontWeight: 800,
                                            background: getStatusStyle(inc.status).bg,
                                            color: getStatusStyle(inc.status).text,
                                            textTransform: 'uppercase'
                                        }}>
                                            {inc.status}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            {!inc.is_final ? (
                                                <Link to={`/user/form/${inc.id}`} className="btn" style={{ padding: '0.4rem', background: '#eff6ff', color: 'var(--primary)' }}>
                                                    <Edit size={16} />
                                                </Link>
                                            ) : (
                                                <Link to={`/user/form/${inc.id}/detail`} className="btn" style={{ padding: '0.4rem', background: '#f1f5f9', color: 'var(--text-muted)' }}>
                                                    <Eye size={16} />
                                                </Link>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserHistory;
