import crypto from 'crypto';
import { Router } from 'express';
import { type AuthenticatedRequest, requireAuth } from '../auth.ts';
import { db } from '../db.ts';

export const bookingRouter = Router();
export const cancellationRouter = Router();

function computeRefundPolicy(journeyDate: string, totalFare: number): { refundPercentage: number; refundAmount: number; policyLabel: string } {
  const todayStr = new Date().toISOString().slice(0, 10);
  const journeyMs = new Date(`${journeyDate}T00:00:00Z`).getTime();
  const todayMs = new Date(`${todayStr}T00:00:00Z`).getTime();
  const diffDays = Math.ceil((journeyMs - todayMs) / (1000 * 60 * 60 * 24));

  if (diffDays >= 2) {
    return {
      refundPercentage: 85,
      refundAmount: Math.round(totalFare * 0.85),
      policyLabel: '85% refund (cancelled 2+ days before journey)',
    };
  }
  if (diffDays >= 1) {
    return {
      refundPercentage: 70,
      refundAmount: Math.round(totalFare * 0.7),
      policyLabel: '70% refund (cancelled 24 hours before journey)',
    };
  }
  return {
    refundPercentage: 50,
    refundAmount: Math.round(totalFare * 0.5),
    policyLabel: '50% refund (same-day cancellation)',
  };
}

function hydrateBooking(bookingId: number) {
  const row = db
    .prepare(
      `SELECT bk.*, b.bus_name, b.registration_number, b.origin_district, b.destination_district,
              b.departure_time, b.arrival_time, b.duration, b.ac_type, b.seat_category,
              u.full_name AS user_name, u.email AS user_email, u.phone AS user_phone,
              p.transaction_reference, p.payment_method, p.amount AS paid_amount, p.status AS payment_status, p.gateway_note, p.paid_at,
              c.id AS cancellation_id, c.refund_amount, c.refund_status, c.cancellation_status
       FROM bookings bk
       JOIN buses b ON b.id = bk.bus_id
       JOIN users u ON u.id = bk.user_id
       LEFT JOIN payments p ON p.booking_id = bk.id
       LEFT JOIN cancellations c ON c.booking_id = bk.id
       WHERE bk.id = ?`
    )
    .get(bookingId) as Record<string, unknown> | undefined;

  if (!row) return null;

  const passengers = db
    .prepare(
      `SELECT id, seat_id, seat_number, passenger_name, age, gender, contact_phone
       FROM passenger_details WHERE booking_id = ? ORDER BY id ASC`
    )
    .all(bookingId) as Array<{
    id: number;
    seat_id: number;
    seat_number: string;
    passenger_name: string;
    age: number;
    gender: string;
    contact_phone: string;
  }>;

  const refundPreview = computeRefundPolicy(String(row.journey_date), Number(row.total_fare));

  return {
    id: row.id,
    bookingReference: row.booking_reference,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    userPhone: row.user_phone,
    busId: row.bus_id,
    busName: row.bus_name,
    registrationNumber: row.registration_number,
    originDistrict: row.origin_district,
    destinationDistrict: row.destination_district,
    journeyDate: row.journey_date,
    departureTime: row.departure_time,
    arrivalTime: row.arrival_time,
    duration: row.duration,
    acType: row.ac_type,
    seatCategory: row.seat_category,
    totalFare: row.total_fare,
    passengerCount: row.passenger_count,
    status: row.status,
    bookingDate: row.booking_date,
    cancelledAt: row.cancelled_at,
    cancellationReason: row.cancellation_reason,
    refundPolicy: refundPreview,
    payment: row.transaction_reference
      ? {
          transactionReference: row.transaction_reference,
          paymentMethod: row.payment_method,
          amount: row.paid_amount,
          status: row.payment_status,
          gatewayNote: row.gateway_note,
          paidAt: row.paid_at,
        }
      : null,
    cancellation: row.cancellation_id
      ? {
          id: row.cancellation_id,
          refundAmount: row.refund_amount,
          refundStatus: row.refund_status,
          cancellationStatus: row.cancellation_status,
          cancelledAt: row.cancelled_at,
          reason: row.cancellation_reason,
        }
      : null,
    passengers: passengers.map((p) => ({
      id: p.id,
      seatId: p.seat_id,
      seatNumber: p.seat_number,
      passengerName: p.passenger_name,
      age: p.age,
      gender: p.gender,
      contactPhone: p.contact_phone,
    })),
  };
}

bookingRouter.post('/', requireAuth, (req: AuthenticatedRequest, res) => {
  const { busId, seatIds, passengers, paymentMethod, simulateFailure } = req.body ?? {};
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized.' });
    return;
  }

  const parsedBusId = Number(busId);
  if (!Number.isInteger(parsedBusId) || parsedBusId <= 0) {
    res.status(400).json({ message: 'Valid bus ID is required.' });
    return;
  }
  if (!Array.isArray(seatIds) || seatIds.length === 0 || seatIds.length > 6) {
    res.status(400).json({ message: 'Select between 1 and 6 seats per booking.' });
    return;
  }
  if (!Array.isArray(passengers) || passengers.length !== seatIds.length) {
    res.status(400).json({ message: 'Passenger details must be provided for every selected seat.' });
    return;
  }

  const validMethods = new Set(['UPI', 'DEBIT_CARD', 'CREDIT_CARD', 'NET_BANKING']);
  if (!validMethods.has(String(paymentMethod))) {
    res.status(400).json({ message: 'Please choose a valid payment method.' });
    return;
  }

  for (const p of passengers) {
    if (!p?.passengerName || String(p.passengerName).trim().length < 2) {
      res.status(400).json({ message: 'Each passenger must have a valid name.' });
      return;
    }
    const age = Number(p.age);
    if (!Number.isInteger(age) || age < 1 || age > 120) {
      res.status(400).json({ message: 'Passenger age must be between 1 and 120.' });
      return;
    }
    if (!['MALE', 'FEMALE', 'OTHER'].includes(String(p.gender))) {
      res.status(400).json({ message: 'Valid passenger gender is required.' });
      return;
    }
    if (!p.contactPhone || !/^[6-9]\d{9}$/.test(String(p.contactPhone).trim())) {
      res.status(400).json({ message: 'Each passenger requires a valid 10-digit contact number.' });
      return;
    }
  }

  if (simulateFailure === true) {
    res.status(402).json({
      message: 'Demo payment declined by simulated gateway. No seats were reserved and no charges apply.',
    });
    return;
  }

  const uniqueSeatIds = [...new Set(seatIds.map((id: unknown) => Number(id)))];
  if (uniqueSeatIds.length !== seatIds.length) {
    res.status(400).json({ message: 'Duplicate seat selection detected.' });
    return;
  }

  const busRow = db
    .prepare(`SELECT id, journey_date, status FROM buses WHERE id = ?`)
    .get(parsedBusId) as { id: number; journey_date: string; status: string } | undefined;

  if (!busRow || busRow.status !== 'ACTIVE') {
    res.status(404).json({ message: 'Selected bus schedule is not available for booking.' });
    return;
  }

  db.exec('BEGIN IMMEDIATE TRANSACTION');
  try {
    const seatPlaceholders = uniqueSeatIds.map(() => '?').join(',');
    const seatRows = db
      .prepare(
        `SELECT id, seat_number, status, price FROM seats WHERE bus_id = ? AND id IN (${seatPlaceholders})`
      )
      .all(parsedBusId, ...uniqueSeatIds) as Array<{
      id: number;
      seat_number: string;
      status: string;
      price: number;
    }>;

    if (seatRows.length !== uniqueSeatIds.length) {
      db.exec('ROLLBACK');
      res.status(400).json({ message: 'One or more selected seats do not belong to this bus.' });
      return;
    }

    const unavailable = seatRows.filter((s) => s.status !== 'AVAILABLE');
    if (unavailable.length > 0) {
      db.exec('ROLLBACK');
      res.status(409).json({
        message: `Seat(s) ${unavailable.map((s) => s.seat_number).join(', ')} are no longer available. Please refresh seat layout.`,
      });
      return;
    }

    const totalFare = seatRows.reduce((sum, s) => sum + Number(s.price), 0);
    const bookingReference = `BLX${Date.now().toString().slice(-6)}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const insertBooking = db
      .prepare(
        `INSERT INTO bookings (booking_reference, user_id, bus_id, total_fare, passenger_count, status, journey_date)
         VALUES (?, ?, ?, ?, ?, 'CONFIRMED', ?)`
      )
      .run(bookingReference, req.user.id, parsedBusId, totalFare, seatRows.length, busRow.journey_date);

    const bookingId = Number(insertBooking.lastInsertRowid);

    const seatById = new Map(seatRows.map((s) => [s.id, s]));
    const insertPassenger = db.prepare(
      `INSERT INTO passenger_details (booking_id, seat_id, seat_number, passenger_name, age, gender, contact_phone)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    const markBooked = db.prepare(`UPDATE seats SET status = 'BOOKED' WHERE id = ? AND status = 'AVAILABLE'`);

    for (const p of passengers) {
      const sId = Number(p.seatId);
      const seat = seatById.get(sId);
      if (!seat) {
        db.exec('ROLLBACK');
        res.status(400).json({ message: 'Passenger seat assignment mismatch.' });
        return;
      }
      const updateResult = markBooked.run(sId);
      if (updateResult.changes !== 1) {
        db.exec('ROLLBACK');
        res.status(409).json({ message: `Seat ${seat.seat_number} was booked concurrently. Please retry.` });
        return;
      }
      insertPassenger.run(
        bookingId,
        sId,
        seat.seat_number,
        String(p.passengerName).trim(),
        Number(p.age),
        String(p.gender),
        String(p.contactPhone).trim()
      );
    }

    const txnRef = `TXN${Date.now().toString().slice(-5)}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    db.prepare(
      `INSERT INTO payments (booking_id, transaction_reference, payment_method, amount, status, gateway_note)
       VALUES (?, ?, ?, ?, 'SUCCESS', ?)`
    ).run(
      bookingId,
      txnRef,
      String(paymentMethod),
      totalFare,
      `Simulated ${String(paymentMethod).replace('_', ' ')} gateway demo payment (no real money charged)`
    );

    const earnedPoints = Math.max(10, Math.round(totalFare / 20));
    db.prepare(`UPDATE users SET loyalty_points = loyalty_points + ?, updated_at = datetime('now') WHERE id = ?`).run(
      earnedPoints,
      req.user.id
    );

    db.exec('COMMIT');

    const hydrated = hydrateBooking(bookingId);
    res.status(201).json({
      booking: hydrated,
      message: 'Demo payment verified and booking confirmed.',
    });
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Booking creation error:', err);
    res.status(500).json({ message: 'Failed to complete reservation.' });
  }
});

bookingRouter.get('/user/:userId', requireAuth, (req: AuthenticatedRequest, res) => {
  const targetUserId = Number(req.params.userId);
  if (!req.user || (req.user.id !== targetUserId && req.user.role !== 'ADMIN')) {
    res.status(403).json({ message: 'Unauthorized to view another passenger’s bookings.' });
    return;
  }

  const rows = db
    .prepare(`SELECT id FROM bookings WHERE user_id = ? ORDER BY created_at DESC, id DESC`)
    .all(targetUserId) as Array<{ id: number }>;

  res.json(rows.map((r) => hydrateBooking(r.id)).filter(Boolean));
});

bookingRouter.get('/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const bookingId = Number(req.params.id);
  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    res.status(400).json({ message: 'Invalid booking ID.' });
    return;
  }

  const booking = hydrateBooking(bookingId);
  if (!booking) {
    res.status(404).json({ message: 'Booking not found.' });
    return;
  }

  if (!req.user || (booking.userId !== req.user.id && req.user.role !== 'ADMIN')) {
    res.status(403).json({ message: 'Unauthorized access to booking record.' });
    return;
  }

  res.json(booking);
});

function executeCancellation(bookingId: number, requestingUserId: number, isAdmin: boolean, reason: string) {
  const existing = db
    .prepare('SELECT id, user_id, booking_reference, total_fare, status, journey_date FROM bookings WHERE id = ?')
    .get(bookingId) as
    | {
        id: number;
        user_id: number;
        booking_reference: string;
        total_fare: number;
        status: string;
        journey_date: string;
      }
    | undefined;

  if (!existing) {
    return { status: 404, body: { message: 'Booking not found.' } };
  }
  if (existing.user_id !== requestingUserId && !isAdmin) {
    return { status: 403, body: { message: 'You are not authorized to cancel this booking.' } };
  }
  if (existing.status === 'CANCELLED') {
    return { status: 400, body: { message: 'This booking has already been cancelled.' } };
  }
  if (existing.status === 'COMPLETED') {
    return { status: 400, body: { message: 'Completed journeys cannot be cancelled.' } };
  }

  const cleanReason = reason.trim();
  if (cleanReason.length < 3) {
    return { status: 400, body: { message: 'Please provide a brief reason for cancellation.' } };
  }

  const policy = computeRefundPolicy(existing.journey_date, existing.total_fare);

  db.exec('BEGIN IMMEDIATE TRANSACTION');
  try {
    db.prepare(
      `UPDATE bookings
       SET status = 'CANCELLED',
           cancelled_at = datetime('now'),
           cancellation_reason = ?,
           updated_at = datetime('now')
       WHERE id = ?`
    ).run(cleanReason, bookingId);

    const seatsToRelease = db
      .prepare('SELECT seat_id FROM passenger_details WHERE booking_id = ?')
      .all(bookingId) as Array<{ seat_id: number }>;

    const releaseSeat = db.prepare(`UPDATE seats SET status = 'AVAILABLE' WHERE id = ? AND status = 'BOOKED'`);
    for (const s of seatsToRelease) {
      releaseSeat.run(s.seat_id);
    }

    db.prepare(
      `UPDATE payments SET status = 'REFUNDED', gateway_note = ? WHERE booking_id = ?`
    ).run(`Refund of INR ${policy.refundAmount} (${policy.policyLabel})`, bookingId);

    db.prepare(
      `INSERT INTO cancellations (booking_id, user_id, booking_reference, reason, refund_amount, refund_status, cancellation_status)
       VALUES (?, ?, ?, ?, ?, 'PROCESSED', 'CANCELLED')`
    ).run(bookingId, existing.user_id, existing.booking_reference, cleanReason, policy.refundAmount);

    db.exec('COMMIT');
    const updatedBooking = hydrateBooking(bookingId);
    return {
      status: 200,
      body: {
        message: 'Booking cancelled successfully and seats released.',
        booking: updatedBooking,
        cancellation: updatedBooking?.cancellation ?? null,
      },
    };
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Cancellation error:', err);
    return { status: 500, body: { message: 'Failed to process cancellation.' } };
  }
}

bookingRouter.put('/:id/cancel', requireAuth, (req: AuthenticatedRequest, res) => {
  const bookingId = Number(req.params.id);
  const reason = typeof req.body?.reason === 'string' ? req.body.reason : '';
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized.' });
    return;
  }
  const result = executeCancellation(bookingId, req.user.id, req.user.role === 'ADMIN', reason);
  res.status(result.status).json(result.body);
});

bookingRouter.get('/:id/ticket-file', requireAuth, (req: AuthenticatedRequest, res) => {
  const bookingId = Number(req.params.id);
  const booking = hydrateBooking(bookingId);
  if (!booking) {
    res.status(404).json({ message: 'Booking not found.' });
    return;
  }
  if (!req.user || (booking.userId !== req.user.id && req.user.role !== 'ADMIN')) {
    res.status(403).json({ message: 'Unauthorized.' });
    return;
  }

  const lines = [
    '============================================================',
    '               BLUELINE EXPRESS - E-TICKET RECEIPT          ',
    '             "Your Journey, Our Priority."                  ',
    '============================================================',
    `Booking Reference : ${booking.bookingReference}`,
    `Booking Status    : ${booking.status}`,
    `Booking Date      : ${booking.bookingDate}`,
    '------------------------------------------------------------',
    `Bus Service       : ${booking.busName}`,
    `Registration No   : ${booking.registrationNumber}`,
    `Route             : ${booking.originDistrict} -> ${booking.destinationDistrict}`,
    `Journey Date      : ${booking.journeyDate}`,
    `Departure / Arr   : ${booking.departureTime} -> ${booking.arrivalTime} (${booking.duration})`,
    `Coach Category    : ${booking.acType} | ${booking.seatCategory}`,
    '------------------------------------------------------------',
    'PASSENGER MANIFEST:',
    ...booking.passengers.map(
      (p, i) =>
        `  ${i + 1}. Seat ${p.seatNumber} | ${p.passengerName} (${p.age} yrs, ${p.gender}) | Ph: ${p.contactPhone}`
    ),
    '------------------------------------------------------------',
    `Total Fare Paid   : INR ${booking.totalFare}`,
    booking.payment
      ? `Payment Method    : ${booking.payment.paymentMethod} | Txn Ref: ${booking.payment.transactionReference} (${booking.payment.status})`
      : 'Payment Method    : Pending',
    ...(booking.cancellation
      ? [
          '------------------------------------------------------------',
          `Cancelled At      : ${booking.cancellation.cancelledAt}`,
          `Reason            : ${booking.cancellation.reason}`,
          `Refund Amount     : INR ${booking.cancellation.refundAmount} (${booking.cancellation.refundStatus})`,
        ]
      : []),
    '============================================================',
    'Note: Demo academic reservation system receipt.',
  ];

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="BlueLine_Ticket_${booking.bookingReference}.txt"`);
  res.send(lines.join('\n'));
});

cancellationRouter.post('/:bookingId/confirm', requireAuth, (req: AuthenticatedRequest, res) => {
  const bookingId = Number(req.params.bookingId);
  const reason = typeof req.body?.reason === 'string' ? req.body.reason : '';
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized.' });
    return;
  }
  const result = executeCancellation(bookingId, req.user.id, req.user.role === 'ADMIN', reason);
  res.status(result.status).json(result.body);
});

cancellationRouter.get('/user/:userId', requireAuth, (req: AuthenticatedRequest, res) => {
  const targetUserId = Number(req.params.userId);
  if (!req.user || (req.user.id !== targetUserId && req.user.role !== 'ADMIN')) {
    res.status(403).json({ message: 'Unauthorized to view another passenger’s cancellation history.' });
    return;
  }

  const rows = db
    .prepare(
      `SELECT c.*, bk.journey_date, bk.passenger_count, bk.total_fare,
              b.bus_name, b.registration_number, b.origin_district, b.destination_district
       FROM cancellations c
       JOIN bookings bk ON bk.id = c.booking_id
       JOIN buses b ON b.id = bk.bus_id
       WHERE c.user_id = ?
       ORDER BY c.cancelled_at DESC, c.id DESC`
    )
    .all(targetUserId) as Array<Record<string, unknown>>;

  res.json(
    rows.map((r) => ({
      id: r.id,
      bookingId: r.booking_id,
      userId: r.user_id,
      bookingReference: r.booking_reference,
      busName: r.bus_name,
      registrationNumber: r.registration_number,
      originDistrict: r.origin_district,
      destinationDistrict: r.destination_district,
      journeyDate: r.journey_date,
      passengerCount: r.passenger_count,
      totalFare: r.total_fare,
      reason: r.reason,
      refundAmount: r.refund_amount,
      refundStatus: r.refund_status,
      cancellationStatus: r.cancellation_status,
      cancelledAt: r.cancelled_at,
    }))
  );
});

cancellationRouter.get('/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const cancellationId = Number(req.params.id);
  const row = db
    .prepare(
      `SELECT c.*, bk.journey_date, bk.passenger_count, bk.total_fare,
              b.bus_name, b.registration_number, b.origin_district, b.destination_district
       FROM cancellations c
       JOIN bookings bk ON bk.id = c.booking_id
       JOIN buses b ON b.id = bk.bus_id
       WHERE c.id = ?`
    )
    .get(cancellationId) as Record<string, unknown> | undefined;

  if (!row) {
    res.status(404).json({ message: 'Cancellation record not found.' });
    return;
  }
  if (!req.user || (Number(row.user_id) !== req.user.id && req.user.role !== 'ADMIN')) {
    res.status(403).json({ message: 'Unauthorized.' });
    return;
  }

  res.json({
    id: row.id,
    bookingId: row.booking_id,
    userId: row.user_id,
    bookingReference: row.booking_reference,
    busName: row.bus_name,
    registrationNumber: row.registration_number,
    originDistrict: row.origin_district,
    destinationDistrict: row.destination_district,
    journeyDate: row.journey_date,
    passengerCount: row.passenger_count,
    totalFare: row.total_fare,
    reason: row.reason,
    refundAmount: row.refund_amount,
    refundStatus: row.refund_status,
    cancellationStatus: row.cancellation_status,
    cancelledAt: row.cancelled_at,
  });
});
