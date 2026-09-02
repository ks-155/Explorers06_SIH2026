import { Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Write a row into audit_log. Every create/update/merge/decision in the
   * system funnels through here (Phase 2.4).
   *
   * This is intentionally best-effort: if the audit write fails it is logged
   * and swallowed so a broken audit table can never 500 (or roll back) the
   * main business operation that triggered it.
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

    try {
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
    } catch (error) {
      this.logger.error(
        `Audit write failed for action="${entry.action}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
