import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
    FileText, 
    Clock, 
    PlusCircle, 
    ArrowRight,
    TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const DashboardUser = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/user/dashboard')
            .then(res => {
                if (res.data.success) {
                    setStats(res.data.data);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>Loading dashboard...</div>;

    const chartData = {
        labels: stats?.chartData?.labels || [],
        datasets: [
            {
                label: 'Jumlah Laporan',
                data: stats?.chartData?.data || [],
                fill: true,
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderColor: 'rgba(37, 99, 235, 1)',
                tension: 0.4,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                }
            }
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Ringkasan Anda</h1>
                <p style={{ color: 'var(--text-muted)' }}>Pantau aktivitas pelaporan insiden Anda di sini.</p>
            </div>

            <div className="stats-grid">
                <Link to="/user/riwayat" className="stat-card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                            <p className="stat-label">TOTAL LAPORAN</p>
                            <p className="stat-value">{stats?.totalReports || 0}</p>
                        </div>
                        <div style={{ padding: '0.75rem', background: '#eff6ff', borderRadius: '10px', color: 'var(--primary)' }}>
                            <FileText size={24} />
                        </div>
                    </div>
                </Link>

                <div className="stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                            <p className="stat-label">TERAKHIR LAPOR</p>
                            <p className="stat-value" style={{ fontSize: '1.25rem', paddingTop: '0.5rem' }}>
                                {stats?.lastReport ? new Date(stats.lastReport).toLocaleDateString('id-ID') : '-'}
                            </p>
                        </div>
                        <div style={{ padding: '0.75rem', background: '#fff7ed', borderRadius: '10px', color: '#ea580c' }}>
                            <Clock size={24} />
                        </div>
                    </div>
                </div>

                <div className="stat-card" style={{ background: 'var(--primary)', color: 'white', border: 'none' }}>
                    <p className="stat-label" style={{ color: 'rgba(255,255,255,0.8)' }}>TINDAKAN CEPAT</p>
                    <Link to="/user/laporan/baru" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.125rem' }}>
                        <PlusCircle size={24} />
                        Buat Laporan Baru
                    </Link>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                        <TrendingUp size={20} color="var(--primary)" />
                        <h3 style={{ fontSize: '1.125rem' }}>Tren Laporan Bulanan</h3>
                    </div>
                    <div style={{ height: '300px' }}>
                        <Line data={chartData} options={chartOptions} />
                    </div>
                </div>

                <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
                    <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>Aktivitas Terbaru</h3>
                    {/* Simplified recent items list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 1rem' }}>
                           Segera hadir: daftar ringkasan laporan terbaru Anda.
                        </p>
                        <Link to="/user/riwayat" className="btn btn-outline" style={{ border: '1px solid var(--border)', fontSize: '0.875rem' }}>
                            Lihat Semua Riwayat
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardUser;
