/**
 * SOIS — Database Seed (placeholder for Phase 1)
 *
 * Phase 6 will expand this with full Maharashtra demo data
 * (Pune/Mumbai/Nagpur districts, providers, courses, employers,
 * trainees with varied outcomes, and analytics snapshots).
 *
 * For now this seeds the authentication users so the login flow can
 * be exercised with a running database.
 */
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);

async function upsertUser(
  email: string,
  role: Role,
  password: string,
  extra: Record<string, unknown> = {},
) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await prisma.user.upsert({
    where: { email },
    update: { role },
    create: { email, role, password_hash: passwordHash, ...extra },
  });
}

async function main() {
  await upsertUser('gov@mh.gov.in', Role.government, 'gov123456');
  await upsertUser('admin@sois.in', Role.admin, 'admin123456');
  await upsertUser('trainee@sois.in', Role.trainee, 'trainee123456');
  await upsertUser('employer@sois.in', Role.employer, 'employer123456');
  console.log('Seeded auth users (Phase 1 placeholder).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
