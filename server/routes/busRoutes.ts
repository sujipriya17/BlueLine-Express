import { Router } from 'express';
import { db } from '../db.ts';

export const busRouter = Router();

function formatBusRow(row: {
  id: number;
  route_id: number | null;
  bus_name: string;
  registration_number: string;
  origin_district: string;
  destination_district: string;
  journey_date: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  ac_type: string;
  seat_category: string;
  total_seats: number;
  available_seats: number;
  fare: number;
  rating: number;
  status: string;
}) {
  return {
    id: row.id,
    routeId: row.route_id,
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
    totalSeats: row.total_seats,
    availableSeats: row.available_seats,
    fare: row.fare,
    rating: row.rating,
    status: row.status,
  };
}

busRouter.get('/popular-routes', (_req, res) => {
  const routes = db
    .prepare(
      `SELECT r.id, r.origin_district, r.destination_district, r.distance_km, r.estimated_duration, r.base_fare,
              COUNT(b.id) AS schedule_count
       FROM routes r
       LEFT JOIN buses b ON b.origin_district = r.origin_district AND b.destination_district = r.destination_district AND b.status = 'ACTIVE'
       WHERE r.active = 1
       GROUP BY r.id
       ORDER BY schedule_count DESC, r.base_fare ASC`
    )
    .all() as Array<{
    id: number;
    origin_district: string;
    destination_district: string;
    distance_km: number;
    estimated_duration: string;
    base_fare: number;
    schedule_count: number;
  }>;

  res.json(
    routes.map((r) => ({
      id: r.id,
      originDistrict: r.origin_district,
      destinationDistrict: r.destination_district,
      distanceKm: r.distance_km,
      estimatedDuration: r.estimated_duration,
      baseFare: r.base_fare,
      scheduleCount: r.schedule_count,
    }))
  );
});

busRouter.get('/search', (req, res) => {
  const origin = typeof req.query.origin === 'string' ? req.query.origin.trim() : '';
  const destination = typeof req.query.destination === 'string' ? req.query.destination.trim() : '';
  const date = typeof req.query.date === 'string' ? req.query.date.trim() : '';
  const acType = typeof req.query.acType === 'string' ? req.query.acType.trim() : '';
  const seatCategory = typeof req.query.seatCategory === 'string' ? req.query.seatCategory.trim() : '';

  if (origin && destination && origin.toLowerCase() === destination.toLowerCase()) {
    res.status(400).json({ message: 'Origin and destination districts cannot be the same.' });
    return;
  }

  const conditions: string[] = [`b.status = 'ACTIVE'`];
  const params: Array<string | number> = [];

  if (origin) {
    conditions.push(`LOWER(b.origin_district) = LOWER(?)`);
    params.push(origin);
  }
  if (destination) {
    conditions.push(`LOWER(b.destination_district) = LOWER(?)`);
    params.push(destination);
  }
  if (date) {
    conditions.push(`b.journey_date = ?`);
    params.push(date);
  }
  if (acType && acType !== 'ALL') {
    conditions.push(`b.ac_type = ?`);
    params.push(acType);
  }
  if (seatCategory && seatCategory !== 'ALL') {
    conditions.push(`b.seat_category = ?`);
    params.push(seatCategory);
  }

  const sql = `
    SELECT b.*,
           (SELECT COUNT(*) FROM seats s WHERE s.bus_id = b.id AND s.status = 'AVAILABLE') AS available_seats
    FROM buses b
    WHERE ${conditions.join(' AND ')}
    ORDER BY b.journey_date ASC, b.departure_time ASC
  `;

  const rows = db.prepare(sql).all(...params) as Array<Parameters<typeof formatBusRow>[0]>;
  res.json(rows.map(formatBusRow));
});

busRouter.get('/:id', (req, res) => {
  const busId = Number(req.params.id);
  if (!Number.isInteger(busId) || busId <= 0) {
    res.status(400).json({ message: 'Invalid bus ID.' });
    return;
  }

  const row = db
    .prepare(
      `SELECT b.*,
              (SELECT COUNT(*) FROM seats s WHERE s.bus_id = b.id AND s.status = 'AVAILABLE') AS available_seats
       FROM buses b WHERE b.id = ?`
    )
    .get(busId) as Parameters<typeof formatBusRow>[0] | undefined;

  if (!row) {
    res.status(404).json({ message: 'Bus schedule not found.' });
    return;
  }

  res.json(formatBusRow(row));
});

busRouter.get('/:id/seats', (req, res) => {
  const busId = Number(req.params.id);
  if (!Number.isInteger(busId) || busId <= 0) {
    res.status(400).json({ message: 'Invalid bus ID.' });
    return;
  }

  const bus = db.prepare('SELECT id FROM buses WHERE id = ?').get(busId);
  if (!bus) {
    res.status(404).json({ message: 'Bus schedule not found.' });
    return;
  }

  const seats = db
    .prepare(
      `SELECT id, bus_id, seat_number, deck, seat_type, status, price
       FROM seats WHERE bus_id = ?
       ORDER BY deck ASC, id ASC`
    )
    .all(busId) as Array<{
    id: number;
    bus_id: number;
    seat_number: string;
    deck: string;
    seat_type: string;
    status: string;
    price: number;
  }>;

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
