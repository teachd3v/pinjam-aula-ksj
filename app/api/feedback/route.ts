import { NextResponse } from 'next/server';
import { getAllFeedback, getFeedbackMap, addFeedback } from '@/lib/googleSheets';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // ?map=true returns { bookingId -> { avg, ratings } }
    if (searchParams.get('map') === 'true') {
      const map = await getFeedbackMap();
      return NextResponse.json({ ok: true, data: map });
    }
    const feedback = await getAllFeedback();
    return NextResponse.json({ ok: true, data: feedback });
  } catch (err) {
    console.error('GET /api/feedback error:', err);
    return NextResponse.json({ ok: false, message: 'Gagal mengambil feedback.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, instansi, kegiatan, ratingKeseluruhan, ratingKebersihan, ratingFasilitas, komentar, bookingId } = body;

    if (!nama || !instansi || !kegiatan) {
      return NextResponse.json({ ok: false, message: 'Nama, instansi, dan kegiatan wajib diisi.' }, { status: 400 });
    }
    if ([ratingKeseluruhan, ratingKebersihan, ratingFasilitas].some((r) => !r || r < 1 || r > 5)) {
      return NextResponse.json({ ok: false, message: 'Semua rating harus diisi (1-5).' }, { status: 400 });
    }

    const result = await addFeedback({
      nama, instansi, kegiatan,
      ratingKeseluruhan: Number(ratingKeseluruhan),
      ratingKebersihan: Number(ratingKebersihan),
      ratingFasilitas: Number(ratingFasilitas),
      komentar: komentar || '',
      bookingId: bookingId || '',
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error('POST /api/feedback error:', err);
    return NextResponse.json({ ok: false, message: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
