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

function StarDisplay({ value }: { value: number }) {
  return (
    <span className="text-sm tracking-tight">
      <span className="text-amber-400">{'★'.repeat(Math.round(value))}</span>
      <span className="text-gray-300">{'★'.repeat(5 - Math.round(value))}</span>
    </span>
  );
}

type Filter = 'all' | 'Approved' | 'Pending' | 'Rejected';

/* ── Shared activity list component ─────────────────────────────── */
function ActivityList({
  bookings,
  feedbackMap,
  loading,
  activeFilter,
  setActiveFilter,
}: {
  bookings: Booking[];
  feedbackMap: Record<string, FeedbackEntry>;
  loading: boolean;
  activeFilter: Filter;
  setActiveFilter: (f: Filter) => void;
}) {
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  const filtered = (
    activeFilter === 'all' ? [...bookings] : bookings.filter((b) => b.status === activeFilter)
  )
    .filter((b) => new Date(b.end) >= twoMonthsAgo)
    .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

  return (
    <>
      {/* Filter bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shrink-0">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aktivitas</span>
        <div className="flex gap-1">
          {(['all', 'Approved', 'Pending', 'Rejected'] as Filter[]).map((f) => (
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

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 pb-6 custom-scroll">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-slate-400 text-sm">Belum ada jadwal.</p>
          </div>
        ) : (
          filtered.map((b, idx) => {
            const fb = feedbackMap[b.id];
            const canFeedback = b.status === 'Approved' && isFinished(b.end);
            const feedbackUrl = `/feedback?bookingId=${b.id}&nama=${encodeURIComponent(b.nama)}&instansi=${encodeURIComponent(b.instansi)}&kegiatan=${encodeURIComponent(b.kegiatan)}`;

            return (
              <div
                key={b.id}
                className="bg-white rounded-xl shadow-sm border-l-4 p-3 transition-all hover:shadow-md animate-fade-in-up"
                style={{ borderLeftColor: STATUS_COLOR[b.status], animationDelay: `${idx * 30}ms` }}
              >
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
                  <span className="ml-auto flex items-center gap-1">👥 {b.peserta} orang</span>
                </div>

                {b.status === 'Approved' && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center">
                    {fb ? (
                      <div className="flex items-center gap-2">
                        <StarDisplay value={fb.avg} />
                        <span className="text-[11px] text-slate-500 font-medium">{fb.avg.toFixed(1)} / 5</span>
                        <span className="text-[10px] text-slate-400">(sudah dinilai)</span>
                      </div>
                    ) : canFeedback ? (
                      <Link
                        href={feedbackUrl}
                        className="flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg px-2.5 py-1 transition-all"
                      >
                        <span>⭐</span> Beri Feedback
                      </Link>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Feedback tersedia setelah acara selesai</span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

/* ── Main Page ───────────────────────────────────────────────────── */
export default function HomePage() {
  const [bookings, setBookings]       = useState<Booking[]>([]);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, FeedbackEntry>>({});
  const [stats, setStats]             = useState<Stats>({ kegiatan: 0, instansi: 0, peserta: 0 });
  const [loading, setLoading]         = useState(true);
  const [activeFilter, setActiveFilter] = useState<Filter>('all');

  // Mobile bottom sheet state
  const [sheetOpen, setSheetOpen] = useState(false);

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
      if (bookData.ok)  setBookings(bookData.data);
      if (statsData.ok) setStats(statsData.data);
      if (fbData.ok)    setFeedbackMap(fbData.data);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Close sheet on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSheetOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const calendarEvents = bookings.map((b) => ({
    id:              b.id,
    title:           `${b.kegiatan} - ${b.instansi}`,
    start:           b.start,
    end:             b.end,
    backgroundColor: STATUS_COLOR[b.status] || '#64748b',
    borderColor:     STATUS_COLOR[b.status] || '#64748b',
    extendedProps:   { status: b.status },
  }));

  // Count for badge on sheet trigger
  const twoMonthsAgo = new Date(); twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  const listCount = bookings.filter((b) => new Date(b.end) >= twoMonthsAgo).length;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>

      {/* ===== HEADER ===== */}
      <header className="bg-hero text-white shadow-lg shrink-0">
        <div className="px-4 pt-3 pb-0 flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 shrink-0 rounded-full bg-white/20 flex items-center justify-center text-base">🏮</div>
            <div className="min-w-0">
              <h1 className="text-sm font-black leading-tight truncate">Peminjaman Aula KSJ</h1>
              <p className="text-[9px] opacity-60 hidden sm:block">Kampung Silat Jampang</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Link href="/admin/login" className="btn-primary py-1.5 px-2.5 text-xs"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.3)', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="hidden sm:inline">Admin</span>
            </Link>
            <Link href="/booking" className="btn-primary py-1.5 px-2.5 text-xs"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="hidden sm:inline">Booking</span>
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
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Approved</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Pending</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Rejected</div>
        </div>
      </header>

      {/* ===== BODY ===== */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">

        {/* ── Calendar Panel (full height on mobile, left on desktop) ── */}
        <div className="flex-1 min-h-0 bg-white lg:border-r border-slate-200 relative"
             style={{ minHeight: 'clamp(320px, calc(100dvh - 175px), 700px)' }}>
          <div className="absolute inset-0">
            <FullCalendarComponent events={calendarEvents} />
          </div>

          {/* ── Mobile only: bottom pill to open sheet ── */}
          <button
            onClick={() => setSheetOpen(true)}
            className="lg:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-slate-800/90 hover:bg-slate-900 text-white text-sm font-bold px-5 py-2.5 rounded-full shadow-xl backdrop-blur-sm transition-all active:scale-95"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.35)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Lihat Aktivitas
            {listCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-black rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                {listCount}
              </span>
            )}
            <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>

        {/* ── Desktop only: Right panel (activity list) ── */}
        <div className="hidden lg:flex flex-col lg:w-[400px] xl:w-[480px] min-h-0 bg-slate-50">
          <ActivityList
            bookings={bookings}
            feedbackMap={feedbackMap}
            loading={loading}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
          />
        </div>
      </div>

      {/* ===== MOBILE BOTTOM SHEET ===== */}
      {/* Backdrop */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          sheetOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSheetOpen(false)}
      />

      {/* Sheet panel */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-50 rounded-t-2xl shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          sheetOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '88vh' }}
      >
        {/* Drag handle + header */}
        <div className="bg-white rounded-t-2xl px-4 pt-3 pb-0 shrink-0">
          {/* Handle bar */}
          <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-3" />

          <div className="flex items-center justify-between pb-2">
            <h2 className="font-black text-slate-800 text-base">📋 Jadwal Kegiatan</h2>
            <button
              onClick={() => setSheetOpen(false)}
              className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* List content inside sheet */}
        <div className="flex flex-col flex-1 min-h-0">
          <ActivityList
            bookings={bookings}
            feedbackMap={feedbackMap}
            loading={loading}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
          />
        </div>
      </div>

      {/* Mobile: FAB Booking */}
      <Link
        href="/booking"
        className="fixed bottom-6 right-6 z-30 lg:hidden bg-red-700 hover:bg-red-800 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        style={{ boxShadow: '0 6px 24px rgba(192,57,43,0.5)' }}
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </Link>
    </div>
  );
}
