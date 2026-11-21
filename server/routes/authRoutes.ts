import crypto from 'crypto';
import { Router } from 'express';
import {
  type AuthenticatedRequest,
  hashPassword,
  requireAuth,
  signToken,
  verifyPassword,
} from '../auth.ts';
import { db } from '../db.ts';

export const authRouter = Router();

function formatUser(row: {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role: 'PASSENGER' | 'ADMIN';
  loyalty_points: number;
}) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    loyaltyPoints: row.loyalty_points,
  };
}

authRouter.post('/register', (req, res) => {
  const { fullName, email, phone, password, confirmPassword } = req.body ?? {};
  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    res.status(400).json({ message: 'Full name must be at least 2 characters.' });
    return;
  }
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400).json({ message: 'Please enter a valid email address.' });
    return;
  }
  if (!phone || typeof phone !== 'string' || !/^[6-9]\d{9}$/.test(phone.trim())) {
    res.status(400).json({ message: 'Please enter a valid 10-digit Indian mobile number.' });
    return;
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    res.status(400).json({ message: 'Password must be at least 6 characters.' });
    return;
  }
  if (confirmPassword !== undefined && password !== confirmPassword) {
    res.status(400).json({ message: 'Passwords do not match.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    res.status(409).json({ message: 'An account with this email already exists.' });
    return;
  }

  const passwordHash = hashPassword(password);
  const result = db
    .prepare(
      `INSERT INTO users (full_name, email, phone, password_hash, role, loyalty_points)
       VALUES (?, ?, ?, ?, 'PASSENGER', 100)`
    )
    .run(fullName.trim(), normalizedEmail, phone.trim(), passwordHash);

  const userId = Number(result.lastInsertRowid);
  const userRow = db
    .prepare('SELECT id, full_name, email, phone, role, loyalty_points FROM users WHERE id = ?')
    .get(userId) as {
    id: number;
    full_name: string;
    email: string;
    phone: string;
    role: 'PASSENGER' | 'ADMIN';
    loyalty_points: number;
  };

  const token = signToken(userId, 'PASSENGER', false);
  res.status(201).json({
    token,
    user: formatUser(userRow),
    message: 'Registration successful. Welcome to BlueLine Express.',
  });
});

authRouter.post('/login', (req, res) => {
  const { email, password, rememberMe } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required.' });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const row = db
    .prepare('SELECT id, full_name, email, phone, password_hash, role, loyalty_points FROM users WHERE email = ?')
    .get(normalizedEmail) as
    | {
        id: number;
        full_name: string;
        email: string;
        phone: string;
        password_hash: string;
        role: 'PASSENGER' | 'ADMIN';
        loyalty_points: number;
      }
    | undefined;

  if (!row || !verifyPassword(String(password), row.password_hash)) {
    res.status(401).json({ message: 'Invalid email or password.' });
    return;
  }

  if (row.role !== 'PASSENGER') {
    res.status(403).json({ message: 'Please use the dedicated Admin Portal to sign in.' });
    return;
  }

  const token = signToken(row.id, row.role, Boolean(rememberMe));
  res.json({
    token,
    user: formatUser(row),
  });
});

authRouter.post('/forgot-password', (req, res) => {
  const { email, phone, newPassword, confirmPassword } = req.body ?? {};
  if (!email || !phone || !newPassword) {
    res.status(400).json({ message: 'Email, registered phone number, and new password are required.' });
    return;
  }
  if (String(newPassword).length < 6) {
    res.status(400).json({ message: 'New password must be at least 6 characters.' });
    return;
  }
  if (confirmPassword !== undefined && newPassword !== confirmPassword) {
    res.status(400).json({ message: 'Passwords do not match.' });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const row = db
    .prepare('SELECT id, phone, role FROM users WHERE email = ?')
    .get(normalizedEmail) as { id: number; phone: string; role: string } | undefined;

  if (!row || row.phone !== String(phone).trim() || row.role !== 'PASSENGER') {
    res.status(400).json({ message: 'Email and registered phone number do not match our records.' });
    return;
  }

  const newHash = hashPassword(String(newPassword));
  db.prepare(`UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`).run(
    newHash,
    row.id
  );

  res.json({ message: 'Password reset successfully. You can now sign in with your new password.' });
});

authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

authRouter.get('/admin-status', (_req, res) => {
  const adminRow = db.prepare(`SELECT id, email FROM users WHERE role = 'ADMIN' LIMIT 1`).get() as
    | { id: number; email: string }
    | undefined;
  const envConfigured = Boolean(process.env.ADMIN_PASSCODE && process.env.ADMIN_PASSCODE.trim().length > 0);
  res.json({
    adminConfigured: Boolean(adminRow) || envConfigured,
    requiresInitialSetup: !adminRow && !envConfigured,
  });
});

authRouter.post('/admin-setup', (req, res) => {
  const envPasscode = process.env.ADMIN_PASSCODE?.trim();
  if (envPasscode) {
    res.status(403).json({ message: 'Admin credentials are managed via server environment configuration.' });
    return;
  }

  const existingAdmin = db.prepare(`SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1`).get();
  if (existingAdmin) {
    res.status(409).json({ message: 'Administrator account has already been initialized.' });
    return;
  }

  const { fullName, email, phone, password, confirmPassword } = req.body ?? {};
  if (!fullName || String(fullName).trim().length < 2) {
    res.status(400).json({ message: 'Admin full name is required.' });
    return;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
    res.status(400).json({ message: 'Please provide a valid admin email.' });
    return;
  }
  if (!password || String(password).length < 8) {
    res.status(400).json({ message: 'Admin password must be at least 8 characters.' });
    return;
  }
  if (password !== confirmPassword) {
    res.status(400).json({ message: 'Admin passwords do not match.' });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const duplicateEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (duplicateEmail) {
    res.status(409).json({ message: 'This email is already registered.' });
    return;
  }

  const passwordHash = hashPassword(String(password));
  const result = db
    .prepare(
      `INSERT INTO users (full_name, email, phone, password_hash, role, loyalty_points)
       VALUES (?, ?, ?, ?, 'ADMIN', 0)`
    )
    .run(String(fullName).trim(), normalizedEmail, String(phone || '9840000000').trim(), passwordHash);

  const adminId = Number(result.lastInsertRowid);
  const adminRow = db
    .prepare('SELECT id, full_name, email, phone, role, loyalty_points FROM users WHERE id = ?')
    .get(adminId) as {
    id: number;
    full_name: string;
    email: string;
    phone: string;
    role: 'PASSENGER' | 'ADMIN';
    loyalty_points: number;
  };

  const token = signToken(adminId, 'ADMIN', false);
  res.status(201).json({
    token,
    user: formatUser(adminRow),
    message: 'Administrator account initialized successfully.',
  });
});

authRouter.post('/admin-login', (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ message: 'Admin email and password are required.' });
    return;
  }

  const envPasscode = process.env.ADMIN_PASSCODE?.trim();
  const normalizedEmail = String(email).trim().toLowerCase();

  if (envPasscode) {
    const incomingBuf = Buffer.from(String(password));
    const expectedBuf = Buffer.from(envPasscode);
    const matchesEnv =
      incomingBuf.length === expectedBuf.length && crypto.timingSafeEqual(incomingBuf, expectedBuf);

    if (matchesEnv) {
      let adminRow = db
        .prepare(`SELECT id, full_name, email, phone, role, loyalty_points FROM users WHERE role = 'ADMIN' AND email = ?`)
        .get(normalizedEmail) as
        | {
            id: number;
            full_name: string;
            email: string;
            phone: string;
            role: 'PASSENGER' | 'ADMIN';
            loyalty_points: number;
          }
        | undefined;

      if (!adminRow) {
        const resInsert = db
          .prepare(
            `INSERT INTO users (full_name, email, phone, password_hash, role, loyalty_points)
             VALUES ('Operations Administrator', ?, '9840000000', ?, 'ADMIN', 0)`
          )
          .run(normalizedEmail, hashPassword(crypto.randomBytes(24).toString('hex')));
        adminRow = db
          .prepare('SELECT id, full_name, email, phone, role, loyalty_points FROM users WHERE id = ?')
          .get(Number(resInsert.lastInsertRowid)) as typeof adminRow;
      }

      if (adminRow) {
        const token = signToken(adminRow.id, 'ADMIN', false);
        res.json({ token, user: formatUser(adminRow) });
        return;
      }
    }
  }

  const row = db
    .prepare(
      `SELECT id, full_name, email, phone, password_hash, role, loyalty_points
       FROM users WHERE email = ? AND role = 'ADMIN'`
    )
    .get(normalizedEmail) as
    | {
        id: number;
        full_name: string;
        email: string;
        phone: string;
        password_hash: string;
        role: 'PASSENGER' | 'ADMIN';
        loyalty_points: number;
      }
    | undefined;

  if (!row || !verifyPassword(String(password), row.password_hash)) {
    res.status(401).json({ message: 'Invalid administrator credentials.' });
    return;
  }

  const token = signToken(row.id, 'ADMIN', false);
  res.json({ token, user: formatUser(row) });
});

// Sandbox passenger session for instant project evaluation with pre-populated journeys
authRouter.post('/demo-passenger', (_req, res) => {
  const demoEmail = 'arjun.sandbox@blueline.local';
  let userRow = db
    .prepare('SELECT id, full_name, email, phone, role, loyalty_points FROM users WHERE email = ?')
    .get(demoEmail) as
    | {
        id: number;
        full_name: string;
        email: string;
        phone: string;
        role: 'PASSENGER' | 'ADMIN';
        loyalty_points: number;
      }
    | undefined;

  if (!userRow) {
    const randomPassHash = hashPassword(crypto.randomBytes(24).toString('hex'));
    const insertUser = db
      .prepare(
        `INSERT INTO users (full_name, email, phone, password_hash, role, loyalty_points)
         VALUES ('Arjun Subramanian', ?, '9840123456', ?, 'PASSENGER', 450)`
      )
      .run(demoEmail, randomPassHash);
    const userId = Number(insertUser.lastInsertRowid);

    const buses = db.prepare(`SELECT id, journey_date, fare FROM buses WHERE status = 'ACTIVE' ORDER BY id ASC LIMIT 3`).all() as Array<{
      id: number;
      journey_date: string;
      fare: number;
    }>;

    if (buses.length >= 2) {
      db.exec('BEGIN TRANSACTION');
      try {
        // 1. Confirmed upcoming booking
        const seat1 = db
          .prepare(`SELECT id, seat_number, price FROM seats WHERE bus_id = ? AND status = 'AVAILABLE' LIMIT 1`)
          .get(buses[0].id) as { id: number; seat_number: string; price: number } | undefined;

        if (seat1) {
          const ref1 = `BLX${Date.now().toString().slice(-6)}A1`;
          const b1 = db
            .prepare(
              `INSERT INTO bookings (booking_reference, user_id, bus_id, total_fare, passenger_count, status, journey_date)
               VALUES (?, ?, ?, ?, 1, 'CONFIRMED', ?)`
            )
            .run(ref1, userId, buses[0].id, seat1.price, buses[0].journey_date);
          const b1Id = Number(b1.lastInsertRowid);
          db.prepare(
            `INSERT INTO passenger_details (booking_id, seat_id, seat_number, passenger_name, age, gender, contact_phone)
             VALUES (?, ?, ?, 'Arjun Subramanian', 24, 'MALE', '9840123456')`
          ).run(b1Id, seat1.id, seat1.seat_number);
          db.prepare(`UPDATE seats SET status = 'BOOKED' WHERE id = ?`).run(seat1.id);
          db.prepare(
            `INSERT INTO payments (booking_id, transaction_reference, payment_method, amount, status, gateway_note)
             VALUES (?, ?, 'UPI', ?, 'SUCCESS', 'Simulated UPI Payment Verified')`
          ).run(b1Id, `TXN${crypto.randomBytes(4).toString('hex').toUpperCase()}`, seat1.price);
        }

        // 2. Completed historical booking
        const seat2 = db
          .prepare(`SELECT id, seat_number, price FROM seats WHERE bus_id = ? AND status = 'AVAILABLE' LIMIT 1`)
          .get(buses[1].id) as { id: number; seat_number: string; price: number } | undefined;

        if (seat2) {
          const pastDate = new Date(Date.now() - 86400000 * 5).toISOString().slice(0, 10);
          const ref2 = `BLX${Date.now().toString().slice(-6)}C2`;
          const b2 = db
            .prepare(
              `INSERT INTO bookings (booking_reference, user_id, bus_id, total_fare, passenger_count, status, journey_date)
               VALUES (?, ?, ?, ?, 1, 'COMPLETED', ?)`
            )
            .run(ref2, userId, buses[1].id, seat2.price, pastDate);
          const b2Id = Number(b2.lastInsertRowid);
          db.prepare(
            `INSERT INTO passenger_details (booking_id, seat_id, seat_number, passenger_name, age, gender, contact_phone)
             VALUES (?, ?, ?, 'Arjun Subramanian', 24, 'MALE', '9840123456')`
          ).run(b2Id, seat2.id, seat2.seat_number);
          db.prepare(
            `INSERT INTO payments (booking_id, transaction_reference, payment_method, amount, status, gateway_note)
             VALUES (?, ?, 'DEBIT_CARD', ?, 'SUCCESS', 'Simulated Card Payment Verified')`
          ).run(b2Id, `TXN${crypto.randomBytes(4).toString('hex').toUpperCase()}`, seat2.price);
        }

        // 3. Cancelled booking with history
        if (buses[2]) {
          const seat3 = db
            .prepare(`SELECT id, seat_number, price FROM seats WHERE bus_id = ? AND status = 'AVAILABLE' LIMIT 1`)
            .get(buses[2].id) as { id: number; seat_number: string; price: number } | undefined;
          if (seat3) {
            const ref3 = `BLX${Date.now().toString().slice(-6)}X3`;
            const b3 = db
              .prepare(
                `INSERT INTO bookings (booking_reference, user_id, bus_id, total_fare, passenger_count, status, journey_date, cancelled_at, cancellation_reason)
                 VALUES (?, ?, ?, ?, 1, 'CANCELLED', ?, datetime('now', '-1 day'), 'Change in travel plans')`
              )
              .run(ref3, userId, buses[2].id, seat3.price, buses[2].journey_date);
            const b3Id = Number(b3.lastInsertRowid);
            db.prepare(
              `INSERT INTO passenger_details (booking_id, seat_id, seat_number, passenger_name, age, gender, contact_phone)
               VALUES (?, ?, ?, 'Arjun Subramanian', 24, 'MALE', '9840123456')`
            ).run(b3Id, seat3.id, seat3.seat_number);
            db.prepare(
              `INSERT INTO payments (booking_id, transaction_reference, payment_method, amount, status, gateway_note)
               VALUES (?, ?, 'NET_BANKING', ?, 'REFUNDED', 'Refunded per 85% cancellation policy')`
            ).run(b3Id, `TXN${crypto.randomBytes(4).toString('hex').toUpperCase()}`, seat3.price);
            db.prepare(
              `INSERT INTO cancellations (booking_id, user_id, booking_reference, reason, refund_amount, refund_status, cancellation_status, cancelled_at)
               VALUES (?, ?, ?, 'Change in travel plans', ?, 'PROCESSED', 'CANCELLED', datetime('now', '-1 day'))`
            ).run(b3Id, userId, ref3, Math.round(seat3.price * 0.85));
          }
        }
        db.exec('COMMIT');
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    }

    userRow = db
      .prepare('SELECT id, full_name, email, phone, role, loyalty_points FROM users WHERE id = ?')
      .get(userId) as typeof userRow;
  }

  if (!userRow) {
    res.status(500).json({ message: 'Unable to initialize demo passenger session.' });
    return;
  }

  const token = signToken(userRow.id, 'PASSENGER', false);
  res.json({ token, user: formatUser(userRow) });
});
