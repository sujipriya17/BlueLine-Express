import { Router } from 'express';
import { requireAdmin } from '../auth.ts';
import { db, generateSeatsForBus } from '../db.ts';

export const adminRouter = Router();

adminRouter.use(requireAdmin);

adminRouter.get('/stats', (_req, res) => {
  const totalBuses = (db.prepare('SELECT COUNT(*) AS cnt FROM buses').get() as { cnt: number }).cnt;
  const totalRoutes = (db.prepare('SELECT COUNT(*) AS cnt FROM routes').get() as { cnt: number }).cnt;
  const totalPassengers = (db.prepare(`SELECT COUNT(*) AS cnt FROM users WHERE role = 'PASSENGER'`).get() as { cnt: number }).cnt;
  const totalBookings = (db.prepare('SELECT COUNT(*) AS cnt FROM bookings').get() as { cnt: number }).cnt;
  const confirmedBookings = (db.prepare(`SELECT COUNT(*) AS cnt FROM bookings WHERE status = 'CONFIRMED'`).get() as { cnt: number }).cnt;
  const cancelledBookings = (db.prepare(`SELECT COUNT(*) AS cnt FROM bookings WHERE status = 'CANCELLED'`).get() as { cnt: number }).cnt;
  const completedBookings = (db.prepare(`SELECT COUNT(*) AS cnt FROM bookings WHERE status = 'COMPLETED'`).get() as { cnt: number }).cnt;
  const revenueRow = db
    .prepare(
      `SELECT COALESCE(SUM(total_fare), 0) AS revenue
       FROM bookings WHERE status IN ('CONFIRMED', 'COMPLETED')`
    )
    .get() as { revenue: number };

  const routeRevenue = db
    .prepare(
      `SELECT b.origin_district || ' → ' || b.destination_district AS route_label,
              COUNT(bk.id) AS booking_count,
              COALESCE(SUM(CASE WHEN bk.status IN ('CONFIRMED','COMPLETED') THEN bk.total_fare ELSE 0 END), 0) AS revenue
       FROM buses b
       LEFT JOIN bookings bk ON bk.bus_id = b.id
       GROUP BY b.origin_district, b.destination_district
       ORDER BY revenue DESC
       LIMIT 6`
    )
    .all() as Array<{ route_label: string; booking_count: number; revenue: number }>;

  res.json({
    totalBuses,
    totalRoutes,
    totalPassengers,
    totalBookings,
    confirmedBookings,
    cancelledBookings,
    completedBookings,
    totalRevenue: revenueRow.revenue,
    routeRevenue: routeRevenue.map((r) => ({
      routeLabel: r.route_label,
      bookingCount: r.booking_count,
      revenue: r.revenue,
    })),
  });
});

// Buses CRUD
adminRouter.get('/buses', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT b.*,
              (SELECT COUNT(*) FROM seats s WHERE s.bus_id = b.id AND s.status = 'AVAILABLE') AS available_seats
       FROM buses b
       ORDER BY b.journey_date DESC, b.id DESC`
    )
    .all() as Array<Record<string, unknown>>;

  res.json(
    rows.map((r) => ({
      id: r.id,
      routeId: r.route_id,
      busName: r.bus_name,
      registrationNumber: r.registration_number,
      originDistrict: r.origin_district,
      destinationDistrict: r.destination_district,
      journeyDate: r.journey_date,
      departureTime: r.departure_time,
      arrivalTime: r.arrival_time,
      duration: r.duration,
      acType: r.ac_type,
      seatCategory: r.seat_category,
      totalSeats: r.total_seats,
      availableSeats: r.available_seats,
      fare: r.fare,
      rating: r.rating,
      status: r.status,
    }))
  );
});

adminRouter.post('/buses', (req, res) => {
  const {
    busName,
    registrationNumber,
    originDistrict,
    destinationDistrict,
    journeyDate,
    departureTime,
    arrivalTime,
    duration,
    acType,
    seatCategory,
    totalSeats,
    fare,
    rating,
    status,
  } = req.body ?? {};

  if (!busName || !registrationNumber || !originDistrict || !destinationDistrict || !journeyDate || !departureTime || !arrivalTime) {
    res.status(400).json({ message: 'All primary bus schedule fields are required.' });
    return;
  }
  if (String(originDistrict).trim().toLowerCase() === String(destinationDistrict).trim().toLowerCase()) {
    res.status(400).json({ message: 'Origin and destination districts cannot be identical.' });
    return;
  }

  const seatsCount = Math.min(60, Math.max(12, Number(totalSeats) || 30));
  const busFare = Math.max(100, Number(fare) || 500);
  const busRating = Math.min(5, Math.max(1, Number(rating) || 4.6));
  const regNum = String(registrationNumber).trim().toUpperCase();

  const dup = db.prepare('SELECT id FROM buses WHERE registration_number = ?').get(regNum);
  if (dup) {
    res.status(409).json({ message: 'A bus schedule with this registration number already exists.' });
    return;
  }

  const routeMatch = db
    .prepare('SELECT id FROM routes WHERE origin_district = ? AND destination_district = ? LIMIT 1')
    .get(String(originDistrict).trim(), String(destinationDistrict).trim()) as { id: number } | undefined;

  const cat = ['SEATER', 'SLEEPER', 'SEATER_SLEEPER'].includes(String(seatCategory))
    ? (String(seatCategory) as 'SEATER' | 'SLEEPER' | 'SEATER_SLEEPER')
    : 'SLEEPER';

  db.exec('BEGIN IMMEDIATE TRANSACTION');
  try {
    const insertRes = db
      .prepare(
        `INSERT INTO buses (
          route_id, bus_name, registration_number, origin_district, destination_district,
          journey_date, departure_time, arrival_time, duration, ac_type, seat_category,
          total_seats, fare, rating, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        routeMatch?.id ?? null,
        String(busName).trim(),
        regNum,
        String(originDistrict).trim(),
        String(destinationDistrict).trim(),
        String(journeyDate).trim(),
        String(departureTime).trim(),
        String(arrivalTime).trim(),
        String(duration || '6h 30m').trim(),
        acType === 'NON_AC' ? 'NON_AC' : 'AC',
        cat,
        seatsCount,
        busFare,
        busRating,
        ['ACTIVE', 'INACTIVE', 'CANCELLED'].includes(String(status)) ? String(status) : 'ACTIVE'
      );

    const busId = Number(insertRes.lastInsertRowid);
    generateSeatsForBus(busId, cat, seatsCount, busFare);
    db.exec('COMMIT');

    res.status(201).json({ id: busId, message: 'Bus schedule and seat layout created successfully.' });
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Create bus error:', err);
    res.status(500).json({ message: 'Failed to create bus schedule.' });
  }
});

adminRouter.put('/buses/:id', (req, res) => {
  const busId = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM buses WHERE id = ?').get(busId) as Record<string, unknown> | undefined;
  if (!existing) {
    res.status(404).json({ message: 'Bus schedule not found.' });
    return;
  }

  const {
    busName,
    registrationNumber,
    originDistrict,
    destinationDistrict,
    journeyDate,
    departureTime,
    arrivalTime,
    duration,
    acType,
    seatCategory,
    totalSeats,
    fare,
    rating,
    status,
  } = req.body ?? {};

  const nextOrigin = String(originDistrict ?? existing.origin_district).trim();
  const nextDest = String(destinationDistrict ?? existing.destination_district).trim();
  if (nextOrigin.toLowerCase() === nextDest.toLowerCase()) {
    res.status(400).json({ message: 'Origin and destination districts cannot be the same.' });
    return;
  }

  const nextFare = Math.max(100, Number(fare ?? existing.fare));
  const nextReg = String(registrationNumber ?? existing.registration_number).trim().toUpperCase();
  const regConflict = db
    .prepare('SELECT id FROM buses WHERE registration_number = ? AND id != ?')
    .get(nextReg, busId);
  if (regConflict) {
    res.status(409).json({ message: 'Registration number is already assigned to another bus.' });
    return;
  }

  db.prepare(
    `UPDATE buses
     SET bus_name = ?, registration_number = ?, origin_district = ?, destination_district = ?,
         journey_date = ?, departure_time = ?, arrival_time = ?, duration = ?,
         ac_type = ?, seat_category = ?, total_seats = ?, fare = ?, rating = ?, status = ?,
         updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    String(busName ?? existing.bus_name).trim(),
    nextReg,
    nextOrigin,
    nextDest,
    String(journeyDate ?? existing.journey_date).trim(),
    String(departureTime ?? existing.departure_time).trim(),
    String(arrivalTime ?? existing.arrival_time).trim(),
    String(duration ?? existing.duration).trim(),
    acType === 'NON_AC' ? 'NON_AC' : 'AC',
    ['SEATER', 'SLEEPER', 'SEATER_SLEEPER'].includes(String(seatCategory)) ? String(seatCategory) : String(existing.seat_category),
    Math.min(60, Math.max(12, Number(totalSeats ?? existing.total_seats))),
    nextFare,
    Math.min(5, Math.max(1, Number(rating ?? existing.rating))),
    ['ACTIVE', 'INACTIVE', 'CANCELLED'].includes(String(status)) ? String(status) : String(existing.status),
    busId
  );

  // Sync available seat prices with updated fare
  db.prepare(`UPDATE seats SET price = ? WHERE bus_id = ? AND status = 'AVAILABLE'`).run(nextFare, busId);

  res.json({ message: 'Bus schedule updated successfully.' });
});

adminRouter.delete('/buses/:id', (req, res) => {
  const busId = Number(req.params.id);
  const activeBooking = db
    .prepare(`SELECT id FROM bookings WHERE bus_id = ? AND status = 'CONFIRMED' LIMIT 1`)
    .get(busId);
  if (activeBooking) {
    res.status(409).json({
      message: 'Cannot delete a bus that has active confirmed bookings. Set status to INACTIVE instead.',
    });
    return;
  }
  const del = db.prepare('DELETE FROM buses WHERE id = ?').run(busId);
  if (del.changes === 0) {
    res.status(404).json({ message: 'Bus schedule not found.' });
    return;
  }
  res.json({ message: 'Bus schedule deleted successfully.' });
});

// Routes CRUD
adminRouter.get('/routes', (_req, res) => {
  const rows = db.prepare('SELECT * FROM routes ORDER BY id DESC').all() as Array<Record<string, unknown>>;
  res.json(
    rows.map((r) => ({
      id: r.id,
      originDistrict: r.origin_district,
      destinationDistrict: r.destination_district,
      distanceKm: r.distance_km,
      estimatedDuration: r.estimated_duration,
      baseFare: r.base_fare,
      active: Boolean(r.active),
      createdAt: r.created_at,
    }))
  );
});

adminRouter.post('/routes', (req, res) => {
  const { originDistrict, destinationDistrict, distanceKm, estimatedDuration, baseFare, active } = req.body ?? {};
  if (!originDistrict || !destinationDistrict || !distanceKm || !estimatedDuration || !baseFare) {
    res.status(400).json({ message: 'All route fields are required.' });
    return;
  }
  if (String(originDistrict).trim().toLowerCase() === String(destinationDistrict).trim().toLowerCase()) {
    res.status(400).json({ message: 'Origin and destination cannot be the same district.' });
    return;
  }

  const result = db
    .prepare(
      `INSERT INTO routes (origin_district, destination_district, distance_km, estimated_duration, base_fare, active)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      String(originDistrict).trim(),
      String(destinationDistrict).trim(),
      Math.max(10, Number(distanceKm)),
      String(estimatedDuration).trim(),
      Math.max(50, Number(baseFare)),
      active === false ? 0 : 1
    );

  res.status(201).json({ id: Number(result.lastInsertRowid), message: 'Route added successfully.' });
});

adminRouter.put('/routes/:id', (req, res) => {
  const routeId = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM routes WHERE id = ?').get(routeId) as Record<string, unknown> | undefined;
  if (!existing) {
    res.status(404).json({ message: 'Route not found.' });
    return;
  }

  const { originDistrict, destinationDistrict, distanceKm, estimatedDuration, baseFare, active } = req.body ?? {};
  const nextOrigin = String(originDistrict ?? existing.origin_district).trim();
  const nextDest = String(destinationDistrict ?? existing.destination_district).trim();
  if (nextOrigin.toLowerCase() === nextDest.toLowerCase()) {
    res.status(400).json({ message: 'Origin and destination cannot be the same.' });
    return;
  }

  db.prepare(
    `UPDATE routes
     SET origin_district = ?, destination_district = ?, distance_km = ?, estimated_duration = ?, base_fare = ?, active = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    nextOrigin,
    nextDest,
    Math.max(10, Number(distanceKm ?? existing.distance_km)),
    String(estimatedDuration ?? existing.estimated_duration).trim(),
    Math.max(50, Number(baseFare ?? existing.base_fare)),
    active === undefined ? Number(existing.active) : active ? 1 : 0,
    routeId
  );

  res.json({ message: 'Route updated successfully.' });
});

adminRouter.delete('/routes/:id', (req, res) => {
  const routeId = Number(req.params.id);
  const del = db.prepare('DELETE FROM routes WHERE id = ?').run(routeId);
  if (del.changes === 0) {
    res.status(404).json({ message: 'Route not found.' });
    return;
  }
  res.json({ message: 'Route deleted successfully.' });
});

// Passengers
adminRouter.get('/passengers', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT u.id, u.full_name, u.email, u.phone, u.loyalty_points, u.created_at,
              COUNT(bk.id) AS total_bookings,
              COALESCE(SUM(CASE WHEN bk.status IN ('CONFIRMED','COMPLETED') THEN bk.total_fare ELSE 0 END), 0) AS total_spent
       FROM users u
       LEFT JOIN bookings bk ON bk.user_id = u.id
       WHERE u.role = 'PASSENGER'
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    )
    .all() as Array<Record<string, unknown>>;

  res.json(
    rows.map((r) => ({
      id: r.id,
      fullName: r.full_name,
      email: r.email,
      phone: r.phone,
      loyaltyPoints: r.loyalty_points,
      totalBookings: r.total_bookings,
      totalSpent: r.total_spent,
      createdAt: r.created_at,
    }))
  );
});

adminRouter.get('/passengers/:id/bookings', (req, res) => {
  const userId = Number(req.params.id);
  const rows = db
    .prepare(
      `SELECT bk.id, bk.booking_reference, bk.journey_date, bk.total_fare, bk.passenger_count, bk.status, bk.booking_date,
              b.bus_name, b.origin_district, b.destination_district
       FROM bookings bk
       JOIN buses b ON b.id = bk.bus_id
       WHERE bk.user_id = ?
       ORDER BY bk.created_at DESC`
    )
    .all(userId) as Array<Record<string, unknown>>;

  res.json(
    rows.map((r) => ({
      id: r.id,
      bookingReference: r.booking_reference,
      busName: r.bus_name,
      originDistrict: r.origin_district,
      destinationDistrict: r.destination_district,
      journeyDate: r.journey_date,
      totalFare: r.total_fare,
      passengerCount: r.passenger_count,
      status: r.status,
      bookingDate: r.booking_date,
    }))
  );
});

// Bookings Management
adminRouter.get('/bookings', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT bk.*, b.bus_name, b.registration_number, b.origin_district, b.destination_district, b.departure_time,
              u.full_name AS user_name, u.email AS user_email, u.phone AS user_phone,
              p.transaction_reference, p.payment_method, p.status AS payment_status,
              c.refund_amount, c.reason AS cancel_reason
       FROM bookings bk
       JOIN buses b ON b.id = bk.bus_id
       JOIN users u ON u.id = bk.user_id
       LEFT JOIN payments p ON p.booking_id = bk.id
       LEFT JOIN cancellations c ON c.booking_id = bk.id
       ORDER BY bk.created_at DESC, bk.id DESC`
    )
    .all() as Array<Record<string, unknown>>;

  res.json(
    rows.map((r) => ({
      id: r.id,
      bookingReference: r.booking_reference,
      userId: r.user_id,
      userName: r.user_name,
      userEmail: r.user_email,
      userPhone: r.user_phone,
      busId: r.bus_id,
      busName: r.bus_name,
      registrationNumber: r.registration_number,
      originDistrict: r.origin_district,
      destinationDistrict: r.destination_district,
      journeyDate: r.journey_date,
      departureTime: r.departure_time,
      totalFare: r.total_fare,
      passengerCount: r.passenger_count,
      status: r.status,
      bookingDate: r.booking_date,
      transactionReference: r.transaction_reference,
      paymentMethod: r.payment_method,
      paymentStatus: r.payment_status,
      refundAmount: r.refund_amount,
      cancellationReason: r.cancel_reason ?? r.cancellation_reason,
    }))
  );
});

adminRouter.put('/bookings/:id/status', (req, res) => {
  const bookingId = Number(req.params.id);
  const { status } = req.body ?? {};
  if (!['CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(String(status))) {
    res.status(400).json({ message: 'Invalid booking status.' });
    return;
  }

  const existing = db.prepare('SELECT id, user_id, booking_reference, total_fare, status FROM bookings WHERE id = ?').get(bookingId) as
    | { id: number; user_id: number; booking_reference: string; total_fare: number; status: string }
    | undefined;
  if (!existing) {
    res.status(404).json({ message: 'Booking not found.' });
    return;
  }
  if (existing.status === 'CANCELLED' && status !== 'CANCELLED') {
    res.status(400).json({ message: 'Cancelled bookings cannot be reverted.' });
    return;
  }

  db.exec('BEGIN IMMEDIATE TRANSACTION');
  try {
    if (status === 'CANCELLED' && existing.status !== 'CANCELLED') {
      db.prepare(
        `UPDATE bookings SET status = 'CANCELLED', cancelled_at = datetime('now'), cancellation_reason = 'Cancelled by Administrator', updated_at = datetime('now') WHERE id = ?`
      ).run(bookingId);
      const seats = db.prepare('SELECT seat_id FROM passenger_details WHERE booking_id = ?').all(bookingId) as Array<{ seat_id: number }>;
      const release = db.prepare(`UPDATE seats SET status = 'AVAILABLE' WHERE id = ? AND status = 'BOOKED'`);
      for (const s of seats) release.run(s.seat_id);
      db.prepare(
        `INSERT OR IGNORE INTO cancellations (booking_id, user_id, booking_reference, reason, refund_amount, refund_status, cancellation_status)
         VALUES (?, ?, ?, 'Cancelled by Administrator', ?, 'PROCESSED', 'CANCELLED')`
      ).run(bookingId, existing.user_id, existing.booking_reference, existing.total_fare);
      db.prepare(`UPDATE payments SET status = 'REFUNDED' WHERE booking_id = ?`).run(bookingId);
    } else {
      db.prepare(`UPDATE bookings SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(String(status), bookingId);
    }
    db.exec('COMMIT');
    res.json({ message: `Booking status updated to ${status}.` });
  } catch {
    db.exec('ROLLBACK');
    res.status(500).json({ message: 'Failed to update booking status.' });
  }
});

// Seat Management
adminRouter.get('/buses/:id/seats', (req, res) => {
  const busId = Number(req.params.id);
  const seats = db
    .prepare('SELECT id, bus_id, seat_number, deck, seat_type, status, price FROM seats WHERE bus_id = ? ORDER BY deck ASC, id ASC')
    .all(busId) as Array<Record<string, unknown>>;

  res.json(
    seats.map((s) => ({
      id: s.id,
      busId: s.bus_id,
      seatNumber: s.seat_number,
      deck: s.deck,
      seatType: s.seat_type,
      status: s.status,
      price: s.price,
    }))
  );
});

adminRouter.put('/seats/:id/toggle', (req, res) => {
  const seatId = Number(req.params.id);
  const seat = db.prepare('SELECT id, status, seat_number FROM seats WHERE id = ?').get(seatId) as
    | { id: number; status: string; seat_number: string }
    | undefined;

  if (!seat) {
    res.status(404).json({ message: 'Seat not found.' });
    return;
  }
  if (seat.status === 'BOOKED') {
    res.status(409).json({ message: `Seat ${seat.seat_number} is currently booked by a passenger and cannot be modified.` });
    return;
  }

  const nextStatus = seat.status === 'BLOCKED' ? 'AVAILABLE' : 'BLOCKED';
  db.prepare('UPDATE seats SET status = ? WHERE id = ?').run(nextStatus, seatId);
  res.json({ id: seatId, status: nextStatus, message: `Seat ${seat.seat_number} is now ${nextStatus}.` });
});

// Reports
adminRouter.get('/reports/bookings', (req, res) => {
  const reportType = String(req.query.type || 'bookings');
  const format = String(req.query.format || 'json');

  const bookingSummary = db
    .prepare(
      `SELECT bk.booking_reference, u.full_name AS passenger_name, u.email, b.bus_name,
              b.origin_district, b.destination_district, bk.journey_date, bk.passenger_count,
              bk.total_fare, bk.status, bk.booking_date, p.payment_method, p.transaction_reference
       FROM bookings bk
       JOIN users u ON u.id = bk.user_id
       JOIN buses b ON b.id = bk.bus_id
       LEFT JOIN payments p ON p.booking_id = bk.id
       ORDER BY bk.created_at DESC`
    )
    .all() as Array<Record<string, unknown>>;

  const cancellationSummary = db
    .prepare(
      `SELECT c.booking_reference, u.full_name AS passenger_name, b.bus_name,
              b.origin_district || ' -> ' || b.destination_district AS route_name,
              bk.journey_date, c.reason, c.refund_amount, c.refund_status, c.cancelled_at
       FROM cancellations c
       JOIN bookings bk ON bk.id = c.booking_id
       JOIN users u ON u.id = c.user_id
       JOIN buses b ON b.id = bk.bus_id
       ORDER BY c.cancelled_at DESC`
    )
    .all() as Array<Record<string, unknown>>;

  const busReport = db
    .prepare(
      `SELECT b.bus_name, b.registration_number, b.origin_district, b.destination_district,
              b.journey_date, b.fare, b.total_seats,
              (SELECT COUNT(*) FROM seats s WHERE s.bus_id = b.id AND s.status = 'BOOKED') AS booked_seats,
              (SELECT COUNT(*) FROM seats s WHERE s.bus_id = b.id AND s.status = 'AVAILABLE') AS available_seats,
              b.status
       FROM buses b
       ORDER BY b.journey_date ASC`
    )
    .all() as Array<Record<string, unknown>>;

  const passengerReport = db
    .prepare(
      `SELECT u.id, u.full_name, u.email, u.phone, u.loyalty_points,
              COUNT(bk.id) AS bookings_count,
              COALESCE(SUM(CASE WHEN bk.status IN ('CONFIRMED','COMPLETED') THEN bk.total_fare ELSE 0 END), 0) AS total_spent
       FROM users u
       LEFT JOIN bookings bk ON bk.user_id = u.id
       WHERE u.role = 'PASSENGER'
       GROUP BY u.id`
    )
    .all() as Array<Record<string, unknown>>;

  const revenueReport = db
    .prepare(
      `SELECT b.origin_district || ' -> ' || b.destination_district AS corridor,
              COUNT(bk.id) AS total_bookings,
              SUM(CASE WHEN bk.status = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmed_count,
              SUM(CASE WHEN bk.status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_count,
              COALESCE(SUM(CASE WHEN bk.status IN ('CONFIRMED','COMPLETED') THEN bk.total_fare ELSE 0 END), 0) AS net_revenue
       FROM buses b
       LEFT JOIN bookings bk ON bk.bus_id = b.id
       GROUP BY b.origin_district, b.destination_district
       ORDER BY net_revenue DESC`
    )
    .all() as Array<Record<string, unknown>>;

  if (format === 'csv') {
    const datasetMap: Record<string, Array<Record<string, unknown>>> = {
      bookings: bookingSummary,
      cancellations: cancellationSummary,
      buses: busReport,
      passengers: passengerReport,
      revenue: revenueReport,
    };
    const rows = datasetMap[reportType] || bookingSummary;
    const headers = rows.length > 0 ? Object.keys(rows[0]) : ['message'];
    const csvRows = [
      headers.join(','),
      ...rows.map((row) =>
        headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
      ),
    ];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="BlueLine_${reportType}_report.csv"`);
    res.send(csvRows.join('\n'));
    return;
  }

  res.json({
    bookings: bookingSummary,
    cancellations: cancellationSummary,
    buses: busReport,
    passengers: passengerReport,
    revenue: revenueReport,
  });
});
