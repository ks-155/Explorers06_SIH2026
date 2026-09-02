import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { MatchType, Prisma, Trainee } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateTraineeDto } from './dto/create-trainee.dto';
import { UpdateConsentDto } from './dto/update-consent.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { RunMatchDto } from './dto/run-match.dto';

@Injectable()
export class TraineesService {
  private readonly logger = new Logger(TraineesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Rule-based identity matching config. M4's algorithm can plug in here. */
  private readonly weights = {
    aadhaar: 95,
    phone: 80,
    nameDistrict: 65,
  };

  async create(
    dto: CreateTraineeDto,
    actor: AuthenticatedUser | null,
    ipAddress?: string,
  ) {
    const data: Prisma.TraineeCreateInput = {
      name: dto.name,
      phone: dto.phone,
      alternate_phone: dto.alternate_phone ?? null,
      email: dto.email ?? null,
      district_id: dto.district_id ?? null,
      state: dto.state ?? null,
      aadhaar_hash: dto.aadhaar_hash ?? null,
      consent_given: dto.consent_given,
      consent_date: dto.consent_given ? new Date() : null,
      consent_version: dto.consent_version ?? null,
      preferred_language: dto.preferred_language ?? 'en',
      preferred_channel: dto.preferred_channel ?? 'whatsapp',
    };

    const trainee = await this.prisma.trainee.create({ data });

    await this.audit.record({
      actor,
      action: 'trainee.register',
      entityType: 'trainee',
      entityId: trainee.id,
      newValue: this.sanitized(dto),
      ipAddress,
    });

    this.logger.log(`Trainee registered: ${trainee.id} (${trainee.phone})`);
    return trainee;
  }

  /** Ownership-scoped profile read: the trainee themself or an admin. */
  async findById(id: string, requester: AuthenticatedUser) {
    const trainee = await this.getTraineeOrThrow(id);
    this.assertOwnerOrAdmin(id, requester);
    return trainee;
  }

  async updateConsent(
    id: string,
    dto: UpdateConsentDto,
    requester: AuthenticatedUser,
  ) {
    const trainee = await this.getTraineeOrThrow(id);
    this.assertOwnerOrAdmin(id, requester);

    const updated = await this.prisma.trainee.update({
      where: { id },
      data: {
        consent_given: dto.consent_given,
        consent_version: dto.consent_version,
        consent_date: dto.consent_given ? new Date() : null,
      },
    });

    await this.audit.record({
      actor: requester,
      action: 'trainee.consent.update',
      entityType: 'trainee',
      entityId: id,
      oldValue: {
        consent_given: trainee.consent_given,
        consent_version: trainee.consent_version,
      },
      newValue: {
        consent_given: dto.consent_given,
        consent_version: dto.consent_version,
      },
    });

    this.logger.log(`Consent updated for trainee ${id}`);
    return updated;
  }

  async updateContact(
    id: string,
    dto: UpdateContactDto,
    requester: AuthenticatedUser,
  ) {
    const trainee = await this.getTraineeOrThrow(id);
    this.assertOwnerOrAdmin(id, requester);

    const updated = await this.prisma.trainee.update({
      where: { id },
      data: {
        phone: dto.phone ?? trainee.phone,
        alternate_phone:
          dto.alternate_phone !== undefined
            ? dto.alternate_phone
            : trainee.alternate_phone,
        district_id: dto.district_id ?? trainee.district_id,
        state: dto.state ?? trainee.state,
      },
    });

    await this.audit.record({
      actor: requester,
      action: 'trainee.contact.update',
      entityType: 'trainee',
      entityId: id,
      oldValue: {
        phone: trainee.phone,
        alternate_phone: trainee.alternate_phone,
        district_id: trainee.district_id,
      },
      newValue: {
        phone: updated.phone,
        alternate_phone: updated.alternate_phone,
        district_id: updated.district_id,
      },
    });

    this.logger.log(`Contact updated for trainee ${id}`);
    return updated;
  }

  async getTrainingRecords(id: string, requester: AuthenticatedUser) {
    await this.getTraineeOrThrow(id);
    this.assertOwnerOrAdmin(id, requester);
    return this.prisma.trainingRecord.findMany({
      where: { trainee_id: id },
      orderBy: { created_at: 'desc' },
    });
  }

  /** Run identity matching for one trainee or a full sweep. */
  async runMatch(dto: RunMatchDto, actor: AuthenticatedUser) {
    const where: Prisma.TraineeWhereInput = dto.trainee_id
      ? { id: dto.trainee_id }
      : { identity_status: 'canonical' };

    const trainees = await this.prisma.trainee.findMany({ where });
    let created = 0;

    for (const source of trainees) {
      created += await this.matchOne(source);
    }

    await this.audit.record({
      actor,
      action: 'identity.match.run',
      entityType: 'identity_match',
      newValue: {
        scope: dto.trainee_id ?? 'all',
        candidates_scanned: trainees.length,
        matches_created: created,
      },
    });

    this.logger.log(
      `Identity match run: ${trainees.length} scanned, ${created} matches created`,
    );
    return { scanned: trainees.length, matches_created: created };
  }

  /** Probable duplicates for a trainee (proposed soft/hard matches). */
  async getMergeCandidates(id: string, requester: AuthenticatedUser) {
    await this.getTraineeOrThrow(id);
    this.assertOwnerOrAdmin(id, requester);

    const matches = await this.prisma.identityMatch.findMany({
      where: {
        OR: [{ source_trainee_id: id }, { candidate_trainee_id: id }],
        status: 'proposed',
      },
      include: {
        source_trainee: { select: { id: true, name: true, phone: true } },
        candidate_trainee: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { confidence: 'desc' },
    });

    return matches.map((m) => {
      const other =
        m.source_trainee_id === id ? m.candidate_trainee : m.source_trainee;
      return {
        identity_match_id: m.id,
        candidate_trainee: other,
        match_type: m.match_type,
        match_fields: m.match_fields,
        confidence: m.confidence ? Number(m.confidence) : null,
        status: m.status,
      };
    });
  }

  private async matchOne(source: Trainee): Promise<number> {
    const others = await this.prisma.trainee.findMany({
      where: {
        id: { not: source.id },
        OR: [
          { phone: source.phone ?? undefined },
          { aadhaar_hash: source.aadhaar_hash ?? undefined },
        ],
      },
    });

    let count = 0;
    for (const other of others) {
      const match = this.evaluate(source, other);
      if (!match) continue;

      const fields = match.fields;
      // One row per unordered pair: update the existing match (either
      // direction) instead of creating a reverse-direction duplicate.
      const existing = await this.prisma.identityMatch.findFirst({
        where: {
          match_type: match.type,
          OR: [
            { source_trainee_id: source.id, candidate_trainee_id: other.id },
            { source_trainee_id: other.id, candidate_trainee_id: source.id },
          ],
        },
      });

      if (existing) {
        await this.prisma.identityMatch.update({
          where: { id: existing.id },
          data: {
            confidence: match.confidence,
            match_fields: fields,
            status: 'proposed',
          },
        });
      } else {
        await this.prisma.identityMatch.create({
          data: {
            source_trainee_id: source.id,
            candidate_trainee_id: other.id,
            match_type: match.type,
            confidence: match.confidence,
            match_fields: fields,
            status: 'proposed',
          },
        });
      }
      count += 1;
    }
    return count;
  }

  /**
   * Deterministic, rule-based candidate evaluation. M4 can swap this for a
   * stronger algorithm; the contract stays the same.
   */
  private evaluate(
    source: Trainee,
    other: Trainee,
  ): {
    type: MatchType;
    confidence: number;
    fields: Record<string, boolean>;
  } | null {
    if (
      source.aadhaar_hash &&
      other.aadhaar_hash &&
      source.aadhaar_hash === other.aadhaar_hash
    ) {
      return {
        type: MatchType.hard,
        confidence: this.weights.aadhaar,
        fields: { aadhaar_hash: true },
      };
    }
    if (
      source.phone &&
      other.phone &&
      this.normalizePhone(source.phone) === this.normalizePhone(other.phone)
    ) {
      return {
        type: MatchType.soft,
        confidence: this.weights.phone,
        fields: { phone: true },
      };
    }
    if (
      this.normalizeName(source.name) &&
      this.normalizeName(other.name) &&
      this.normalizeName(source.name) === this.normalizeName(other.name) &&
      source.district_id &&
      other.district_id &&
      source.district_id === other.district_id
    ) {
      return {
        type: MatchType.soft,
        confidence: this.weights.nameDistrict,
        fields: { name: true, district_id: true },
      };
    }
    return null;
  }

  private normalizePhone(p: string): string {
    const digits = p.replace(/\D/g, '');
    // Strip a leading ISD code "91" only when it is followed by 10 more
    // digits (i.e. it is a genuine country code, not the start of a normal
    // 10-digit number such as 9102345678). Also strip a leading trunk "0".
    return digits.replace(/^91(?=\d{10}$)/, '').replace(/^0(?=\d{10}$)/, '');
  }

  private normalizeName(n: string | null | undefined): string {
    return (n ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private sanitized(dto: CreateTraineeDto): Record<string, unknown> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { aadhaar_hash, ...rest } = dto;
    return {
      ...rest,
      aadhaar_hash_stored: Boolean(dto.aadhaar_hash),
    };
  }

  private async getTraineeOrThrow(id: string): Promise<Trainee> {
    const trainee = await this.prisma.trainee.findUnique({ where: { id } });
    if (!trainee) {
      throw new NotFoundException(`Trainee ${id} not found`);
    }
    return trainee;
  }

  private assertOwnerOrAdmin(id: string, requester: AuthenticatedUser) {
    const isAdmin = requester.role === 'admin';
    const isOwner = requester.role === 'trainee' && requester.traineeId === id;
    if (!isAdmin && !isOwner) {
      throw new ForbiddenException(
        'You can only access your own trainee profile',
      );
    }
  }
}
