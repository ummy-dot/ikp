import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { 
    FileText, 
    AlertTriangle, 
    CheckCircle2, 
    TrendingUp,
    ShieldAlert,
    PieChart as PieIcon
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip as ChartTooltip, 
  Legend as ChartLegend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  ArcElement, 
  ChartTooltip, 
  ChartLegend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const DashboardAdmin = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/admin/dashboard')
            .then(res => {
                if (res.data.success) {
                    setStats(res.data.data);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>Loading dashboard...</div>;

    // Data for Grading Pie Chart
    const getGradingColor = (label) => {
        const l = label?.toLowerCase();
        if (l === 'biru') return '#3b82f6';
        if (l === 'hijau') return '#10b981';
        if (l === 'kuning') return '#f59e0b';
        if (l === 'merah') return '#ef4444';
        return '#64748b';
    };

    const gradingData = {
        labels: stats?.byGrading?.map(g => g.grading_risiko.toUpperCase()) || [],
        datasets: [
            {
                data: stats?.byGrading?.map(g => g.count) || [],
                backgroundColor: stats?.byGrading?.map(g => getGradingColor(g.grading_risiko)) || [],
                borderWidth: 0,
            },
        ],
    };

    // Data for Monthly Bar Chart
    const monthlyData = {
        labels: stats?.byMonth?.map(m => m.bulan) || [],
        datasets: [
            {
                label: 'Total Insiden',
                data: stats?.byMonth?.map(m => m.count) || [],
                backgroundColor: 'rgba(37, 99, 235, 0.8)',
                borderRadius: 4,
            },
        ],
    };

    return (
        <div>
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Overview Admin</h1>
                <p style={{ color: 'var(--text-muted)' }}>Monitoring seluruh laporan insiden keselamatan pasien.</p>
            </div>

            <div className="stats-grid">
                <Link to="/admin/laporan" className="stat-card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                            <p className="stat-label">TOTAL INSIDEN</p>
                            <p className="stat-value">{stats?.total || 0}</p>
                        </div>
                        <div style={{ padding: '0.75rem', background: '#eff6ff', borderRadius: '10px', color: 'var(--primary)' }}>
                            <FileText size={24} />
                        </div>
                    </div>
                </Link>

                <Link to="/admin/laporan?status=pending" className="stat-card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                            <p className="stat-label">BELUM DIREVIEW</p>
                            <p className="stat-value">{stats?.pending || 0}</p>
                        </div>
                        <div style={{ padding: '0.75rem', background: '#fff1f2', borderRadius: '10px', color: '#e11d48' }}>
                            <AlertTriangle size={24} />
                        </div>
                    </div>
                </Link>

                <Link to="/admin/laporan?status=reviewed" className="stat-card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                            <p className="stat-label">TELAH DIREVIEW</p>
                            <p className="stat-value">{stats?.reviewed || 0}</p>
                        </div>
                        <div style={{ padding: '0.75rem', background: '#f0fdf4', borderRadius: '10px', color: '#16a34a' }}>
                            <CheckCircle2 size={24} />
                        </div>
                    </div>
                </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
                <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                        <TrendingUp size={20} color="var(--primary)" />
                        <h3 style={{ fontSize: '1.125rem' }}>Tren Insiden (12 Bulan Terakhir)</h3>
                    </div>
                    <div style={{ height: '350px' }}>
                        <Bar data={monthlyData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>

                <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
                        <ShieldAlert size={20} color="#ea580c" />
                        <h3 style={{ fontSize: '1.125rem' }}>Grading Risiko</h3>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '250px' }}>
                            <Pie data={gradingData} />
                        </div>
                    </div>
                    <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {stats?.byGrading?.map((g, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                                <div style={{ 
                                    width: '10px', 
                                    height: '10px', 
                                    borderRadius: '50%', 
                                    background: gradingData.datasets[0].backgroundColor[i] 
                                }}></div>
                                <span style={{ fontWeight: 600 }}>{g.count}</span>
                                <span style={{ color: 'var(--text-muted)' }}>{g.grading_risiko.toUpperCase()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardAdmin;
