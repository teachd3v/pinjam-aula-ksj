import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!;

function getAuth() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

export async function getSheetsClient() {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

// ============================================================
// BOOKINGS SHEET
// ============================================================
// Columns: A=ID, B=Nama, C=Instansi, D=HP, E=Kegiatan, F=Peserta, G=Start, H=End, I=Status, J=CreatedAt

export async function getAllBookings() {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Bookings!A2:J',
  });
  const rows = res.data.values || [];
  return rows.map((row) => ({
    id: row[0] || '',
    nama: row[1] || '',
    instansi: row[2] || '',
    hp: row[3] || '',
    kegiatan: row[4] || '',
    peserta: Number(row[5]) || 0,
    start: row[6] || '',
    end: row[7] || '',
    status: row[8] || 'Pending',
    createdAt: row[9] || '',
  }));
}

export async function addBooking(form: {
  nama: string;
  instansi: string;
  hp: string;
  kegiatan: string;
  peserta: number;
  start: string;
  end: string;
}) {
  const sheets = await getSheetsClient();

  // Fetch existing to check conflicts
  const existing = await getAllBookings();
  const reqStart = new Date(form.start);
  const reqEnd = new Date(form.end);

  if (reqEnd <= reqStart) {
    return { ok: false, message: 'Jam Selesai harus lebih akhir dari Jam Mulai.' };
  }

  for (const row of existing) {
    if (row.status === 'Approved') {
      const existStart = new Date(row.start);
      const existEnd = new Date(row.end);
      if (reqStart < existEnd && reqEnd > existStart) {
        return {
          ok: false,
          message: `Jadwal bentrok dengan kegiatan "${row.kegiatan}" yang sudah disetujui.`,
        };
      }
    }
  }

  const id = Date.now().toString();
  const createdAt = new Date().toISOString();

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Bookings!A:J',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[id, form.nama, form.instansi, form.hp, form.kegiatan, form.peserta, form.start, form.end, 'Pending', createdAt]],
    },
  });

  return { ok: true, message: 'Berhasil diajukan! Menunggu persetujuan Admin.' };
}

export async function updateBookingStatus(id: string, status: 'Approved' | 'Rejected') {
  const sheets = await getSheetsClient();

  // Find the row with this ID
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Bookings!A:A',
  });

  const ids = res.data.values || [];
  const rowIndex = ids.findIndex((r) => r[0] === id);

  if (rowIndex === -1) {
    return { ok: false, message: 'Booking tidak ditemukan.' };
  }

  // Row index in sheet is 1-based + 1 for header offset
  const sheetRow = rowIndex + 1;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Bookings!I${sheetRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[status]],
    },
  });

  return { ok: true, message: `Status berhasil diubah ke ${status}.` };
}

// ============================================================
// FEEDBACK SHEET
// ============================================================
// Columns: A=ID, B=Nama, C=Instansi, D=Kegiatan, E=RatingKeseluruhan, F=RatingKebersihan, G=RatingFasilitas, H=Komentar, I=CreatedAt

export async function getAllFeedback() {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Feedback!A2:J',
  });
  const rows = res.data.values || [];
  return rows.map((row) => ({
    id: row[0] || '',
    nama: row[1] || '',
    instansi: row[2] || '',
    kegiatan: row[3] || '',
    ratingKeseluruhan: Number(row[4]) || 0,
    ratingKebersihan: Number(row[5]) || 0,
    ratingFasilitas: Number(row[6]) || 0,
    komentar: row[7] || '',
    createdAt: row[8] || '',
    bookingId: row[9] || '',
  }));
}

// Returns a map of bookingId -> feedback for quick lookup
export async function getFeedbackMap(): Promise<Record<string, { avg: number; ratingKeseluruhan: number; ratingKebersihan: number; ratingFasilitas: number }>> {
  const feedback = await getAllFeedback();
  const map: Record<string, { avg: number; ratingKeseluruhan: number; ratingKebersihan: number; ratingFasilitas: number }> = {};
  for (const f of feedback) {
    if (f.bookingId) {
      const avg = Math.round(((f.ratingKeseluruhan + f.ratingKebersihan + f.ratingFasilitas) / 3) * 10) / 10;
      map[f.bookingId] = { avg, ratingKeseluruhan: f.ratingKeseluruhan, ratingKebersihan: f.ratingKebersihan, ratingFasilitas: f.ratingFasilitas };
    }
  }
  return map;
}

export async function addFeedback(form: {
  nama: string;
  instansi: string;
  kegiatan: string;
  ratingKeseluruhan: number;
  ratingKebersihan: number;
  ratingFasilitas: number;
  komentar: string;
  bookingId?: string;
}) {
  const sheets = await getSheetsClient();
  const id = Date.now().toString();
  const createdAt = new Date().toISOString();

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Feedback!A:J',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[id, form.nama, form.instansi, form.kegiatan, form.ratingKeseluruhan, form.ratingKebersihan, form.ratingFasilitas, form.komentar, createdAt, form.bookingId || '']],
    },
  });

  return { ok: true, message: 'Feedback berhasil dikirim. Terima kasih!' };
}
