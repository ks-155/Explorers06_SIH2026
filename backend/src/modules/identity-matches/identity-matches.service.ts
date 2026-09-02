import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { IdentityMatch, MatchStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class IdentityMatchesService {
  private readonly logger = new Logger(IdentityMatchesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Commit a merge: candidate collapses into source (canonical). */
  async confirm(id: string, requester: AuthenticatedUser) {
    const match = await this.getMatchOrThrow(id);
    this.assertCanDecide(match, requester);

    if (match.status !== MatchStatus.proposed) {
      throw new BadRequestException(
        `Match ${id} is already ${match.status}; only proposed matches can be confirmed`,
      );
    }

    const source = match.source_trainee_id;
    const candidate = match.candidate_trainee_id;

    await this.prisma.$transaction([
      // Re-link all owned data on the candidate to the canonical source
      // BEFORE the candidate is consumed, so no records orphan under a
      // trainee that is about to be discarded as merged.
      this.prisma.employmentRecord.updateMany({
        where: { trainee_id: candidate },
        data: { trainee_id: source },
      }),
      this.prisma.trainingRecord.updateMany({
        where: { trainee_id: candidate },
        data: { trainee_id: source },
      }),
      this.prisma.followUp.updateMany({
        where: { trainee_id: candidate },
        data: { trainee_id: source },
      }),
      // Retarget any identity matches that referenced the candidate so the
      // dedup graph keeps pointing at the surviving canonical trainee.
      this.prisma.identityMatch.updateMany({
        where: { source_trainee_id: candidate },
        data: { source_trainee_id: source },
      }),
      this.prisma.identityMatch.updateMany({
        where: { candidate_trainee_id: candidate },
        data: { candidate_trainee_id: source },
      }),
      // Supersede the pair that triggered this merge.
      this.prisma.identityMatch.updateMany({
        where: {
          OR: [
            { source_trainee_id: source, candidate_trainee_id: source },
            { source_trainee_id: candidate, candidate_trainee_id: candidate },
          ],
        },
        data: { status: MatchStatus.merged },
      }),
      this.prisma.trainee.update({
        where: { id: candidate },
        data: {
          identity_status: 'merged',
          unified_identity_id: source,
          merge_confidence: match.confidence,
          matched_at: new Date(),
        },
      }),
      this.prisma.trainee.update({
        where: { id: source },
        data: {
          identity_status: 'canonical',
          unified_identity_id: source,
          merge_confidence: match.confidence,
          matched_at: new Date(),
        },
      }),
    ]);

    await this.prisma.identityMatch.update({
      where: { id },
      data: {
        status: MatchStatus.confirmed,
        decided_by: requester.id,
        decided_at: new Date(),
      },
    });

    await this.audit.record({
      actor: requester,
      action: 'identity.match.confirm',
      entityType: 'identity_match',
      entityId: id,
      newValue: {
        source_trainee_id: source,
        candidate_trainee_id: candidate,
        confidence: match.confidence ? Number(match.confidence) : null,
      },
    });

    this.logger.log(
      `Identity match ${id} confirmed (${candidate} -> ${source})`,
    );
    return { id, status: MatchStatus.confirmed, canonical_trainee_id: source };
  }

  /** Reject a false positive: match stays but is marked rejected. */
  async reject(id: string, requester: AuthenticatedUser) {
    const match = await this.getMatchOrThrow(id);
    this.assertCanDecide(match, requester);

    if (match.status !== MatchStatus.proposed) {
      throw new BadRequestException(
        `Match ${id} is already ${match.status}; only proposed matches can be rejected`,
      );
    }

    const updated = await this.prisma.identityMatch.update({
      where: { id },
      data: {
        status: MatchStatus.rejected,
        decided_by: requester.id,
        decided_at: new Date(),
      },
    });

    await this.audit.record({
      actor: requester,
      action: 'identity.match.reject',
      entityType: 'identity_match',
      entityId: id,
      oldValue: { status: MatchStatus.proposed },
      newValue: { status: MatchStatus.rejected },
    });

    this.logger.log(`Identity match ${id} rejected`);
    return { id, status: updated.status };
  }

  private async getMatchOrThrow(id: string): Promise<IdentityMatch> {
    const match = await this.prisma.identityMatch.findUnique({ where: { id } });
    if (!match) {
      throw new NotFoundException(`Identity match ${id} not found`);
    }
    return match;
  }

  /** Owner (either trainee in the pair) or admin may decide on a match. */
  private assertCanDecide(match: IdentityMatch, requester: AuthenticatedUser) {
    if (requester.role === 'admin') return;
    if (
      requester.role === 'trainee' &&
      (requester.traineeId === match.source_trainee_id ||
        requester.traineeId === match.candidate_trainee_id)
    ) {
      return;
    }
    throw new ForbiddenException(
      'You can only decide on matches involving your own trainee profile',
    );
  }
}
