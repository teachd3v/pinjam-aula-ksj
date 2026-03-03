import { NextResponse } from 'next/server';
import { getAllBookings } from '@/lib/googleSheets';

export async function GET() {
  try {
    const bookings = await getAllBookings();
    const approved = bookings.filter((b) => b.status === 'Approved');

    const instansiSet = new Set(approved.map((b) => b.instansi.toLowerCase().trim()));
    const totalPeserta = approved.reduce((sum, b) => sum + b.peserta, 0);

    return NextResponse.json({
      ok: true,
      data: {
        kegiatan: approved.length,
        instansi: instansiSet.size,
        peserta: totalPeserta,
      },
    });
  } catch (err) {
    console.error('GET /api/stats error:', err);
    return NextResponse.json({ ok: false, message: 'Gagal mengambil statistik.' }, { status: 500 });
  }
}
