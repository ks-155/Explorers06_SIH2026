// RBAC — Phase 1 / Phase 3: mirror backend authorize('admin','government')
// ARCHITECTURE.md:89, API-CONTRACT.md  Aggregate analytics GOV/ADMIN ONLY
import type { Role } from './auth';

export const ANALYTICS_ROLES: Role[] = ['government', 'admin'];

export function canViewAnalytics(role: Role | null | undefined): boolean {
  if (!role) return false;
  return (ANALYTICS_ROLES as string[]).includes(role);
}

export function canViewEmployerPortal(role: Role | null | undefined): boolean {
  if (!role) return false;
  return role === 'employer' || role === 'admin';
}

export function redirectPathForRole(role: Role): string {
  if (role === 'government' || role === 'admin') return '/dashboard';
  if (role === 'employer') return '/employer/me';
  return '/login';
}
