'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface FormData {
  nama: string;
  hp: string;
  instansi: string;
  kegiatan: string;
  peserta: string;
  start: string;
  end: string;
}

interface FormErrors {
  nama?: string;
  hp?: string;
  instansi?: string;
  kegiatan?: string;
  peserta?: string;
  start?: string;
  end?: string;
}

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};
  const now = new Date();

  // Nama
  if (!data.nama.trim()) {
    errors.nama = 'Nama PIC wajib diisi.';
  } else if (data.nama.trim().length < 3) {
    errors.nama = 'Nama minimal 3 karakter.';
  } else if (!/^[a-zA-Z\s.'-]+$/.test(data.nama.trim())) {
    errors.nama = 'Nama hanya boleh berisi huruf.';
  }

  // HP
  const cleanHP = data.hp.replace(/\s|-/g, '');
  if (!cleanHP) {
    errors.hp = 'Nomor HP wajib diisi.';
  } else if (!/^(\+62|62|0)[0-9]{9,13}$/.test(cleanHP)) {
    errors.hp = 'Format HP tidak valid. Contoh: 08123456789 atau +6281234567890';
  }

  // Instansi
  if (!data.instansi.trim()) {
    errors.instansi = 'Instansi / komunitas wajib diisi.';
  } else if (data.instansi.trim().length < 3) {
    errors.instansi = 'Nama instansi minimal 3 karakter.';
  }

  // Kegiatan
  if (!data.kegiatan.trim()) {
    errors.kegiatan = 'Nama kegiatan wajib diisi.';
  } else if (data.kegiatan.trim().length < 5) {
    errors.kegiatan = 'Nama kegiatan minimal 5 karakter.';
  }

  // Peserta
  const p = Number(data.peserta);
  if (!data.peserta) {
    errors.peserta = 'Jumlah peserta wajib diisi.';
  } else if (isNaN(p) || p < 1) {
    errors.peserta = 'Jumlah peserta minimal 1 orang.';
  } else if (p > 500) {
    errors.peserta = 'Jumlah peserta maksimal 500 orang.';
  }

  // Start
  if (!data.start) {
    errors.start = 'Waktu mulai wajib diisi.';
  } else if (new Date(data.start) < now) {
    errors.start = 'Waktu mulai tidak boleh di masa lampau.';
  }

  // End
  if (!data.end) {
    errors.end = 'Waktu selesai wajib diisi.';
  } else if (data.start && data.end) {
    const startDate = new Date(data.start);
    const endDate = new Date(data.end);
    const diffMin = (endDate.getTime() - startDate.getTime()) / 60000;
    if (endDate <= startDate) {
      errors.end = 'Waktu selesai harus lebih akhir dari waktu mulai.';
    } else if (diffMin < 30) {
      errors.end = 'Durasi minimal peminjaman adalah 30 menit.';
    }
  }

  return errors;
}

export default function BookingPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    nama: '', hp: '', instansi: '', kegiatan: '', peserta: '', start: '', end: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateForm(formData);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to first error
      const firstErrorField = document.querySelector('.form-input.error');
      firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, peserta: Number(formData.peserta) }),
      });
      const data = await res.json();

      if (data.ok) {
        showToast('✅ ' + data.message, 'success');
        setTimeout(() => router.push('/'), 2500);
      } else {
        showToast('❌ ' + data.message, 'error');
      }
    } catch {
      showToast('❌ Terjadi kesalahan. Coba lagi.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const Field = ({
    label, name, type = 'text', placeholder, required, min, max,
  }: {
    label: string; name: keyof FormData; type?: string; placeholder?: string;
    required?: boolean; min?: string; max?: string;
  }) => (
    <div>
      <label className="form-label">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        placeholder={placeholder}
        min={min}
        max={max}
        className={`form-input ${errors[name] ? 'error' : ''}`}
      />
      {errors[name] && (
        <p className="form-error">
          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {errors[name]}
        </p>
      )}
    </div>
  );

  // Min datetime = now (formatted for input)
  const minDateTime = new Date().toISOString().slice(0, 16);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="bg-hero text-white px-4 pt-safe-top">
        <div className="flex items-center gap-3 py-4">
          <Link
            href="/"
            className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center hover:bg-white/25 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-lg font-black leading-tight">Ajukan Peminjaman</h1>
            <p className="text-xs opacity-70">Aula Padepokan KSJ</p>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Section: Identitas */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-slate-700">Identitas Pemohon</h2>
            </div>
            {/* Nama + HP: full width each on mobile, side-by-side on sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Field label="Nama PIC / Penanggung Jawab" name="nama" placeholder="Contoh: Ahmad Fauzi" required />
              </div>
              <Field label="No HP / WhatsApp" name="hp" type="tel" placeholder="0812XXXXXXXX" required />
            </div>
            <Field label="Asal Instansi / Komunitas" name="instansi" placeholder="Contoh: Padepokan A / SMAN 1 Jakarta" required />
          </div>

          {/* Section: Detail Kegiatan */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-slate-700">Detail Kegiatan</h2>
            </div>
            {/* Kegiatan + Peserta: stack on mobile, side-by-side on sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Field label="Nama Kegiatan" name="kegiatan" placeholder="Contoh: Latihan Silat Rutin" required />
              </div>
              <Field label="Jml Peserta" name="peserta" type="number" placeholder="0" min="1" max="500" required />
            </div>
          </div>

          {/* Section: Waktu */}
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-slate-700">Waktu Peminjaman</h2>
            </div>
            {/* Mulai + Selesai: stack on xs, side by side on sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Mulai" name="start" type="datetime-local" min={minDateTime} required />
              <Field label="Selesai" name="end" type="datetime-local" min={formData.start || minDateTime} required />
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Durasi minimal peminjaman adalah 30 menit.
            </p>
          </div>

          {/* Syarat */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
            <p className="font-bold mb-1">⚠️ Ketentuan Peminjaman:</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>Booking akan diproses dan menunggu approval admin.</li>
              <li>Jadwal yang sudah Approved tidak dapat diubah.</li>
              <li>Pembatalan minimal H-1 sebelum kegiatan.</li>
              <li>Pastikan aula dikembalikan dalam kondisi bersih & rapi.</li>
            </ul>
          </div>

          {/* Submit */}
          <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5 text-base">
            {submitting ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Mengecek ketersediaan...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Kirim Permohonan Booking
              </>
            )}
          </button>
        </form>
      </main>

      {/* Toast */}
      {toast && (
        <div className={`toast visible toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
