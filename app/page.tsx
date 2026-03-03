'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const FullCalendarComponent = dynamic(() => import('@/components/CalendarView'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-white">
      <div className="animate-pulse-soft text-slate-400 text-sm">Memuat kalender...</div>
    </div>
  ),
});

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

interface FeedbackEntry {
  avg: number;
  ratingKeseluruhan: number;
  ratingKebersihan: number;
  ratingFasilitas: number;
}

interface Stats {
  kegiatan: number;
  instansi: number;
  peserta: number;
}

const STATUS_COLOR: Record<string, string> = {
  Approved: '#22c55e',
  Pending:  '#eab308',
  Rejected: '#ef4444',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function isFinished(endStr: string) {
  return new Date(endStr) < new Date();
}

function StarDisplay({ value, small }: { value: number; small?: boolean }) {
  return (
    <span className={`${small ? 'text-sm' : 'text-base'} tracking-tight`}>
      <span className="text-amber-400">{'★'.repeat(Math.round(value))}</span>
      <span className="text-gray-300">{'★'.repeat(5 - Math.round(value))}</span>
    </span>
  );
}

export default function HomePage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, FeedbackEntry>>({});
  const [stats, setStats] = useState<Stats>({ kegiatan: 0, instansi: 0, peserta: 0 });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'Approved' | 'Pending' | 'Rejected'>('all');

  const loadData = useCallback(async () => {
    try {
      const [bookRes, statsRes, fbRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch('/api/stats'),
        fetch('/api/feedback?map=true'),
      ]);
      const [bookData, statsData, fbData] = await Promise.all([
        bookRes.json(), statsRes.json(), fbRes.json(),
      ]);
      if (bookData.ok) setBookings(bookData.data);
      if (statsData.ok) setStats(statsData.data);
      if (fbData.ok) setFeedbackMap(fbData.data);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const calendarEvents = bookings.map((b) => ({
    id: b.id,
    title: `${b.kegiatan} - ${b.instansi}`,
    start: b.start,
    end: b.end,
    backgroundColor: STATUS_COLOR[b.status] || '#64748b',
    borderColor: STATUS_COLOR[b.status] || '#64748b',
    extendedProps: { status: b.status },
  }));

  // Hide bookings whose end date is more than 2 months ago
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  const filteredBookings = (
    activeFilter === 'all' ? [...bookings] : bookings.filter((b) => b.status === activeFilter)
  )
    .filter((b) => new Date(b.end) >= twoMonthsAgo)
    .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime()); // newest first

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>

      {/* ===== HEADER ===== */}
      <header className="bg-hero text-white shadow-lg shrink-0">
        <div className="px-4 pt-4 pb-0 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg">🏮</div>
            <div>
              <h1 className="text-base font-black leading-tight">Peminjaman Aula KSJ</h1>
              <p className="text-[10px] opacity-60">Kampung Silat Jampang</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/login"
              className="btn-primary py-2 px-3 text-xs"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.3)', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Admin
            </Link>
            <Link
              href="/booking"
              className="btn-primary py-2 px-3 text-xs"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Booking
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 divide-x divide-white/10 bg-black/15 mt-3">
          {[
            { label: 'Kegiatan', value: stats.kegiatan, color: 'text-white' },
            { label: 'Instansi',  value: stats.instansi,  color: 'text-yellow-300' },
            { label: 'Peserta',   value: stats.peserta,   color: 'text-green-300' },
          ].map((s) => (
            <div key={s.label} className="py-2.5 text-center">
              <div className="text-[9px] uppercase tracking-widest opacity-60 font-semibold">{s.label}</div>
              <div className={`text-xl font-black mt-0.5 ${s.color}`}>
                {loading ? <span className="animate-pulse-soft text-sm">—</span> : s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-4 py-1.5 text-[10px] font-medium opacity-75">
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Disetujui</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Menunggu</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Ditolak</div>
        </div>
      </header>

      {/* ===== 2-PANEL BODY ===== */}
      {/* On mobile: stacked (calendar top, list bottom). On lg: side-by-side */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">

        {/* LEFT PANEL – Calendar */}
        <div className="bg-white border-b lg:border-b-0 lg:border-r border-slate-200 shadow-sm lg:flex-1"
             style={{ height: 'min(50vw, 420px)' }}
        >
          <div className="h-full">
            <FullCalendarComponent events={calendarEvents} />
          </div>
        </div>

        {/* RIGHT PANEL – Activity List */}
        <div className="flex flex-col lg:w-[400px] xl:w-[480px] min-h-0">
          {/* Filter Tabs */}
          <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aktivitas</span>
            <div className="flex gap-1">
              {(['all', 'Approved', 'Pending', 'Rejected'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                    activeFilter === f ? 'bg-red-700 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {f === 'all' ? 'Semua' : f}
                </button>
              ))}
            </div>
          </div>

          {/* List Items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 pb-20 lg:pb-4 custom-scroll"
               style={{ maxHeight: 'calc(100vh - 280px)' }}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-20 rounded-xl" />
              ))
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-slate-400 text-sm">Belum ada jadwal.</p>
              </div>
            ) : (
              filteredBookings.map((b, idx) => {
                const fb = feedbackMap[b.id];
                const canFeedback = b.status === 'Approved' && isFinished(b.end);
                const feedbackUrl = `/feedback?bookingId=${b.id}&nama=${encodeURIComponent(b.nama)}&instansi=${encodeURIComponent(b.instansi)}&kegiatan=${encodeURIComponent(b.kegiatan)}`;

                return (
                  <div
                    key={b.id}
                    className="bg-white rounded-xl shadow-sm border-l-4 p-3 transition-all hover:shadow-md animate-fade-in-up"
                    style={{ borderLeftColor: STATUS_COLOR[b.status], animationDelay: `${idx * 35}ms` }}
                  >
                    {/* Row 1: Title + Badge */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-800 text-sm leading-tight truncate">{b.kegiatan}</h3>
                        <p className="text-xs text-slate-400 truncate">{b.instansi}</p>
                      </div>
                      <span className={`badge shrink-0 ${
                        b.status === 'Approved' ? 'badge-approved' : b.status === 'Rejected' ? 'badge-rejected' : 'badge-pending'
                      }`}>
                        {b.status === 'Approved' ? '✓ Approved' : b.status === 'Rejected' ? '✕ Rejected' : '⏳ Pending'}
                      </span>
                    </div>

                    {/* Row 2: Date + Time + Peserta */}
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(b.start)}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatTime(b.start)}–{formatTime(b.end)}
                      </span>
                      <span className="ml-auto flex items-center gap-1">
                        👥 {b.peserta} orang
                      </span>
                    </div>

                    {/* Row 3: Feedback area */}
                    {b.status === 'Approved' && (
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                        {fb ? (
                          /* Already has feedback — show stars */
                          <div className="flex items-center gap-2">
                            <StarDisplay value={fb.avg} small />
                            <span className="text-[11px] text-slate-500 font-medium">
                              {fb.avg.toFixed(1)} / 5
                            </span>
                            <span className="text-[10px] text-slate-400">(sudah dinilai)</span>
                          </div>
                        ) : canFeedback ? (
                          /* Finished but no feedback yet */
                          <Link
                            href={feedbackUrl}
                            className="flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg px-2.5 py-1 transition-all"
                          >
                            <span>⭐</span> Beri Feedback
                          </Link>
                        ) : (
                          /* Approved but event not finished yet */
                          <span className="text-[10px] text-slate-400 italic">Feedback tersedia setelah acara selesai</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* FAB Booking (mobile only, lg:hidden) */}
      <Link
        href="/booking"
        className="fixed bottom-6 right-6 z-50 lg:hidden bg-red-700 hover:bg-red-800 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        style={{ boxShadow: '0 6px 24px rgba(192,57,43,0.5)' }}
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </Link>
    </div>
  );
}
