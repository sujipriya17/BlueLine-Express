import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { db } from './db.ts';

const SECRET_KEY = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: 'PASSENGER' | 'ADMIN';
  loyaltyPoints: number;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

interface TokenPayload {
  sub: number;
  role: 'PASSENGER' | 'ADMIN';
  exp: number;
}

export function signToken(userId: number, role: 'PASSENGER' | 'ADMIN', rememberMe = false): string {
  const ttlMs = rememberMe ? 1000 * 60 * 60 * 24 * 14 : 1000 * 60 * 60 * 12;
  const payload: TokenPayload = {
    sub: userId,
    role,
    exp: Date.now() + ttlMs,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET_KEY).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SECRET_KEY).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as TokenPayload;
    if (!payload.sub || !payload.role || !payload.exp || Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authentication required. Please sign in.' });
    return;
  }
  const token = header.slice(7).trim();
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ message: 'Session expired or invalid token. Please sign in again.' });
    return;
  }

  const row = db
    .prepare('SELECT id, full_name, email, phone, role, loyalty_points FROM users WHERE id = ?')
    .get(payload.sub) as
    | {
        id: number;
        full_name: string;
        email: string;
        phone: string;
        role: 'PASSENGER' | 'ADMIN';
        loyalty_points: number;
      }
    | undefined;

  if (!row) {
    res.status(401).json({ message: 'User account not found.' });
    return;
  }

  req.user = {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    loyaltyPoints: row.loyalty_points,
  };
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (!req.user || req.user.role !== 'ADMIN') {
      res.status(403).json({ message: 'Administrator privileges required.' });
      return;
    }
    next();
  });
}
