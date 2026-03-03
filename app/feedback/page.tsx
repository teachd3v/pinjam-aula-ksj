'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface StarRatingProps {
  label: string;
  name: string;
  value: number;
  onChange: (name: string, val: number) => void;
  error?: string;
}

function StarRating({ label, name, value, onChange, error }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  return (
    <div>
      <label className="form-label">{label} <span className="text-red-500">*</span></label>
      <div className="flex items-center gap-1 mt-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star-btn ${star <= (hovered || value) ? 'active' : ''}`}
            onClick={() => onChange(name, star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`${star} bintang`}
          >
            ★
          </button>
        ))}
        {value > 0 && (
          <span className="ml-2 self-center text-sm font-bold text-amber-500">
            {['', 'Buruk', 'Kurang', 'Cukup', 'Bagus', 'Sangat Bagus'][value]}
          </span>
        )}
      </div>
      {error && <p className="form-error">⚠ {error}</p>}
    </div>
  );
}

interface Ratings {
  ratingKeseluruhan: number;
  ratingKebersihan: number;
  ratingFasilitas: number;
}

function FeedbackForm() {
  const searchParams = useSearchParams();

  // Pre-fill from query params (passed from activity card)
  const bookingId = searchParams.get('bookingId') || '';
  const prefillNama = searchParams.get('nama') || '';
  const prefillInstansi = searchParams.get('instansi') || '';
  const prefillKegiatan = searchParams.get('kegiatan') || '';

  const hasPreFill = !!(prefillNama && prefillInstansi && prefillKegiatan);

  const [form, setForm] = useState({
    nama: prefillNama,
    instansi: prefillInstansi,
    kegiatan: prefillKegiatan,
    komentar: '',
  });
  const [ratings, setRatings] = useState<Ratings>({
    ratingKeseluruhan: 0,
    ratingKebersihan: 0,
    ratingFasilitas: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Update form if params change (e.g. navigation)
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      nama: prefillNama || prev.nama,
      instansi: prefillInstansi || prev.instansi,
      kegiatan: prefillKegiatan || prev.kegiatan,
    }));
  }, [prefillNama, prefillInstansi, prefillKegiatan]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleRating = (name: string, val: number) => {
    setRatings((prev) => ({ ...prev, [name]: val }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nama.trim() || form.nama.trim().length < 2) e.nama = 'Nama wajib diisi (min 2 karakter).';
    if (!form.instansi.trim()) e.instansi = 'Instansi wajib diisi.';
    if (!form.kegiatan.trim()) e.kegiatan = 'Nama kegiatan wajib diisi.';
    if (!ratings.ratingKeseluruhan) e.ratingKeseluruhan = 'Rating kepuasan wajib diisi.';
    if (!ratings.ratingKebersihan) e.ratingKebersihan = 'Rating kebersihan wajib diisi.';
    if (!ratings.ratingFasilitas) e.ratingFasilitas = 'Rating fasilitas wajib diisi.';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ...ratings, bookingId }),
      });
      const data = await res.json();
      if (data.ok) setSubmitted(true);
      else setErrors({ nama: data.message });
    } catch {
      setErrors({ nama: 'Terjadi kesalahan. Coba lagi.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: 'var(--bg)' }}>
        <div className="glass-card p-10 max-w-sm w-full animate-fade-in-up">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">Terima Kasih!</h1>
          <p className="text-slate-500 text-sm mb-6">
            Feedback kamu untuk kegiatan <strong className="text-slate-700">{form.kegiatan}</strong> sudah kami terima!
          </p>
          <Link href="/" className="btn-primary w-full">← Kembali ke Beranda</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="text-white px-4" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #e74c3c 100%)' }}>
        <div className="flex items-center gap-3 py-4">
          <Link href="/" className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center hover:bg-white/25 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-lg font-black leading-tight">Form Feedback</h1>
            <p className="text-xs opacity-70">Aula Padepokan KSJ</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {/* Pre-filled info card */}
        {hasPreFill ? (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 flex items-start gap-3">
            <span className="text-xl">📋</span>
            <div>
              <p className="text-sm font-bold text-blue-800">Data kegiatan sudah terisi otomatis</p>
              <p className="text-xs text-blue-600 mt-0.5">
                <strong>{prefillKegiatan}</strong> · {prefillInstansi} · PIC: {prefillNama}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3">
            <span className="text-xl">💬</span>
            <div>
              <p className="text-sm font-bold text-amber-800">Bantu kami berkembang!</p>
              <p className="text-xs text-amber-700 mt-0.5">Ceritakan pengalamanmu menggunakan aula Padepokan KSJ.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Identitas — hidden jika pre-filled, tampil jika manual */}
          {!hasPreFill && (
            <div className="glass-card p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <span className="text-base">👤</span> Identitas
              </h2>
              <div>
                <label className="form-label">Nama Lengkap <span className="text-red-500">*</span></label>
                <input name="nama" value={form.nama} onChange={handleChange} placeholder="Nama kamu" className={`form-input ${errors.nama ? 'error' : ''}`} />
                {errors.nama && <p className="form-error">⚠ {errors.nama}</p>}
              </div>
              <div>
                <label className="form-label">Instansi / Komunitas <span className="text-red-500">*</span></label>
                <input name="instansi" value={form.instansi} onChange={handleChange} placeholder="Asal instansi" className={`form-input ${errors.instansi ? 'error' : ''}`} />
                {errors.instansi && <p className="form-error">⚠ {errors.instansi}</p>}
              </div>
              <div>
                <label className="form-label">Nama Kegiatan <span className="text-red-500">*</span></label>
                <input name="kegiatan" value={form.kegiatan} onChange={handleChange} placeholder="Nama kegiatan" className={`form-input ${errors.kegiatan ? 'error' : ''}`} />
                {errors.kegiatan && <p className="form-error">⚠ {errors.kegiatan}</p>}
              </div>
            </div>
          )}

          {/* Rating */}
          <div className="glass-card p-5 space-y-5">
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <span className="text-base">⭐</span> Penilaian
            </h2>
            <StarRating label="Kepuasan Keseluruhan" name="ratingKeseluruhan" value={ratings.ratingKeseluruhan} onChange={handleRating} error={errors.ratingKeseluruhan} />
            <div className="h-px bg-slate-100" />
            <StarRating label="Kebersihan Ruangan" name="ratingKebersihan" value={ratings.ratingKebersihan} onChange={handleRating} error={errors.ratingKebersihan} />
            <div className="h-px bg-slate-100" />
            <StarRating label="Kelengkapan Fasilitas" name="ratingFasilitas" value={ratings.ratingFasilitas} onChange={handleRating} error={errors.ratingFasilitas} />
          </div>

          {/* Komentar */}
          <div className="glass-card p-5">
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
              <span className="text-base">✍️</span> Saran & Masukan
              <span className="text-xs font-normal text-slate-400">(opsional)</span>
            </h2>
            <textarea
              name="komentar"
              value={form.komentar}
              onChange={handleChange}
              rows={4}
              placeholder="Ceritakan pengalamanmu, hal yang perlu diperbaiki, atau saran untuk kami..."
              className="form-input resize-none"
              maxLength={500}
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{form.komentar.length}/500</p>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5 text-base">
            {submitting ? (
              <><svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Mengirim...</>
            ) : (
              <><span>⭐</span> Kirim Feedback</>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400">Memuat...</div>}>
      <FeedbackForm />
    </Suspense>
  );
}
