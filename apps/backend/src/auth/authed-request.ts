import type { Request } from 'express';

export interface AuthUser {
  sub?: number;
  username?: string;
  role?: string;
  name?: string;
  source?: 'master' | 'app' | 'erp';
  mustChangePassword?: boolean;
}

export interface AuthedRequest extends Request {
  user?: AuthUser;
}
