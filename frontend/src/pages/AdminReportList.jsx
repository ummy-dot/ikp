import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { 
    FileText, 
    Eye, 
    Download, 
    Filter,
    Search,
    ChevronDown,
    MapPin,
    AlertCircle,
    RotateCcw,
    Calendar
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminReportList = () => {
    const [searchParams] = useSearchParams();
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        grading: searchParams.get('grading') || '',
        status: searchParams.get('status') || '',
        date_from: searchParams.get('date_from') || '',
        date_to: searchParams.get('date_to') || '',
    });

    useEffect(() => {
        // Update filters if searchParams change (sidebar navigation)
        setFilters({
            grading: searchParams.get('grading') || '',
            status: searchParams.get('status') || '',
            date_from: searchParams.get('date_from') || '',
            date_to: searchParams.get('date_to') || '',
        });
    }, [searchParams]);

    useEffect(() => {
        fetchIncidents();
    }, [filters]);

    const fetchIncidents = () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (filters.grading) params.append('grading', filters.grading);
        if (filters.status) params.append('status', filters.status);
        if (filters.date_from) params.append('date_from', filters.date_from);
        if (filters.date_to) params.append('date_to', filters.date_to);
        
        api.get(`/api/admin/laporan?${params.toString()}`)
            .then(res => {
                if (res.data.success) {
                    setIncidents(res.data.data || []);
                }
            })
            .catch(err => {
                console.error(err);
                setIncidents([]);
            })
            .finally(() => setLoading(false));
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const resetFilters = () => {
        setFilters({
            grading: '',
            status: '',
            date_from: '',
            date_to: '',
        });
        setSearchTerm('');
    };

    const downloadCSV = () => {
        try {
            if (filteredIncidents.length === 0) return alert('Tidak ada data untuk diekspor');

            const headers = [
                'No. RM', 'Nama Pasien', 'Tanggal Lahir', 'Kelompok Umur', 'Jenis Kelamin',
                'Ruangan', 'Penanggung Biaya', 'Tanggal Masuk', 'Alamat',
                'Tanggal Insiden', 'Waktu Insiden', 'Judul Insiden', 'Kronologis',
                'Jenis Insiden',
                'Orang Pertama Melapor', 'Insiden Terjadi Pada', 'Detail Terjadi Pada',
                'Menyangkut Pasien', 'Detail Menyangkut',
                'Tempat Insiden', 'Unit / Departemen', 'Spesialisasi', 'Detail Spesialisasi',
                'Akibat Insiden', 'Tindakan Oleh', 'Detail Tindakan Oleh', 'Tindakan Segera',
                'Pernah Terjadi di Unit Lain', 'Detail Kejadian Serupa',
                'Grading Risiko', 'Status Laporan', 'ID Laporan', 'Tanggal Dibuat'
            ];

            const f = (val) => {
                if (val === null || val === undefined) return '""';
                return `"${String(val).replace(/"/g, '""')}"`;
            };

            const rows = filteredIncidents.map(inc => [
                f(inc.patient_no_rm), f(inc.patient_nama),
                f(inc.patient_tgl_lahir ? new Date(inc.patient_tgl_lahir).toLocaleDateString('id-ID') : '-'),
                f(inc.patient_kelompok_umur), f(inc.patient_jk),
                f(inc.patient_ruangan), f(inc.patient_penanggung_biaya),
                f(inc.patient_tanggal_masuk ? new Date(inc.patient_tanggal_masuk).toLocaleDateString('id-ID') : '-'),
                f(inc.patient_alamat),
                f(inc.tanggal_insiden ? new Date(inc.tanggal_insiden).toLocaleDateString('id-ID') : '-'),
                f(inc.waktu_insiden), f(inc.insiden), f(inc.kronologis),
                f(inc.jenis_insiden),
                f(inc.pelapor_pertama), f(inc.insiden_terjadi_pada), f(inc.insiden_terjadi_lainnya),
                f(inc.menyangkut_pasien), f(inc.menyangkut_lainnya),
                f(inc.tempat_insiden), f(inc.unit_terkait),
                f(inc.spesialisasi), f(inc.spesialisasi_lainnya),
                f(inc.akibat_insiden), f(inc.tindakan_oleh), f(inc.tindakan_lainnya), f(inc.tindakan_segera),
                f(String(inc.kejadian_serupa || '').toUpperCase()), f(inc.detail_serupa),
                f(inc.grading_risiko), f(inc.status),
                f(inc.id), f(inc.created_at ? new Date(inc.created_at).toLocaleString('id-ID') : '-')
            ]);

            const BOM = '\uFEFF'; 
            const csvContent = BOM + [headers.map(h => `"${h}"`).join(','), ...rows.map(r => r.join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `Laporan_IKP_${new Date().toISOString().slice(0, 10)}.csv`);
            link.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('CSV Error:', err);
            alert('Error CSV: ' + err.message);
        }
    };

    const downloadPDF = () => {
        try {
            if (filteredIncidents.length === 0) return alert('Tidak ada data untuk diekspor');

            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

            // Header
            doc.setFontSize(14);
            doc.setTextColor(30, 41, 59);
            doc.text('REKAPITULASI LAPORAN INSIDEN KESELAMATAN PASIEN (IKP)', 14, 14);
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}  |  Total: ${filteredIncidents.length} Laporan`, 14, 21);

            // 6 columns: Pasien | Rincian | Jenis+Pelapor | Lokasi+Akibat | Serupa+Tindakan | Grading
            const cols = [
                'DATA PASIEN',
                'BAGIAN 1\nRINCIAN KEJADIAN',
                'BAGIAN 2 & 3\nJENIS & PELAPOR',
                'BAGIAN 4 & 5\nLOKASI & AKIBAT',
                'BAGIAN 5 & 6\nTINDAKAN & SERUPA',
                'BAGIAN 7\nGRADING & STATUS'
            ];

            const rows = filteredIncidents.map(inc => [
                // Col 1: Data Pasien
                `${inc.patient_nama || '-'}\n` +
                `RM: ${inc.patient_no_rm || '-'}\n` +
                `${inc.patient_jk || '-'} | ${inc.patient_kelompok_umur || '-'}\n` +
                `Tgl Lahir: ${inc.patient_tgl_lahir ? new Date(inc.patient_tgl_lahir).toLocaleDateString('id-ID') : '-'}\n` +
                `Ruang: ${inc.patient_ruangan || '-'}\n` +
                `Biaya: ${inc.patient_penanggung_biaya || '-'}\n` +
                `Masuk: ${inc.patient_tanggal_masuk ? new Date(inc.patient_tanggal_masuk).toLocaleDateString('id-ID') : '-'}\n` +
                `Alamat: ${inc.patient_alamat || '-'}`,

                // Col 2: Bagian 1
                `Tgl: ${inc.tanggal_insiden ? new Date(inc.tanggal_insiden).toLocaleDateString('id-ID') : '-'}\n` +
                `Wkt: ${inc.waktu_insiden || '-'}\n\n` +
                `Insiden:\n${inc.insiden || '-'}\n\n` +
                `Kronologis:\n${inc.kronologis || '-'}`,

                // Col 3: Bagian 2 & 3
                `Jenis: ${inc.jenis_insiden || '-'}\n\n` +
                `Pelapor 1: ${inc.pelapor_pertama || '-'}\n\n` +
                `Terjadi Pada: ${inc.insiden_terjadi_pada || '-'}${inc.insiden_terjadi_lainnya ? ' (' + inc.insiden_terjadi_lainnya + ')' : ''}\n\n` +
                `Menyangkut: ${inc.menyangkut_pasien || '-'}${inc.menyangkut_lainnya ? ' (' + inc.menyangkut_lainnya + ')' : ''}`,

                // Col 4: Bagian 4 & 5 (akibat)
                `Lokasi: ${inc.tempat_insiden || '-'}\n` +
                `Unit: ${inc.unit_terkait || '-'}\n` +
                `Spesialisasi: ${inc.spesialisasi || '-'}${inc.spesialisasi_lainnya ? ' (' + inc.spesialisasi_lainnya + ')' : ''}\n\n` +
                `Akibat:\n${inc.akibat_insiden || '-'}`,

                // Col 5: Bagian 5 (tindakan) & 6
                `Tindakan Oleh: ${inc.tindakan_oleh || '-'}${inc.tindakan_lainnya ? ' (' + inc.tindakan_lainnya + ')' : ''}\n\n` +
                `Tindakan Segera:\n${inc.tindakan_segera || '-'}\n\n` +
                `Pernah di Unit Lain: ${String(inc.kejadian_serupa || '').toUpperCase()}\n` +
                `Detail: ${inc.detail_serupa || '-'}`,

                // Col 6: Bagian 7
                `ID: #${inc.id}\n` +
                `Tgl Lapor:\n${inc.created_at ? new Date(inc.created_at).toLocaleDateString('id-ID') : '-'}\n\n` +
                `GRADING:\n${String(inc.grading_risiko || '-').toUpperCase()}\n\n` +
                `Status:\n${String(inc.status || '-').toUpperCase()}`
            ]);

            autoTable(doc, {
                head: [cols],
                body: rows,
                startY: 26,
                theme: 'grid',
                headStyles: {
                    fillColor: [30, 41, 59],
                    textColor: 255,
                    fontSize: 7,
                    fontStyle: 'bold',
                    halign: 'center',
                    valign: 'middle',
                    cellPadding: 3
                },
                styles: {
                    fontSize: 6.5,
                    cellPadding: 3,
                    valign: 'top',
                    overflow: 'linebreak',
                    lineColor: [226, 232, 240],
                    lineWidth: 0.3
                },
                columnStyles: {
                    0: { cellWidth: 38 },  // Pasien
                    1: { cellWidth: 48 },  // Rincian
                    2: { cellWidth: 42 },  // Jenis+Pelapor
                    3: { cellWidth: 42 },  // Lokasi+Akibat
                    4: { cellWidth: 48 },  // Tindakan+Serupa
                    5: { cellWidth: 30 }   // Grading
                },
                didParseCell: (data) => {
                    if (data.section === 'body' && data.column.index === 5) {
                        try {
                            const grading = String(filteredIncidents[data.row.index]?.grading_risiko || '').toLowerCase();
                            if (grading === 'merah')  data.cell.styles.fillColor = [254, 226, 226];
                            if (grading === 'kuning') data.cell.styles.fillColor = [254, 249, 195];
                            if (grading === 'hijau')  data.cell.styles.fillColor = [220, 252, 231];
                            if (grading === 'biru')   data.cell.styles.fillColor = [219, 234, 254];
                            data.cell.styles.fontStyle = 'bold';
                            data.cell.styles.halign = 'center';
                        } catch (e) {
                            // ignore grading error
                        }
                    }
                    if (data.section === 'head') {
                        data.cell.styles.fillColor = [30, 41, 59];
                    }
                }
            });

            doc.save(`Laporan_IKP_${new Date().toISOString().slice(0, 10)}.pdf`);
        } catch (err) {
            console.error('PDF Export error:', err);
            alert('Error PDF: ' + err.message);
        }
    };

    const getStatusStyle = (status) => {
        switch(status?.toLowerCase()) {
            case 'pending': return { bg: '#fff1f2', text: '#e11d48' };
            case 'reviewed': return { bg: '#f0fdf4', text: '#16a34a' };
            default: return { bg: '#f1f5f9', text: '#64748b' };
        }
    };

    const getGradingStyle = (grading) => {
        switch(grading?.toLowerCase()) {
            case 'merah': return '#ef4444';
            case 'kuning': return '#f59e0b';
            case 'hijau': return '#10b981';
            case 'biru': return '#3b82f6';
            default: return '#64748b';
        }
    };

    const filteredIncidents = incidents.filter(inc => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            (inc.insiden || '').toLowerCase().includes(search) ||
            (inc.unit_terkait || '').toLowerCase().includes(search) ||
            (inc.pelapor_name || inc.pelapor_pertama || '').toLowerCase().includes(search)
        );
    });

    return (
        <div style={{ padding: '2rem', minHeight: '100vh', background: 'var(--bg-main)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', marginBottom: '0.5rem' }}>Daftar Laporan Pelapor</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manajemen seluruh laporan insiden dari seluruh unit.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn" style={{ background: '#f1f5f9' }} onClick={downloadCSV}>
                        <Download size={18} style={{ marginRight: '0.5rem' }} />
                        Export CSV
                    </button>
                    <button className="btn btn-primary" onClick={downloadPDF}>
                        <FileText size={18} style={{ marginRight: '0.5rem' }} />
                        Export PDF
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                        className="input-control" 
                        placeholder="Cari insiden, unit, atau pelapor..." 
                        style={{ paddingLeft: '2.75rem' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select name="grading" value={filters.grading} onChange={handleFilterChange} className="input-control" style={{ width: '200px' }}>
                    <option value="">Semua Grading</option>
                    <option value="Biru">Biru</option>
                    <option value="Hijau">Hijau</option>
                    <option value="Kuning">Kuning</option>
                    <option value="Merah">Merah</option>
                </select>
                <select name="status" value={filters.status} onChange={handleFilterChange} className="input-control" style={{ width: '160px' }}>
                    <option value="">Semua Status</option>
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                </select>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0 0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                    <Calendar size={16} color="var(--text-muted)" />
                    <input 
                        type="date" 
                        name="date_from" 
                        value={filters.date_from} 
                        onChange={handleFilterChange} 
                        className="input-control" 
                        style={{ border: 'none', padding: '0.5rem 0', width: '130px', fontSize: '0.875rem' }} 
                    />
                    <span style={{ color: 'var(--text-muted)' }}>-</span>
                    <input 
                        type="date" 
                        name="date_to" 
                        value={filters.date_to} 
                        onChange={handleFilterChange} 
                        className="input-control" 
                        style={{ border: 'none', padding: '0.5rem 0', width: '130px', fontSize: '0.875rem' }} 
                    />
                </div>

                <button className="btn" style={{ background: '#f1f5f9', color: 'var(--text-muted)', padding: '0.5rem' }} onClick={resetFilters} title="Reset Filter">
                    <RotateCcw size={18} />
                </button>
            </div>

            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>DATA KEJADIAN</th>
                            <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>PASIEN</th>
                            <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>INSIDEN & PELAPOR</th>
                            <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>GRADING</th>
                            <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>STATUS</th>
                            <th style={{ textAlign: 'right', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>AKSI</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '5rem' }}>Memuat data...</td></tr>
                        ) : filteredIncidents.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>Tidak ada laporan.</td></tr>
                        ) : (
                            filteredIncidents.map(inc => (
                                <tr key={inc.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{new Date(inc.tanggal_insiden).toLocaleDateString('id-ID')}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <MapPin size={12} /> {inc.unit_terkait}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{inc.patient_nama || '-'}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>RM: {inc.patient_no_rm || '-'}</div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{inc.insiden}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Oleh: {inc.pelapor_name || inc.pelapor_pertama}</div>
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
                                        <Link to={`/admin/laporan/${inc.id}`} className="btn" style={{ padding: '0.4rem', background: '#f1f5f9', color: 'var(--text-muted)' }}>
                                            <Eye size={16} />
                                        </Link>
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

export default AdminReportList;
