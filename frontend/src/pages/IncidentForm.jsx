import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import SignatureCanvas from 'react-signature-canvas';
import { useAuth } from '../context/AuthContext';
import { 
    Search, 
    User, 
    Calendar, 
    Clock, 
    MapPin, 
    Stethoscope, 
    AlertCircle, 
    ChevronRight, 
    ChevronLeft,
    Save,
    Send,
    Trash2,
    Upload,
    ArrowLeft,
    Printer,
    File
} from 'lucide-react';

const IncidentForm = ({ isDetail = false }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const sigPad = useRef(null);
    const { user: authUser } = useAuth();
    
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [patientFound, setPatientFound] = useState(false);
    const [error, setError] = useState('');
    const [file, setFile] = useState(null);

    const [formData, setFormData] = useState({
        patient_no_rm: '',
        patient_nama: '',
        patient_tgl_lahir: '',
        patient_kelompok_umur: '',
        patient_jk: '',
        patient_alamat: '',
        patient_ruangan: '',
        patient_penanggung_biaya: '',
        patient_tanggal_masuk: '',
        tanggal_insiden: '',
        waktu_insiden: '',
        insiden: '',
        kronologis: '',
        jenis_insiden: '',
        pelapor_pertama: '',
        insiden_terjadi_pada: '',
        insiden_terjadi_lainnya: '',
        menyangkut_pasien: '',
        menyangkut_lainnya: '',
        tempat_insiden: '',
        spesialisasi: '',
        spesialisasi_lainnya: '',
        unit_terkait: '',
        akibat_insiden: '',
        tindakan_segera: '',
        tindakan_oleh: '',
        tindakan_lainnya: '',
        kejadian_serupa: 'tidak',
        detail_serupa: '',
        grading_risiko: 'Biru',
        tanda_tangan: '',
        pelapor_name: '',
        pelapor_pertama_lainnya: ''
    });

    useEffect(() => {
        if (id) {
            setLoading(true);
            const endpoint = authUser?.role === 'admin' 
                ? `/api/admin/laporan/${id}` 
                : `/api/user/incidents/${id}`;

            api.get(endpoint)
                .then(res => {
                    if (res.data.success) {
                        const { incident, patient } = res.data.data;
                        const combinedData = { ...formData, ...incident };
                        
                        // Format dates for HTML5 input type="date"
                        if (incident && incident.tanggal_insiden) {
                            try {
                                combinedData.tanggal_insiden = new Date(incident.tanggal_insiden).toISOString().split('T')[0];
                            } catch (e) {
                                console.error('Error parsing incident date:', e);
                            }
                        }
                        
                        if (patient) {
                            combinedData.patient_no_rm = patient.no_rekam_medik;
                            combinedData.patient_nama = patient.nama_pasien;
                            if (patient.tanggal_lahir) {
                                try {
                                    combinedData.patient_tgl_lahir = new Date(patient.tanggal_lahir).toISOString().split('T')[0];
                                } catch (e) {
                                    console.error('Error parsing birth date:', e);
                                }
                            }
                            combinedData.patient_kelompok_umur = patient.kelompok_umur;
                            combinedData.patient_jk = patient.jenis_kelamin;
                            combinedData.patient_alamat = patient.alamat;
                            combinedData.patient_ruangan = patient.ruangan;
                            combinedData.patient_penanggung_biaya = patient.penanggung_biaya;
                            if (patient.tanggal_masuk) {
                                try {
                                    combinedData.patient_tanggal_masuk = new Date(patient.tanggal_masuk).toISOString().slice(0, 16);
                                } catch (e) {
                                    console.error('Error parsing admission date:', e);
                                }
                            }
                        }
                        combinedData.kejadian_serupa = (incident?.kejadian_serupa === 1 || incident?.kejadian_serupa === 'ya') ? 'ya' : 'tidak';
                        setFormData(combinedData);
                    }
                })
                .catch(err => setError('Gagal memuat data laporan. Pastikan Anda memiliki akses.'))
                .finally(() => setLoading(false));
        }
    }, [id, authUser]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLookup = async () => {
        if (!formData.patient_no_rm) return;
        setLookupLoading(true);
        setError('');
        setPatientFound(false);
        try {
            const res = await api.post('/api/user/lookup-patient', { no_rekam_medik: formData.patient_no_rm });
            if (res.data.success) {
                const p = res.data.data;
                setFormData(prev => ({
                    ...prev,
                    patient_nama: p.nama_pasien,
                    patient_tgl_lahir: p.tanggal_lahir ? p.tanggal_lahir.split('T')[0] : '',
                    patient_kelompok_umur: p.kelompok_umur,
                    patient_jk: p.jenis_kelamin === 'L' || p.jenis_kelamin === 'Laki-laki' ? 'Laki-laki' : 'Perempuan',
                    patient_alamat: p.alamat || '',
                    patient_ruangan: p.ruangan || '',
                    patient_penanggung_biaya: p.penanggung_biaya || '',
                    patient_tanggal_masuk: p.tanggal_masuk ? p.tanggal_masuk.slice(0, 16) : ''
                }));
                setPatientFound(true);
            } else {
                setError('Mohon Maaf, Data Pasien TIDAK ditemukan.');
            }
        } catch (err) {
            setError('Gagal melakukan lookup data pasien.');
        } finally {
            setLookupLoading(false);
        }
    };

    const clearSignature = () => {
        sigPad.current.clear();
        setFormData(prev => ({ ...prev, tanda_tangan: '' }));
    };

    const handleSubmit = async (type) => {
        setLoading(true);
        setError('');
        
        try {
            // Basic validation for final submission
            if (type === 'final') {
                const required = [
                    { key: 'tanggal_insiden', label: 'Tanggal Insiden' },
                    { key: 'waktu_insiden', label: 'Waktu/Jam Insiden' },
                    { key: 'insiden', label: 'Judul Insiden' },
                    { key: 'kronologis', label: 'Kronologis Kejadian' },
                    { key: 'jenis_insiden', label: 'Jenis Insiden' },
                    { key: 'tempat_insiden', label: 'Lokasi Kejadian' },
                    { key: 'unit_terkait', label: 'Unit Terkait' },
                    { key: 'akibat_insiden', label: 'Akibat Insiden' }
                ];

                const missing = required.filter(f => !formData[f.key]);
                if (missing.length > 0) {
                    setError(`Laporan resmi tidak dapat dikirim karena data belum lengkap: ${missing.map(m => m.label).join(', ')}.`);
                    setLoading(false);
                    return;
                }

                if (sigPad.current && sigPad.current.isEmpty() && !formData.tanda_tangan) {
                    setError('Tanda tangan pelapor wajib dibubuhkan untuk laporan resmi.');
                    setLoading(false);
                    return;
                }
            } else if (type === 'draft') {
                if (!formData.insiden && !formData.patient_no_rm && !formData.patient_nama) {
                    setError('Mohon isi setidaknya Judul Insiden, Nama Pasien, atau No. RM untuk menyimpan draft.');
                    setLoading(false);
                    return;
                }
            }
            
            let finalSignature = formData.tanda_tangan;
            if (sigPad.current && !sigPad.current.isEmpty()) {
                // Use getCanvas instead of getTrimmedCanvas to avoid a known bug with trim-canvas in Vite
                finalSignature = sigPad.current.getCanvas().toDataURL('image/png');
            }

            const data = new FormData();
            const dataToSubmit = { ...formData, tanda_tangan: finalSignature, submit_type: type };
            
            // If we have an 'id' in URL (editing), use it. Remove from payload to avoid double ID fields.
            const { id: existingId, ...payload } = dataToSubmit;
            if (id) data.append('id', id);

            Object.keys(payload).forEach(key => {
                if (payload[key] !== null && payload[key] !== undefined) {
                    data.append(key, payload[key]);
                }
            });

            if (file) {
                data.append('pembuat_laporan_file', file);
            }

            console.log(`[IncidentForm] Submitting ${type}...`);

            const res = await api.post('/api/user/incidents', data, { timeout: 10000 });
            
            if (res.data.success) {
                navigate('/user/riwayat');
            } else {
                setError(res.data.message || 'Gagal menyimpan laporan.');
            }
        } catch (err) {
            console.error('Submission error:', err);
            const msg = err.response?.data?.message || err.message || 'Gagal terhubung ke server. Silakan coba lagi.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (e) => {
        const newStatus = e.target.value;
        setFormData(prev => ({ ...prev, status: newStatus }));
        setLoading(true);
        try {
            const res = await api.post(`/api/admin/laporan/${id}/status`, { status: newStatus });
            if (!res.data.success) {
                setError('Gagal memperbarui: ' + res.data.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan sistem saat memperbarui status.');
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        if (step === 4) return;
        setStep(prev => prev + 1);
        window.scrollTo(0, 0);
    };
    
    const prevStep = () => {
        if (step === 1) return;
        setStep(prev => prev - 1);
        window.scrollTo(0, 0);
    };

    if (loading && !formData.insiden && id) return <div style={{ padding: '5rem', textAlign: 'center' }}>Memuat data laporan...</div>;

    const SectionHeader = ({ num, title, color = '#0284c7', background = '#e0f2fe' }) => (
        <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem', 
            padding: '0.875rem 1.5rem', 
            background: background, 
            borderRadius: '8px 8px 0 0',
            borderBottom: `1px solid ${color}33`,
            marginBottom: '1.5rem'
        }}>
            <div style={{ 
                width: '28px', 
                height: '28px', 
                background: color, 
                color: 'white', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontWeight: 700, 
                fontSize: '0.875rem' 
            }}>{num}</div>
            <h2 style={{ fontSize: '1.125rem', margin: 0, color: '#0c4a6e', fontWeight: 700 }}>{title}</h2>
        </div>
    );

    const patientIdentity = (
        <div className="animate-in" style={{ marginBottom: '2.5rem', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
            <SectionHeader num="ID" title="Identitas Pasien" color="#64748b" background="#f8fafc" />
            <div style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label className="required-label">NO. REKAM MEDIK *</label>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <input 
                            type="text" 
                            name="patient_no_rm" 
                            className="input-control" 
                            value={formData.patient_no_rm} 
                            onChange={handleChange}
                            placeholder="Ketik No. RM..."
                            style={{ fontSize: '1.25rem', fontWeight: 700, background: isDetail ? '#f8fafc' : 'white' }}
                            disabled={isDetail}
                        />
                        {!isDetail && (
                            <button className="btn btn-primary" onClick={handleLookup} disabled={lookupLoading}>
                                <Search size={20} style={{ marginRight: '0.5rem' }} />
                                {lookupLoading ? 'Mencari...' : 'Cari'}
                            </button>
                        )}
                    </div>
                </div>

                {(patientFound || isDetail) && formData.patient_nama && (
                    <div className="animate-in">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="input-group">
                                <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>NAMA PASIEN</label>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', paddingTop: '0.25rem' }}>{formData.patient_nama || '-'}</div>
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>NO. RM</label>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', paddingTop: '0.25rem' }}>{formData.patient_no_rm || '-'}</div>
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>TANGGAL LAHIR</label>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', paddingTop: '0.25rem' }}>
                                    {formData.patient_tgl_lahir ? new Date(formData.patient_tgl_lahir).toLocaleDateString('id-ID') : '-'}
                                </div>
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>KELOMPOK UMUR</label>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', paddingTop: '0.25rem' }}>{formData.patient_kelompok_umur || '-'}</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="input-group">
                                <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>JENIS KELAMIN</label>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', paddingTop: '0.25rem' }}>{formData.patient_jk || '-'}</div>
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>RUANGAN</label>
                                {isDetail ? (
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', paddingTop: '0.25rem' }}>{formData.patient_ruangan || '-'}</div>
                                ) : (
                                    <input name="patient_ruangan" value={formData.patient_ruangan} onChange={handleChange} className="input-control" style={{ background: 'white', marginTop: '0.25rem' }} placeholder="Ruang..." />
                                )}
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>PENANGGUNG BIAYA</label>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', paddingTop: '0.25rem' }}>{formData.patient_penanggung_biaya || '-'}</div>
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>TANGGAL MASUK</label>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', paddingTop: '0.25rem' }}>
                                    {formData.patient_tanggal_masuk ? new Date(formData.patient_tanggal_masuk).toLocaleDateString('id-ID') : '-'}
                                </div>
                            </div>
                        </div>

                        <div className="input-group">
                            <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>ALAMAT</label>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', paddingTop: '0.25rem' }}>{formData.patient_alamat || '-'}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const section1 = (
        <div className="animate-in">
            <SectionHeader num="1" title="Rincian Kejadian" />
            <div style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
                <div className="form-grid">
                    <div className="input-group">
                        <label className="required-label">TANGGAL INSIDEN *</label>
                        <div style={{ position: 'relative' }}>
                            <Calendar size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', zIndex: 1 }} />
                            <input type="date" name="tanggal_insiden" value={formData.tanggal_insiden} onChange={handleChange} className="input-control" style={{ background: isDetail ? '#f8fafc' : 'white', paddingLeft: '2.5rem' }} disabled={isDetail} />
                        </div>
                    </div>
                    <div className="input-group">
                        <label className="required-label">WAKTU INSIDEN *</label>
                        <div style={{ position: 'relative' }}>
                            <Clock size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', zIndex: 1 }} />
                            <input type="time" name="waktu_insiden" value={formData.waktu_insiden} onChange={handleChange} className="input-control" style={{ background: isDetail ? '#f8fafc' : 'white', paddingLeft: '2.5rem' }} disabled={isDetail} />
                        </div>
                    </div>
                </div>

                <div className="input-group">
                    <label className="required-label">INSIDEN *</label>
                    <input name="insiden" value={formData.insiden} onChange={handleChange} className="input-control" style={{ background: isDetail ? '#f8fafc' : 'white' }} disabled={isDetail} placeholder="Ketik judul insiden..." />
                </div>

                <div className="input-group">
                    <label className="required-label">KRONOLOGIS INSIDEN *</label>
                    <textarea name="kronologis" value={formData.kronologis} onChange={handleChange} className="input-control" style={{ minHeight: '120px', background: isDetail ? '#f8fafc' : 'white' }} disabled={isDetail} placeholder="Ceritakan urutan kejadian secara mendalam..."></textarea>
                </div>
            </div>
        </div>
    );

    const section2 = (
        <div className="animate-in">
            <SectionHeader num="2" title="Jenis Insiden *" />
            <div style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[
                        { val: 'KNC', label: 'KNC - Kejadian Nyaris Cedera' },
                        { val: 'KTC', label: 'KTC - Kejadian Tidak Cedera' },
                        { val: 'KPC', label: 'KPC - Kejadian Potensial Cedera' },
                        { val: 'KTD', label: 'KTD - Kejadian Tidak Diharapkan' },
                        { val: 'SENTINEL', label: 'SENTINEL - Kejadian Sentinel' }
                    ].map(item => (
                        <label key={item.val} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '1rem', 
                            padding: '1rem', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '8px', 
                            cursor: isDetail ? 'default' : 'pointer',
                            background: formData.jenis_insiden === item.val ? '#f0f9ff' : 'white',
                            borderColor: formData.jenis_insiden === item.val ? '#0284c7' : '#e2e8f0'
                        }}>
                            <input type="radio" name="jenis_insiden" value={item.val} checked={formData.jenis_insiden === item.val} onChange={handleChange} disabled={isDetail} />
                            <span style={{ fontWeight: 600, color: formData.jenis_insiden === item.val ? '#0c4a6e' : 'inherit' }}>{item.label}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );

    const section3 = (
        <div className="animate-in">
            <SectionHeader num="3" title="Pelapor & Objek Insiden" />
            <div style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                    <div>
                        <label className="required-label">ORANG PERTAMA MELAPORKAN *</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                            {['KARYAWAN (DOKTER/PERAWAT/PETUGAS)', 'PASIEN', 'KELUARGA/PENDAMPING', 'PENGUNJUNG'].map(opt => (
                                <label key={opt} className="radio-box-item" style={{ background: formData.pelapor_pertama === opt ? '#f0f9ff' : 'white', borderColor: formData.pelapor_pertama === opt ? '#0284c7' : '#e2e8f0' }}>
                                    <input type="radio" name="pelapor_pertama" value={opt} checked={formData.pelapor_pertama === opt} onChange={handleChange} disabled={isDetail} />
                                    <span>{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="required-label">INSIDEN TERJADI PADA *</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                            {['PASIEN', 'LAIN-LAIN'].map(opt => (
                                <label key={opt} className="radio-box-item" style={{ background: formData.insiden_terjadi_pada === opt ? '#f0f9ff' : 'white', borderColor: formData.insiden_terjadi_pada === opt ? '#0284c7' : '#e2e8f0' }}>
                                    <input type="radio" name="insiden_terjadi_pada" value={opt} checked={formData.insiden_terjadi_pada === opt} onChange={handleChange} disabled={isDetail} />
                                    <span>{opt}</span>
                                </label>
                            ))}
                            {(formData.insiden_terjadi_pada === 'LAIN-LAIN') && !isDetail && (
                                <input 
                                    name="insiden_terjadi_lainnya" 
                                    value={formData.insiden_terjadi_lainnya} 
                                    onChange={handleChange} 
                                    className="input-control" 
                                    placeholder="Sebutkan siapa..."
                                    style={{ marginTop: '0.25rem' }}
                                />
                            )}
                            {isDetail && formData.insiden_terjadi_lainnya && (
                                <div style={{ padding: '0.5rem', background: '#f0f9ff', borderRadius: '6px', fontSize: '0.875rem', color: '#0c4a6e' }}>{formData.insiden_terjadi_lainnya}</div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="required-label">MENYANGKUT PASIEN *</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                            {['PASIEN RAWAT INAP', 'PASIEN RAWAT JALAN', 'PASIEN UGD', 'LAINNYA'].map(opt => (
                                <label key={opt} className="radio-box-item" style={{ background: formData.menyangkut_pasien === opt ? '#f0f9ff' : 'white', borderColor: formData.menyangkut_pasien === opt ? '#0284c7' : '#e2e8f0' }}>
                                    <input type="radio" name="menyangkut_pasien" value={opt} checked={formData.menyangkut_pasien === opt} onChange={handleChange} disabled={isDetail} />
                                    <span>{opt}</span>
                                </label>
                            ))}
                            {(formData.menyangkut_pasien === 'LAINNYA') && !isDetail && (
                                <input 
                                    name="menyangkut_lainnya" 
                                    value={formData.menyangkut_lainnya} 
                                    onChange={handleChange} 
                                    className="input-control" 
                                    placeholder="Sebutkan keterangan lainnya..."
                                    style={{ marginTop: '0.25rem' }}
                                />
                            )}
                            {isDetail && formData.menyangkut_lainnya && (
                                <div style={{ padding: '0.5rem', background: '#f0f9ff', borderRadius: '6px', fontSize: '0.875rem', color: '#0c4a6e' }}>{formData.menyangkut_lainnya}</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const section4 = (
        <div className="animate-in">
            <SectionHeader num="4" title="Lokasi & Spesialisasi" />
            <div style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
                <div className="form-grid">
                    <div className="input-group">
                        <label className="required-label">TEMPAT INSIDEN *</label>
                        <input name="tempat_insiden" value={formData.tempat_insiden} onChange={handleChange} className="input-control" style={{ background: isDetail ? '#f8fafc' : 'white' }} disabled={isDetail} placeholder="Lokasi spesifik..." />
                    </div>
                    <div className="input-group">
                        <label className="required-label">UNIT / DEPARTEMEN TERKAIT *</label>
                        <input name="unit_terkait" value={formData.unit_terkait} onChange={handleChange} className="input-control" style={{ background: isDetail ? '#f8fafc' : 'white' }} disabled={isDetail} placeholder="Unit kerja..." />
                    </div>
                </div>
                <div className="input-group">
                    <label className="required-label">SPESIALISASI *</label>
                    <select name="spesialisasi" value={formData.spesialisasi} onChange={handleChange} className="input-control" style={{ background: isDetail ? '#f8fafc' : 'white' }} disabled={isDetail}>
                        <option value="">-- Pilih --</option>
                        {['Penyakit Dalam', 'Bedah', 'Anak', 'Obstetri Gynekologi', 'THT', 'Mata', 'Saraf', 'Anastesi', 'Kulit dan Kelamin', 'Jantung', 'Paru', 'Lainnya'].map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                    {(formData.spesialisasi === 'Lainnya') && !isDetail && (
                        <input 
                            name="spesialisasi_lainnya" 
                            value={formData.spesialisasi_lainnya} 
                            onChange={handleChange} 
                            className="input-control" 
                            placeholder="Sebutkan spesialisasi lainnya..."
                            style={{ marginTop: '0.5rem' }}
                        />
                    )}
                    {isDetail && formData.spesialisasi_lainnya && (
                        <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f0f9ff', borderRadius: '6px', fontSize: '0.875rem', color: '#0c4a6e' }}>{formData.spesialisasi_lainnya}</div>
                    )}
                </div>
            </div>
        </div>
    );

    const section5 = (
        <div className="animate-in">
            <SectionHeader num="5" title="Akibat & Tindakan" />
            <div style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label className="required-label">AKIBAT INSIDEN *</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                            {[
                                'Kematian', 
                                'Cedera Irreversibel / Cedera Berat', 
                                'Cedera Reversibel / Cedera Sedang', 
                                'Cedera Ringan', 
                                'Tidak ada cedera'
                            ].map(opt => (
                                <label key={opt} className="radio-box-item" style={{ background: formData.akibat_insiden === opt ? '#f0f9ff' : 'white', borderColor: formData.akibat_insiden === opt ? '#0284c7' : '#e2e8f0' }}>
                                    <input type="radio" name="akibat_insiden" value={opt} checked={formData.akibat_insiden === opt} onChange={handleChange} disabled={isDetail} />
                                    <span>{opt.toUpperCase()}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="required-label">TINDAKAN OLEH *</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                            {['TIM', 'DOKTER', 'PERAWAT', 'LAINNYA'].map(opt => (
                                <label key={opt} className="radio-box-item" style={{ background: formData.tindakan_oleh === opt ? '#f0f9ff' : 'white', borderColor: formData.tindakan_oleh === opt ? '#0284c7' : '#e2e8f0' }}>
                                    <input type="radio" name="tindakan_oleh" value={opt} checked={formData.tindakan_oleh === opt} onChange={handleChange} disabled={isDetail} />
                                    <span>{opt}</span>
                                </label>
                            ))}
                            {formData.tindakan_oleh === 'LAINNYA' && !isDetail && (
                                <input
                                    name="tindakan_lainnya"
                                    value={formData.tindakan_lainnya}
                                    onChange={handleChange}
                                    className="input-control"
                                    placeholder="Sebutkan pelaksana lainnya..."
                                    style={{ marginTop: '0.25rem' }}
                                />
                            )}
                            {isDetail && formData.tindakan_lainnya && (
                                <div style={{ padding: '0.5rem', background: '#f0f9ff', borderRadius: '6px', fontSize: '0.875rem', color: '#0c4a6e' }}>{formData.tindakan_lainnya}</div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="input-group">
                    <label className="required-label">TINDAKAN SEGERA SETELAH KEJADIAN *</label>
                    <textarea name="tindakan_segera" value={formData.tindakan_segera} onChange={handleChange} className="input-control" style={{ minHeight: '100px', background: isDetail ? '#f8fafc' : 'white' }} disabled={isDetail}></textarea>
                </div>
            </div>
        </div>
    );

    const section6 = (
        <div className="animate-in">
            <SectionHeader num="6" title="Detail Kejadian Serupa" />
            <div style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
                <div className="input-group">
                    <label className="required-label">PERNAH TERJADI DI UNIT LAIN? *</label>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                        {['YA', 'TIDAK'].map(opt => (
                            <label key={opt} className="radio-box-item" style={{ flex: 1, background: formData.kejadian_serupa === opt.toLowerCase() ? '#f0f9ff' : 'white', borderColor: formData.kejadian_serupa === opt.toLowerCase() ? '#0284c7' : '#e2e8f0' }}>
                                <input type="radio" name="kejadian_serupa" value={opt.toLowerCase()} checked={formData.kejadian_serupa === opt.toLowerCase()} onChange={handleChange} disabled={isDetail} />
                                <span>{opt}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {(formData.kejadian_serupa === 'ya' || (isDetail && formData.detail_serupa)) && (
                    <div className="input-group" style={{ marginTop: '1rem', animation: 'fadeIn 0.3s ease' }}>
                        <label>DETAIL KEJADIAN SERUPA</label>
                        <textarea 
                            name="detail_serupa" 
                            value={formData.detail_serupa} 
                            onChange={handleChange} 
                            className="input-control" 
                            style={{ minHeight: '100px', background: isDetail ? '#f8fafc' : 'white' }} 
                            disabled={isDetail}
                            placeholder="Jelaskan kapan dan di unit mana kejadian serupa pernah terjadi..."
                        ></textarea>
                    </div>
                )}
            </div>
        </div>
    );

    const section7 = (
        <div className="animate-in">
            <SectionHeader num="7" title="Pembuat Laporan" />
            <div style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
                <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
                    <div className="input-group">
                        <label>UPLOAD DOKUMEN BUKTI INSIDEN</label>
                        <div style={{ border: '1px solid var(--border)', padding: '0.75rem', borderRadius: '8px', background: 'white' }}>
                            {!isDetail ? (
                                <input type="file" onChange={(e) => setFile(e.target.files[0])} className="input-control" style={{ border: 'none', padding: 0 }} />
                            ) : (
                                formData.pembuat_laporan_file ? (
                                    <a href={`/uploads/${formData.pembuat_laporan_file}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 600 }}>Lihat Berkas</a>
                                ) : <span style={{ color: '#94a3b8' }}>Tidak ada file</span>
                            )}
                        </div>
                    </div>
                    <div className="input-group">
                        <label className="required-label">GRADING RISIKO *</label>
                        <select name="grading_risiko" value={formData.grading_risiko || ''} onChange={handleChange} className="input-control" style={{ background: isDetail ? '#f8fafc' : 'white', fontWeight: 700 }} disabled={isDetail}>
                            <option value="">-- Pilih --</option>
                            {['Biru', 'Hijau', 'Kuning', 'Merah'].map(color => (
                                <option key={color} value={color}>{color}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="input-group">
                    <label className="required-label">TANDA TANGAN DIGITAL *</label>
                    <div style={{ background: '#0f172a', borderRadius: '8px', padding: '10px', position: 'relative' }}>
                        {formData.tanda_tangan ? (
                            <img src={formData.tanda_tangan} alt="Signature" style={{ maxWidth: '100%', maxHeight: '150px' }} />
                        ) : (
                            !isDetail ? (
                                <>
                                    <SignatureCanvas ref={sigPad} penColor='white' canvasProps={{ width: 800, height: 150, className: 'sigCanvas' }} />
                                    <button onClick={clearSignature} style={{ position: 'absolute', right: '1rem', bottom: '1rem', background: '#334155', color: 'white', border: 'none', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem' }}>Reset</button>
                                </>
                            ) : <span style={{ color: '#64748b' }}>Tidak ada tanda tangan</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );


    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>
                        {id ? (isDetail ? 'Detail Laporan Insiden' : 'Edit Laporan') : 'Laporan Insiden Baru'}
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        {isDetail ? `ID Laporan: #${id}` : 'Lengkapi seluruh informasi insiden secara akurat.'}
                    </p>
                </div>
                {isDetail && (
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        {authUser?.role === 'admin' && (
                            <div style={{ display: 'flex', alignItems: 'center', background: 'white', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, marginRight: '0.5rem', color: 'var(--text-muted)' }}>STATUS:</span>
                                <select 
                                    value={formData.status || 'pending'} 
                                    onChange={handleStatusChange}
                                    style={{ border: 'none', background: 'transparent', fontWeight: 800, outline: 'none', color: formData.status === 'reviewed' ? '#16a34a' : '#e11d48', cursor: 'pointer' }}
                                    disabled={loading}
                                >
                                    <option value="pending" style={{ color: '#e11d48' }}>PENDING</option>
                                    <option value="reviewed" style={{ color: '#16a34a' }}>REVIEWED</option>
                                </select>
                            </div>
                        )}
                        <button className="btn" style={{ background: '#f1f5f9' }} onClick={() => navigate(-1)}>
                            <ArrowLeft size={18} style={{ marginRight: '0.5rem' }} /> Kembali
                        </button>
                    </div>
                )}
            </div>

            {!isDetail && (
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem' }}>
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} style={{ flex: 1, cursor: isDetail ? 'default' : 'pointer' }} onClick={() => !isDetail && setStep(s)}>
                            <div style={{ height: '4px', background: s <= step ? 'var(--primary)' : 'var(--border)', borderRadius: '2px', transition: 'all 0.3s' }}></div>
                            <p style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '0.75rem', color: s <= step ? 'var(--primary)' : 'var(--text-muted)', textAlign: 'center', transition: 'all 0.3s' }}>TAHAP {s}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="form-card" style={{ padding: isDetail ? '2.5rem' : '3rem' }}>
                {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
                        <p style={{ color: '#b91c1c', fontSize: '0.875rem', margin: 0, fontWeight: 600 }}>{error}</p>
                    </div>
                )}
                {isDetail ? (
                    <>
                        {patientIdentity}
                        {section1}
                        {section2}
                        {section3}
                        {section4}
                        {section5}
                        {section6}
                        {section7}
                    </>
                ) : (
                    <>
                        {step === 1 && (
                            <>
                                {patientIdentity}
                            </>
                        )}
                        {step === 2 && (
                            <>
                                {section1}
                                <div style={{ height: '2rem' }}></div>
                                {section2}
                                <div style={{ height: '2rem' }}></div>
                                {section3}
                            </>
                        )}
                        {step === 3 && (
                            <>
                                {section4}
                                <div style={{ height: '2rem' }}></div>
                                {section5}
                            </>
                        )}
                        {step === 4 && (
                            <>
                                {section6}
                                <div style={{ height: '2rem' }}></div>
                                {section7}
                            </>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3.5rem' }}>
                            {step > 1 ? (
                                <button className="btn" style={{ background: '#f1f5f9' }} onClick={prevStep}>
                                    <ChevronLeft size={18} style={{ marginRight: '0.5rem' }} /> Kembali
                                </button>
                            ) : <div></div>}
                            
                            {step < 4 ? (
                                <button className="btn btn-primary" onClick={nextStep}>
                                    Selanjutnya <ChevronRight size={18} style={{ marginLeft: '0.5rem' }} />
                                </button>
                            ) : (
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button className="btn" style={{ border: '1px solid var(--primary)', background: 'white', color: 'var(--primary)' }} onClick={() => handleSubmit('draft')}>
                                        <Save size={18} style={{ marginRight: '0.5rem' }} /> Simpan Draft
                                    </button>
                                    <button className="btn btn-primary" onClick={() => handleSubmit('final')}>
                                        <Send size={18} style={{ marginRight: '0.5rem' }} /> Kirim Laporan Resmi
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .animate-in { animation: fadeIn 0.4s ease; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                .sigCanvas { width: 100% !important; height: 150px !important; background: transparent; }
                .radio-box-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.875rem 1rem;
                    border: 1px solid #e2e8f0;
                    borderRadius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #475569;
                }
                .radio-box-item:hover { background: #f8fafc; }
                .radio-box-item input[type="radio"] { width: 1.125rem; height: 1.125rem; }
                
                @media print {
                    .dashboard-layout .sidebar { display: none !important; }
                    .dashboard-layout .main-content { margin-left: 0 !important; padding: 0 !important; }
                    .btn, .sidebar, .nav-link { display: none !important; }
                    .form-card { box-shadow: none !important; border: none !important; padding: 0 !important; }
                    .main-content header { display: none !important; }
                }
            ` }} />
        </div>
    );
};

export default IncidentForm;
