import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

export interface AuditEntryInput {
  actor?: AuthenticatedUser | null;
  action: string;
  entityType?: string;
  entityId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Write a row into audit_log. Every create/update/merge/decision in the
   * system funnels through here (Phase 2.4).
   */
  async record(entry: AuditEntryInput): Promise<void> {
    const oldValue =
      entry.oldValue === undefined
        ? Prisma.DbNull
        : (entry.oldValue as Prisma.InputJsonValue);
    const newValue =
      entry.newValue === undefined
        ? Prisma.DbNull
        : (entry.newValue as Prisma.InputJsonValue);

    await this.prisma.auditLog.create({
      data: {
        actor_id: entry.actor?.id ?? null,
        actor_type: entry.actor?.role ?? null,
        action: entry.action,
        entity_type: entry.entityType ?? null,
        entity_id: entry.entityId ?? null,
        old_value: oldValue,
        new_value: newValue,
        ip_address: entry.ipAddress ?? null,
      },
    });
  }
}
