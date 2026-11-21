import { Router } from 'express';
import { db } from '../db.ts';

export const publicRouter = Router();

publicRouter.post('/contact', (req, res) => {
  const { name, email, phone, subject, message } = req.body ?? {};
  if (!name || String(name).trim().length < 2) {
    res.status(400).json({ message: 'Please enter your full name.' });
    return;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
    res.status(400).json({ message: 'Please enter a valid email address.' });
    return;
  }
  if (!phone || !/^[6-9]\d{9}$/.test(String(phone).trim())) {
    res.status(400).json({ message: 'Please enter a valid 10-digit phone number.' });
    return;
  }
  if (!subject || String(subject).trim().length < 3) {
    res.status(400).json({ message: 'Subject is required.' });
    return;
  }
  if (!message || String(message).trim().length < 10) {
    res.status(400).json({ message: 'Message must be at least 10 characters.' });
    return;
  }

  const resInsert = db
    .prepare(
      `INSERT INTO contact_messages (name, email, phone, subject, message)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(
      String(name).trim(),
      String(email).trim().toLowerCase(),
      String(phone).trim(),
      String(subject).trim(),
      String(message).trim()
    );

  res.status(201).json({
    id: Number(resInsert.lastInsertRowid),
    message: 'Thank you for contacting BlueLine Express. Our support desk has logged your inquiry.',
  });
});
