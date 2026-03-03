import { NextResponse } from 'next/server';
import { getAllBookings, addBooking } from '@/lib/googleSheets';

export async function GET() {
  try {
    const bookings = await getAllBookings();
    return NextResponse.json({ ok: true, data: bookings });
  } catch (err) {
    console.error('GET /api/bookings error:', err);
    return NextResponse.json({ ok: false, message: 'Gagal mengambil data.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, instansi, hp, kegiatan, peserta, start, end } = body;

    // Server-side validation
    if (!nama || !instansi || !hp || !kegiatan || !peserta || !start || !end) {
      return NextResponse.json({ ok: false, message: 'Semua field wajib diisi.' }, { status: 400 });
    }

    const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/;
    if (!phoneRegex.test(hp.replace(/\s/g, ''))) {
      return NextResponse.json({ ok: false, message: 'Format nomor HP tidak valid.' }, { status: 400 });
    }

    if (Number(peserta) < 1 || Number(peserta) > 500) {
      return NextResponse.json({ ok: false, message: 'Jumlah peserta harus antara 1 dan 500.' }, { status: 400 });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    const now = new Date();

    if (startDate < now) {
      return NextResponse.json({ ok: false, message: 'Waktu mulai tidak boleh di masa lampau.' }, { status: 400 });
    }

    const durationMs = endDate.getTime() - startDate.getTime();
    if (durationMs < 30 * 60 * 1000) {
      return NextResponse.json({ ok: false, message: 'Durasi minimum peminjaman adalah 30 menit.' }, { status: 400 });
    }

    const result = await addBooking({ nama, instansi, hp, kegiatan, peserta: Number(peserta), start, end });

    if (!result.ok) {
      return NextResponse.json(result, { status: 409 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error('POST /api/bookings error:', err);
    return NextResponse.json({ ok: false, message: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
