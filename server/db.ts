import { DatabaseSync } from 'node:sqlite';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'blueline_express.db');
export const db = new DatabaseSync(dbPath);

db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

export function initializeDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('PASSENGER', 'ADMIN')),
      loyalty_points INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      origin_district TEXT NOT NULL,
      destination_district TEXT NOT NULL,
      distance_km INTEGER NOT NULL,
      estimated_duration TEXT NOT NULL,
      base_fare REAL NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS buses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id INTEGER REFERENCES routes(id) ON DELETE SET NULL,
      bus_name TEXT NOT NULL,
      registration_number TEXT NOT NULL UNIQUE,
      origin_district TEXT NOT NULL,
      destination_district TEXT NOT NULL,
      journey_date TEXT NOT NULL,
      departure_time TEXT NOT NULL,
      arrival_time TEXT NOT NULL,
      duration TEXT NOT NULL,
      ac_type TEXT NOT NULL CHECK (ac_type IN ('AC', 'NON_AC')),
      seat_category TEXT NOT NULL CHECK (seat_category IN ('SEATER', 'SLEEPER', 'SEATER_SLEEPER')),
      total_seats INTEGER NOT NULL,
      fare REAL NOT NULL,
      rating REAL NOT NULL DEFAULT 4.5,
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'CANCELLED')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS seats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bus_id INTEGER NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
      seat_number TEXT NOT NULL,
      deck TEXT NOT NULL CHECK (deck IN ('LOWER', 'UPPER')),
      seat_type TEXT NOT NULL CHECK (seat_type IN ('SEATER', 'SLEEPER')),
      status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'BOOKED', 'BLOCKED')),
      price REAL NOT NULL,
      UNIQUE(bus_id, seat_number)
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_reference TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      bus_id INTEGER NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
      total_fare REAL NOT NULL,
      passenger_count INTEGER NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('CONFIRMED', 'CANCELLED', 'COMPLETED')),
      journey_date TEXT NOT NULL,
      booking_date TEXT NOT NULL DEFAULT (datetime('now')),
      cancelled_at TEXT,
      cancellation_reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS passenger_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      seat_id INTEGER NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
      seat_number TEXT NOT NULL,
      passenger_name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
      contact_phone TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
      transaction_reference TEXT NOT NULL UNIQUE,
      payment_method TEXT NOT NULL CHECK (payment_method IN ('UPI', 'DEBIT_CARD', 'CREDIT_CARD', 'NET_BANKING')),
      amount REAL NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'REFUNDED')),
      gateway_note TEXT,
      paid_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cancellations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      booking_reference TEXT NOT NULL,
      reason TEXT NOT NULL,
      refund_amount REAL NOT NULL DEFAULT 0,
      refund_status TEXT NOT NULL DEFAULT 'PROCESSED',
      cancellation_status TEXT NOT NULL DEFAULT 'CANCELLED',
      cancelled_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_buses_search ON buses(origin_district, destination_district, journey_date, status);
    CREATE INDEX IF NOT EXISTS idx_seats_bus ON seats(bus_id, status);
    CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_cancellations_user ON cancellations(user_id);
  `);
}

export function generateSeatsForBus(
  busId: number,
  seatCategory: 'SEATER' | 'SLEEPER' | 'SEATER_SLEEPER',
  totalSeats: number,
  baseFare: number,
  preBookedSeats: string[] = [],
  preBlockedSeats: string[] = []
): void {
  const insertSeat = db.prepare(`
    INSERT OR IGNORE INTO seats (bus_id, seat_number, deck, seat_type, status, price)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const preBooked = new Set(preBookedSeats);
  const preBlocked = new Set(preBlockedSeats);

  if (seatCategory === 'SLEEPER') {
    const half = Math.ceil(totalSeats / 2);
    for (let i = 1; i <= half; i++) {
      const num = `L${i}`;
      const status = preBooked.has(num) ? 'BOOKED' : preBlocked.has(num) ? 'BLOCKED' : 'AVAILABLE';
      insertSeat.run(busId, num, 'LOWER', 'SLEEPER', status, baseFare);
    }
    for (let i = 1; i <= totalSeats - half; i++) {
      const num = `U${i}`;
      const status = preBooked.has(num) ? 'BOOKED' : preBlocked.has(num) ? 'BLOCKED' : 'AVAILABLE';
      insertSeat.run(busId, num, 'UPPER', 'SLEEPER', status, Math.round(baseFare * 0.95));
    }
  } else if (seatCategory === 'SEATER_SLEEPER') {
    const lowerCount = Math.ceil(totalSeats * 0.6);
    const upperCount = totalSeats - lowerCount;
    for (let i = 1; i <= lowerCount; i++) {
      const num = `S${i}`;
      const status = preBooked.has(num) ? 'BOOKED' : preBlocked.has(num) ? 'BLOCKED' : 'AVAILABLE';
      insertSeat.run(busId, num, 'LOWER', 'SEATER', status, baseFare);
    }
    for (let i = 1; i <= upperCount; i++) {
      const num = `U${i}`;
      const status = preBooked.has(num) ? 'BOOKED' : preBlocked.has(num) ? 'BLOCKED' : 'AVAILABLE';
      insertSeat.run(busId, num, 'UPPER', 'SLEEPER', status, Math.round(baseFare * 1.25));
    }
  } else {
    for (let i = 1; i <= totalSeats; i++) {
      const num = `A${i}`;
      const status = preBooked.has(num) ? 'BOOKED' : preBlocked.has(num) ? 'BLOCKED' : 'AVAILABLE';
      insertSeat.run(busId, num, 'LOWER', 'SEATER', status, baseFare);
    }
  }
}
