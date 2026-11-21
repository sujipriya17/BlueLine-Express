import { db, generateSeatsForBus } from './db.ts';

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function seedInitialData(): void {
  const routeCountRow = db.prepare('SELECT COUNT(*) AS cnt FROM routes').get() as { cnt: number };
  if (routeCountRow.cnt > 0) {
    return;
  }

  const insertRoute = db.prepare(`
    INSERT INTO routes (origin_district, destination_district, distance_km, estimated_duration, base_fare, active)
    VALUES (?, ?, ?, ?, ?, 1)
  `);

  const routeSpecs: Array<[string, string, number, string, number]> = [
    ['Chennai', 'Madurai', 462, '7h 45m', 850],
    ['Madurai', 'Chennai', 462, '7h 45m', 850],
    ['Chennai', 'Coimbatore', 506, '8h 30m', 920],
    ['Coimbatore', 'Chennai', 506, '8h 30m', 920],
    ['Chennai', 'Tiruchirappalli', 332, '5h 45m', 650],
    ['Tiruchirappalli', 'Chennai', 332, '5h 45m', 650],
    ['Chennai', 'Tirunelveli', 624, '10h 15m', 1100],
    ['Coimbatore', 'Madurai', 214, '4h 15m', 480],
    ['Coimbatore', 'Kanniyakumari', 446, '8h 00m', 890],
    ['Chennai', 'Salem', 345, '6h 00m', 680],
    ['Madurai', 'Ramanathapuram', 118, '2h 30m', 320],
    ['Thanjavur', 'Chennai', 342, '6h 15m', 690],
  ];

  const routeIds: Record<string, number> = {};
  for (const [origin, dest, dist, dur, fare] of routeSpecs) {
    const result = insertRoute.run(origin, dest, dist, dur, fare);
    routeIds[`${origin}->${dest}`] = Number(result.lastInsertRowid);
  }

  const today = new Date();
  const dayOffsets = [0, 1, 2, 3, 4, 5, 7];

  const insertBus = db.prepare(`
    INSERT INTO buses (
      route_id, bus_name, registration_number, origin_district, destination_district,
      journey_date, departure_time, arrival_time, duration, ac_type, seat_category,
      total_seats, fare, rating, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
  `);

  const busTemplates = [
    {
      key: 'Chennai->Madurai',
      busName: 'BlueLine Pandian Volvo Multi-Axle',
      regPrefix: 'TN01BL10',
      dep: '21:15',
      arr: '05:00',
      duration: '7h 45m',
      acType: 'AC' as const,
      seatCat: 'SLEEPER' as const,
      totalSeats: 30,
      fare: 1050,
      rating: 4.8,
      booked: ['L1', 'L2', 'U3'],
      blocked: ['L15'],
    },
    {
      key: 'Chennai->Madurai',
      busName: 'BlueLine Vaigai Executive Seater',
      regPrefix: 'TN01BL11',
      dep: '06:30',
      arr: '14:15',
      duration: '7h 45m',
      acType: 'AC' as const,
      seatCat: 'SEATER' as const,
      totalSeats: 40,
      fare: 780,
      rating: 4.6,
      booked: ['A1', 'A2', 'A5', 'A6'],
      blocked: ['A40'],
    },
    {
      key: 'Chennai->Madurai',
      busName: 'BlueLine Express Highway Cruiser',
      regPrefix: 'TN01BL12',
      dep: '14:00',
      arr: '22:00',
      duration: '8h 00m',
      acType: 'NON_AC' as const,
      seatCat: 'SEATER_SLEEPER' as const,
      totalSeats: 36,
      fare: 640,
      rating: 4.4,
      booked: ['S3', 'S4'],
      blocked: ['U12'],
    },
    {
      key: 'Madurai->Chennai',
      busName: 'BlueLine Meenakshi Night Sleeper',
      regPrefix: 'TN58BL20',
      dep: '21:30',
      arr: '05:15',
      duration: '7h 45m',
      acType: 'AC' as const,
      seatCat: 'SLEEPER' as const,
      totalSeats: 30,
      fare: 1020,
      rating: 4.9,
      booked: ['L4', 'U2'],
      blocked: ['U15'],
    },
    {
      key: 'Chennai->Coimbatore',
      busName: 'BlueLine Kovai Benz Sleeper',
      regPrefix: 'TN37BL30',
      dep: '22:00',
      arr: '06:30',
      duration: '8h 30m',
      acType: 'AC' as const,
      seatCat: 'SLEEPER' as const,
      totalSeats: 30,
      fare: 1180,
      rating: 4.8,
      booked: ['L1', 'L5', 'U1'],
      blocked: ['L14'],
    },
    {
      key: 'Chennai->Coimbatore',
      busName: 'BlueLine Nilgiri Day Express',
      regPrefix: 'TN37BL31',
      dep: '07:00',
      arr: '15:30',
      duration: '8h 30m',
      acType: 'AC' as const,
      seatCat: 'SEATER' as const,
      totalSeats: 40,
      fare: 860,
      rating: 4.5,
      booked: ['A7', 'A8'],
      blocked: ['A39'],
    },
    {
      key: 'Coimbatore->Chennai',
      busName: 'BlueLine Siruvani Scania Coach',
      regPrefix: 'TN38BL40',
      dep: '21:45',
      arr: '06:15',
      duration: '8h 30m',
      acType: 'AC' as const,
      seatCat: 'SEATER_SLEEPER' as const,
      totalSeats: 36,
      fare: 960,
      rating: 4.7,
      booked: ['S1', 'U4'],
      blocked: ['S24'],
    },
    {
      key: 'Chennai->Tiruchirappalli',
      busName: 'BlueLine Rockfort Shuttle',
      regPrefix: 'TN45BL50',
      dep: '08:15',
      arr: '14:00',
      duration: '5h 45m',
      acType: 'AC' as const,
      seatCat: 'SEATER' as const,
      totalSeats: 40,
      fare: 650,
      rating: 4.7,
      booked: ['A3', 'A4'],
      blocked: ['A38'],
    },
    {
      key: 'Tiruchirappalli->Chennai',
      busName: 'BlueLine Kaveri Intercity',
      regPrefix: 'TN45BL51',
      dep: '16:00',
      arr: '21:45',
      duration: '5h 45m',
      acType: 'NON_AC' as const,
      seatCat: 'SEATER' as const,
      totalSeats: 40,
      fare: 490,
      rating: 4.3,
      booked: ['A10'],
      blocked: ['A37'],
    },
    {
      key: 'Chennai->Tirunelveli',
      busName: 'BlueLine Nellai Crown Sleeper',
      regPrefix: 'TN72BL60',
      dep: '19:45',
      arr: '06:00',
      duration: '10h 15m',
      acType: 'AC' as const,
      seatCat: 'SLEEPER' as const,
      totalSeats: 30,
      fare: 1290,
      rating: 4.9,
      booked: ['L3', 'U6'],
      blocked: ['L15'],
    },
    {
      key: 'Coimbatore->Kanniyakumari',
      busName: 'BlueLine Cape Coastal Sleeper',
      regPrefix: 'TN74BL70',
      dep: '21:00',
      arr: '05:00',
      duration: '8h 00m',
      acType: 'AC' as const,
      seatCat: 'SLEEPER' as const,
      totalSeats: 30,
      fare: 1090,
      rating: 4.7,
      booked: ['L2'],
      blocked: ['U14'],
    },
    {
      key: 'Chennai->Salem',
      busName: 'BlueLine Yercaud Hills Express',
      regPrefix: 'TN30BL80',
      dep: '13:30',
      arr: '19:30',
      duration: '6h 00m',
      acType: 'AC' as const,
      seatCat: 'SEATER' as const,
      totalSeats: 40,
      fare: 680,
      rating: 4.6,
      booked: ['A9', 'A10'],
      blocked: ['A40'],
    },
    {
      key: 'Coimbatore->Madurai',
      busName: 'BlueLine Kongu Link',
      regPrefix: 'TN39BL90',
      dep: '09:30',
      arr: '13:45',
      duration: '4h 15m',
      acType: 'NON_AC' as const,
      seatCat: 'SEATER' as const,
      totalSeats: 40,
      fare: 420,
      rating: 4.4,
      booked: ['A1'],
      blocked: ['A39'],
    },
    {
      key: 'Thanjavur->Chennai',
      busName: 'BlueLine Chola Heritage Sleeper',
      regPrefix: 'TN49BL95',
      dep: '22:15',
      arr: '04:30',
      duration: '6h 15m',
      acType: 'AC' as const,
      seatCat: 'SEATER_SLEEPER' as const,
      totalSeats: 36,
      fare: 820,
      rating: 4.6,
      booked: ['S2'],
      blocked: ['U10'],
    },
  ];

  dayOffsets.forEach((offset, idx) => {
    const journeyDate = addDays(today, offset);
    busTemplates.forEach((tpl) => {
      const [origin, dest] = tpl.key.split('->');
      const routeId = routeIds[tpl.key] ?? null;
      const regNumber = `${tpl.regPrefix}${String(idx + 1).padStart(2, '0')}`;
      const res = insertBus.run(
        routeId,
        tpl.busName,
        regNumber,
        origin,
        dest,
        journeyDate,
        tpl.dep,
        tpl.arr,
        tpl.duration,
        tpl.acType,
        tpl.seatCat,
        tpl.totalSeats,
        tpl.fare,
        tpl.rating
      );
      const busId = Number(res.lastInsertRowid);
      generateSeatsForBus(busId, tpl.seatCat, tpl.totalSeats, tpl.fare, tpl.booked, tpl.blocked);
    });
  });
}
