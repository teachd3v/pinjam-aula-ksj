'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Booking {
  id: string;
  nama: string;
  instansi: string;
  hp: string;
  kegiatan: string;
  peserta: number;
  start: string;
  end: string;
  status: string;
  createdAt: string;
}

interface FeedbackItem {
  id: string;
  nama: string;
  instansi: string;
  kegiatan: string;
  ratingKeseluruhan: number;
  ratingKebersihan: number;
  ratingFasilitas: number;
  komentar: string;
  createdAt: string;
}

type Filter = 'all' | 'Pending' | 'Approved' | 'Rejected';
type Tab = 'bookings' | 'feedback';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  Pending:  { label: '⏳ Menunggu', cls: 'badge-pending'  },
  Approved: { label: '✓ Disetujui', cls: 'badge-approved' },
  Rejected: { label: '✕ Ditolak',  cls: 'badge-rejected'  },
};

function formatDT(dt: string) {
  if (!dt) return '-';
  const d = new Date(dt);
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function Stars({ val }: { val: number }) {
  return (
    <span className="text-amber-400 text-sm tracking-tight">
      {'★'.repeat(val)}{'☆'.repeat(5 - val)}
    </span>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ id: string; action: 'Approved' | 'Rejected'; nama: string } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, fRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/feedback'),
      ]);
      const bData = await bRes.json();
      const fData = await fRes.json();
      if (bData.ok) setBookings(bData.data.sort((a: Booking, b: Booking) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      if (fData.ok) setFeedback(fData.data.sort((a: FeedbackItem, b: FeedbackItem) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAction = async (id: string, status: 'Approved' | 'Rejected') => {
    setActionLoading(id + status);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.ok) {
        showToast(`✅ Booking berhasil di-${status === 'Approved' ? 'approve' : 'reject'}.`, 'success');
        setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
      } else {
        showToast(`❌ ${data.message}`, 'error');
      }
    } catch {
      showToast('❌ Terjadi kesalahan.', 'error');
    } finally {
      setActionLoading(null);
      setConfirmModal(null);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  // Stats
  const approved = bookings.filter((b) => b.status === 'Approved').length;
  const pending = bookings.filter((b) => b.status === 'Pending').length;
  const rejected = bookings.filter((b) => b.status === 'Rejected').length;
  const avgRating = feedback.length
    ? (feedback.reduce((s, f) => s + (f.ratingKeseluruhan + f.ratingKebersihan + f.ratingFasilitas) / 3, 0) / feedback.length).toFixed(1)
    : '—';

  const filteredBookings = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <div className="min-h-screen bg-admin-hero">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏮</span>
            <div>
              <h1 className="text-white font-black text-base leading-none">Panel Admin</h1>
              <p className="text-slate-400 text-xs">Padepokan KSJ</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" target="_blank" rel="noopener noreferrer"
               className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/25">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Lihat Publik
            </a>
            <button onClick={handleLogout}
              className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-500/30 hover:border-red-400/50">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Booking', value: bookings.length, icon: '📋', color: 'from-slate-600 to-slate-700' },
            { label: 'Disetujui', value: approved, icon: '✅', color: 'from-green-600 to-green-700' },
            { label: 'Menunggu', value: pending, icon: '⏳', color: 'from-yellow-600 to-yellow-700' },
            { label: 'Rata Feedback', value: feedback.length ? `${avgRating}★` : '—', icon: '⭐', color: 'from-amber-600 to-orange-600' },
          ].map((s) => (
            <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-xl p-4 text-white shadow-lg`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-black">{loading ? '...' : s.value}</div>
              <div className="text-xs opacity-75 font-medium mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-4 bg-white/5 p-1 rounded-xl w-fit">
          <button onClick={() => setTab('bookings')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'bookings' ? 'bg-white text-slate-800 shadow' : 'text-slate-400 hover:text-white'}`}>
            📋 Peminjaman {pending > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5">{pending}</span>}
          </button>
          <button onClick={() => setTab('feedback')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'feedback' ? 'bg-white text-slate-800 shadow' : 'text-slate-400 hover:text-white'}`}>
            ⭐ Feedback {feedback.length > 0 && <span className="ml-1 bg-amber-500 text-white text-[10px] rounded-full px-1.5 py-0.5">{feedback.length}</span>}
          </button>
        </div>

        {/* BOOKINGS TAB */}
        {tab === 'bookings' && (
          <div className="glass-card overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
              <h2 className="font-bold text-slate-700">Data Peminjaman Aula</h2>
              <div className="flex gap-1.5">
                {(['all', 'Pending', 'Approved', 'Rejected'] as Filter[]).map((f) => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                      filter === f ? 'bg-red-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}>
                    {f === 'all' ? 'Semua' : f}
                    {f !== 'all' && (
                      <span className="ml-1 opacity-75">({bookings.filter((b) => b.status === f).length})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-400 animate-pulse-soft">Memuat data...</div>
            ) : filteredBookings.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-slate-400 text-sm">Tidak ada data {filter !== 'all' ? filter : 'peminjaman'}.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Pemohon</th>
                      <th>Instansi</th>
                      <th>Kegiatan</th>
                      <th className="text-center">Peserta</th>
                      <th>Waktu</th>
                      <th className="text-center">Status</th>
                      <th className="text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((b) => {
                      const s = STATUS_MAP[b.status] || { label: b.status, cls: 'badge-pending' };
                      const isLoading = actionLoading === b.id + 'Approved' || actionLoading === b.id + 'Rejected';
                      return (
                        <tr key={b.id} className={b.status === 'Pending' ? 'bg-yellow-50/30' : ''}>
                          <td className="text-xs text-slate-400 whitespace-nowrap">{formatDT(b.createdAt)}</td>
                          <td>
                            <div className="font-semibold text-slate-800 text-sm">{b.nama}</div>
                            <div className="text-xs text-slate-400">{b.hp}</div>
                          </td>
                          <td className="text-sm text-slate-600 max-w-[120px] truncate">{b.instansi}</td>
                          <td className="font-medium text-sm text-slate-700 max-w-[150px]">{b.kegiatan}</td>
                          <td className="text-center text-sm font-semibold text-slate-600">{b.peserta}</td>
                          <td className="text-xs text-slate-500 whitespace-nowrap">
                            <div>{formatDT(b.start)}</div>
                            <div className="text-slate-400">s/d {formatDT(b.end)}</div>
                          </td>
                          <td className="text-center">
                            <span className={`badge ${s.cls}`}>{s.label}</span>
                          </td>
                          <td>
                            {b.status === 'Pending' ? (
                              <div className="flex gap-1.5 justify-center">
                                <button
                                  onClick={() => setConfirmModal({ id: b.id, action: 'Approved', nama: b.kegiatan })}
                                  disabled={isLoading}
                                  className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                                >
                                  {isLoading ? '...' : '✓ Setuju'}
                                </button>
                                <button
                                  onClick={() => setConfirmModal({ id: b.id, action: 'Rejected', nama: b.kegiatan })}
                                  disabled={isLoading}
                                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                                >
                                  {isLoading ? '...' : '✕ Tolak'}
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* FEEDBACK TAB */}
        {tab === 'feedback' && (
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-bold text-slate-700">Data Feedback Pengguna</h2>
              <div className="text-sm text-slate-500">{feedback.length} feedback masuk</div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-400 animate-pulse-soft">Memuat data...</div>
            ) : feedback.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-slate-400 text-sm">Belum ada feedback masuk.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Nama</th>
                      <th>Instansi</th>
                      <th>Kegiatan</th>
                      <th className="text-center">Keseluruhan</th>
                      <th className="text-center">Kebersihan</th>
                      <th className="text-center">Fasilitas</th>
                      <th>Komentar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedback.map((f) => (
                      <tr key={f.id}>
                        <td className="text-xs text-slate-400 whitespace-nowrap">{formatDT(f.createdAt)}</td>
                        <td className="font-semibold text-slate-800 text-sm">{f.nama}</td>
                        <td className="text-sm text-slate-600">{f.instansi}</td>
                        <td className="text-sm text-slate-700 max-w-[140px] truncate">{f.kegiatan}</td>
                        <td className="text-center"><Stars val={f.ratingKeseluruhan} /></td>
                        <td className="text-center"><Stars val={f.ratingKebersihan} /></td>
                        <td className="text-center"><Stars val={f.ratingFasilitas} /></td>
                        <td className="text-xs text-slate-500 max-w-[200px]">
                          <p className="line-clamp-2">{f.komentar || <span className="italic text-slate-300">—</span>}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="glass-card p-6 max-w-sm w-full animate-fade-in-up">
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              {confirmModal.action === 'Approved' ? '✅ Setujui Booking?' : '❌ Tolak Booking?'}
            </h3>
            <p className="text-sm text-slate-600 mb-5">
              Kamu akan <strong>{confirmModal.action === 'Approved' ? 'menyetujui' : 'menolak'}</strong> booking kegiatan:<br />
              <span className="font-bold text-slate-800">"{confirmModal.nama}"</span>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)} className="btn-secondary flex-1">Batal</button>
              <button
                onClick={() => handleAction(confirmModal.id, confirmModal.action)}
                disabled={!!actionLoading}
                className={`flex-1 btn-primary ${confirmModal.action === 'Rejected' ? '' : ''}`}
                style={{ background: confirmModal.action === 'Approved' ? 'linear-gradient(135deg,#16a34a,#22c55e)' : 'linear-gradient(135deg,#b91c1c,#ef4444)' }}
              >
                {actionLoading ? '...' : confirmModal.action === 'Approved' ? 'Ya, Setujui' : 'Ya, Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast visible toast-${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  );
}
