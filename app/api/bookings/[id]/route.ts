import { NextResponse } from 'next/server';
import { updateBookingStatus } from '@/lib/googleSheets';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

async function isAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) return false;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, message: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { status } = body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return NextResponse.json({ ok: false, message: 'Status tidak valid.' }, { status: 400 });
    }

    const result = await updateBookingStatus(id, status);
    return NextResponse.json(result);
  } catch (err) {
    console.error('PATCH /api/bookings/[id] error:', err);
    return NextResponse.json({ ok: false, message: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
