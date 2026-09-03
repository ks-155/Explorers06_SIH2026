import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** Maharashtra demo district IDs used in seed + gov UI aliases. */
const DISTRICT_ALIASES: Record<string, number> = {
  pune: 27,
  mumbai: 2,
  nagpur: 1,
};

const DISTRICT_NAMES: Record<number, string> = {
  27: 'Pune',
  2: 'Mumbai',
  1: 'Nagpur',
};

function resolveDistrictId(idParam: string): number {
  const lower = idParam.toLowerCase().trim();
  if (DISTRICT_ALIASES[lower] != null) return DISTRICT_ALIASES[lower];
  const num = parseInt(idParam, 10);
  if (!Number.isNaN(num)) return num;
  throw new BadRequestException(`Unknown district: ${idParam}`);
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Dashboard KPIs — shape aligned with API-CONTRACT.md §8. */
  async dashboard() {
    const [
      totalTrainees,
      trainedRows,
      certifiedRows,
      verifiedEmployed,
      totalPlacements,
      unreachable,
      avgSalary,
    ] = await Promise.all([
      this.prisma.trainee.count({ where: { consent_given: true } }),
      this.prisma.trainingRecord.findMany({
        select: { trainee_id: true },
        distinct: ['trainee_id'],
      }),
      this.prisma.trainingRecord.findMany({
        where: { status: 'completed' },
        select: { trainee_id: true },
        distinct: ['trainee_id'],
      }),
      this.prisma.employmentRecord.count({
        where: {
          verification_status: {
            in: ['employer_confirmed', 'evidence_confirmed'],
          },
          leaving_date: null,
        },
      }),
      this.prisma.employmentRecord.count({ where: { leaving_date: null } }),
      this.prisma.followUp.count({ where: { status: 'failed' } }),
      this.prisma.employmentRecord.aggregate({
        _avg: { current_salary: true },
        where: { current_salary: { not: null }, leaving_date: null },
      }),
    ]);

    const trained = trainedRows.length;
    const certified = certifiedRows.length;
    const certifiedIds = certifiedRows.map((r) => r.trainee_id);

    let unemployed = 0;
    if (certifiedIds.length > 0) {
      const placedRows = await this.prisma.employmentRecord.findMany({
        where: { leaving_date: null, trainee_id: { in: certifiedIds } },
        select: { trainee_id: true },
        distinct: ['trainee_id'],
      });
      unemployed = Math.max(0, certified - placedRows.length);
    }

    const [retention3m, retention6m, retention12m, retention24m, wageRaw] =
      await Promise.all([
        this.getRetention(90),
        this.getRetention(180),
        this.getRetention(365),
        this.getRetention(730),
        this.wageProgression(),
      ]);

    const avgMonthly = avgSalary._avg.current_salary
      ? Math.round(Number(avgSalary._avg.current_salary))
      : null;

    const wage_progression = {
      start: avgMonthly ?? wageRaw['90d']?.avg_salary ?? 0,
      m6: wageRaw['180d']?.avg_salary ?? 0,
      m12: wageRaw['365d']?.avg_salary ?? 0,
    };

    const [
      enrolledCount,
      certifiedWithCertCount,
      placedCount,
      funnelRetention,
      outcomeByType,
      followUpStats,
      nonPlacementRows,
      verificationByStatus,
    ] = await Promise.all([
      this.prisma.trainingRecord
        .findMany({ select: { trainee_id: true }, distinct: ['trainee_id'] })
        .then((r) => r.length),
      this.prisma.trainingRecord
        .findMany({
          where: { status: 'completed', certification_date: { not: null } },
          select: { trainee_id: true },
          distinct: ['trainee_id'],
        })
        .then((r) => r.length),
      this.prisma.employmentRecord
        .findMany({
          where: { leaving_date: null },
          select: { trainee_id: true },
          distinct: ['trainee_id'],
        })
        .then((r) => r.length),
      Promise.all([
        this.getRetentionCount(90),
        this.getRetentionCount(180),
        this.getRetentionCount(365),
        this.getRetentionCount(730),
      ]),
      this.prisma.employmentRecord.groupBy({
        by: ['employment_type'],
        where: { leaving_date: null },
        _count: { id: true },
      }),
      this.prisma.followUp.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.$queryRaw<{ reason: string; count: bigint }[]>`
        SELECT non_placement_reason AS reason, COUNT(*) AS count
        FROM follow_ups
        WHERE non_placement_reason IS NOT NULL AND non_placement_reason <> ''
        GROUP BY non_placement_reason
        ORDER BY count DESC
      `,
      this.prisma.employmentRecord.groupBy({
        by: ['verification_status'],
        where: { leaving_date: null },
        _count: { id: true },
      }),
    ]);

    const activeEmployments = await this.prisma.employmentRecord.findMany({
      where: { leaving_date: null, confidence_score: { not: null } },
      select: { confidence_score: true },
    });

    const confidenceBands = { high: 0, medium: 0, low: 0, unverified: 0 };
    for (const e of activeEmployments) {
      const score = Number(e.confidence_score ?? 0);
      if (score >= 80) confidenceBands.high++;
      else if (score >= 50) confidenceBands.medium++;
      else if (score >= 20) confidenceBands.low++;
      else confidenceBands.unverified++;
    }

    const followUpMap = Object.fromEntries(
      followUpStats.map((s) => [s.status, s._count.id]),
    ) as Record<string, number>;
    const responded = followUpMap['responded'] ?? 0;
    const failed = followUpMap['failed'] ?? 0;
    const followUpTotal = responded + failed;
    const responseRate =
      followUpTotal > 0 ? Math.round((responded / followUpTotal) * 100) : 0;

    const verificationMap = Object.fromEntries(
      verificationByStatus.map((v) => [v.verification_status, v._count.id]),
    );

    const employmentTypeLabels: Record<string, string> = {
      full_time: 'Employed (full time)',
      part_time: 'Employed (part time)',
      contract: 'Contract',
      self_employed: 'Self-employed',
      apprenticeship: 'Apprenticeship',
    };

    const outcome_breakdown = [
      ...outcomeByType.map((o) => ({
        label: employmentTypeLabels[o.employment_type] ?? o.employment_type,
        count: o._count.id,
        type: o.employment_type,
      })),
      { label: 'Unemployed', count: unemployed, type: 'unemployed' },
      { label: 'Unreachable', count: unreachable, type: 'unreachable' },
    ].filter((o) => o.count > 0);

    const nonPlacementTotal = nonPlacementRows.reduce(
      (s, r) => s + Number(r.count),
      0,
    );
    const non_placement_reasons = nonPlacementRows.map((r) => ({
      reason: r.reason,
      count: Number(r.count),
      percentage:
        nonPlacementTotal > 0
          ? Math.round((Number(r.count) / nonPlacementTotal) * 1000) / 10
          : 0,
    }));

    return {
      trained,
      certified,
      verified_employed: verifiedEmployed,
      unemployed,
      unreachable,
      total_trainees: totalTrainees,
      total_placements: totalPlacements,
      verified_placements: verifiedEmployed,
      avg_monthly_salary: avgMonthly,
      retention: {
        '3m': retention3m,
        '6m': retention6m,
        '12m': retention12m,
        '24m': retention24m,
      },
      wage_progression,
      funnel: {
        enrolled: enrolledCount,
        trained,
        certified: certifiedWithCertCount,
        placed: placedCount,
        verified: verifiedEmployed,
        retention_3m: funnelRetention[0],
        retention_6m: funnelRetention[1],
        retention_12m: funnelRetention[2],
        retention_24m: funnelRetention[3],
      },
      outcome_breakdown,
      follow_up_monitoring: {
        scheduled: followUpMap['scheduled'] ?? 0,
        sent: followUpMap['sent'] ?? 0,
        responded,
        failed,
        cancelled: followUpMap['cancelled'] ?? 0,
        response_rate: responseRate,
      },
      non_placement_reasons,
      verification: {
        self_reported: verificationMap['self_reported'] ?? 0,
        pending: verificationMap['pending'] ?? 0,
        employer_confirmed: verificationMap['employer_confirmed'] ?? 0,
        evidence_confirmed: verificationMap['evidence_confirmed'] ?? 0,
        rejected: verificationMap['rejected'] ?? 0,
        confidence: confidenceBands,
      },
    };
  }

  /** Count of certified trainees still employed N days after certification. */
  async getRetentionCount(daysAfterCert: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysAfterCert);

    const traineesWithCert = await this.prisma.trainee.findMany({
      where: {
        consent_given: true,
        training_records: {
          some: {
            certification_date: { lte: cutoff },
            status: 'completed',
          },
        },
      },
      include: {
        employment_records: {
          where: { leaving_date: null },
          take: 1,
        },
      },
    });

    return traineesWithCert.filter((t) => t.employment_records.length > 0)
      .length;
  }

  /** Retention rate: % of trainees with active employment N days after certification. */
  async getRetention(daysAfterCert: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysAfterCert);

    const traineesWithCert = await this.prisma.trainee.findMany({
      where: {
        consent_given: true,
        training_records: {
          some: {
            certification_date: { lte: cutoff },
            status: 'completed',
          },
        },
      },
      include: {
        employment_records: {
          where: { leaving_date: null },
          take: 1,
        },
      },
    });

    if (traineesWithCert.length === 0) return 0;
    const placed = traineesWithCert.filter(
      (t) => t.employment_records.length > 0,
    ).length;
    return Math.round((placed / traineesWithCert.length) * 100);
  }

  /** Wage progression: avg salary by months-after-training buckets. */
  async wageProgression() {
    const buckets = [90, 180, 365, 730];
    const results: Record<string, { avg_salary: number; count: number }> = {};

    for (const days of buckets) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);

      const rows = await this.prisma.$queryRaw<
        { avg_salary: number; cnt: bigint }[]
      >`
        SELECT AVG(e.current_salary)::float AS avg_salary, COUNT(*) AS cnt
        FROM employment_records e
        JOIN training_records t ON e.training_id = t.id
        WHERE t.certification_date <= ${cutoff}
          AND e.current_salary IS NOT NULL
          AND e.leaving_date IS NULL
      `;

      results[`${days}d`] = {
        avg_salary: rows[0]?.avg_salary ? Math.round(rows[0].avg_salary) : 0,
        count: Number(rows[0]?.cnt ?? 0),
      };
    }

    return results;
  }

  /** Provider ranking: top providers by placement rate (contract-friendly shape). */
  async providerRanking() {
    const rows = await this.prisma.$queryRaw<
      {
        provider_id: string;
        name: string;
        district_id: number | null;
        total_trainees: bigint;
        placements: bigint;
        placement_rate: number;
      }[]
    >`
      SELECT
        p.id AS provider_id,
        p.name,
        p.district_id,
        COUNT(DISTINCT tr.trainee_id) AS total_trainees,
        COUNT(DISTINCT er.trainee_id) AS placements,
        CASE
          WHEN COUNT(DISTINCT tr.trainee_id) > 0
          THEN ROUND(COUNT(DISTINCT er.trainee_id)::numeric / COUNT(DISTINCT tr.trainee_id) * 100, 1)
          ELSE 0
        END AS placement_rate
      FROM training_providers p
      JOIN training_records tr ON tr.provider_id = p.id
      LEFT JOIN employment_records er ON er.trainee_id = tr.trainee_id
        AND er.leaving_date IS NULL
      GROUP BY p.id, p.name, p.district_id
      HAVING COUNT(DISTINCT tr.trainee_id) > 0
      ORDER BY placement_rate DESC
      LIMIT 20
    `;

    return rows.map((r) => ({
      id: r.provider_id,
      name: r.name,
      placement: Number(r.placement_rate),
      retention: null as number | null,
      district:
        r.district_id != null
          ? (DISTRICT_NAMES[r.district_id] ?? `District ${r.district_id}`)
          : '—',
      total_trainees: Number(r.total_trainees),
      placements: Number(r.placements),
    }));
  }

  /** District analytics: trainees, placements, retention by district. */
  async districtAnalytics() {
    const rows = await this.prisma.$queryRaw<
      { district_id: number; total_trainees: bigint; placements: bigint }[]
    >`
      SELECT
        t.district_id,
        COUNT(*) AS total_trainees,
        COUNT(e.id) AS placements
      FROM trainees t
      LEFT JOIN employment_records e ON e.trainee_id = t.id AND e.leaving_date IS NULL
      WHERE t.consent_given = true AND t.district_id IS NOT NULL
      GROUP BY t.district_id
      ORDER BY total_trainees DESC
      LIMIT 50
    `;
    return rows.map((r) => ({
      district_id: Number(r.district_id),
      district_name:
        DISTRICT_NAMES[Number(r.district_id)] ?? `District ${r.district_id}`,
      total_trainees: Number(r.total_trainees),
      placements: Number(r.placements),
    }));
  }

  /** District detail — GET /analytics/district/:id per API-CONTRACT.md. */
  async districtById(idParam: string) {
    const districtId = resolveDistrictId(idParam);

    const [summaryRows, sectorRows] = await Promise.all([
      this.prisma.$queryRaw<
        { total_trainees: bigint; placements: bigint }[]
      >`
        SELECT
          COUNT(DISTINCT t.id) AS total_trainees,
          COUNT(DISTINCT e.id) AS placements
        FROM trainees t
        LEFT JOIN employment_records e ON e.trainee_id = t.id AND e.leaving_date IS NULL
        WHERE t.consent_given = true AND t.district_id = ${districtId}
      `,
      this.prisma.$queryRaw<{ sector: string; employed: bigint }[]>`
        SELECT
          COALESCE(tr.sector, 'Unknown') AS sector,
          COUNT(DISTINCT er.trainee_id) AS employed
        FROM trainees t
        JOIN training_records tr ON tr.trainee_id = t.id
        LEFT JOIN employment_records er ON er.trainee_id = t.id AND er.leaving_date IS NULL
        WHERE t.consent_given = true AND t.district_id = ${districtId}
        GROUP BY tr.sector
        ORDER BY employed DESC
        LIMIT 10
      `,
    ]);

    const summary = summaryRows[0];
    const totalTrainees = Number(summary?.total_trainees ?? 0);
    const placements = Number(summary?.placements ?? 0);

    return {
      district_id: districtId,
      district_name: DISTRICT_NAMES[districtId] ?? `District ${districtId}`,
      total_trainees: totalTrainees,
      placements,
      placement_rate:
        totalTrainees > 0
          ? Math.round((placements / totalTrainees) * 1000) / 10
          : 0,
      topSectors: sectorRows.map((s) => ({
        sector: s.sector,
        employed: Number(s.employed),
      })),
    };
  }

  /** Course analytics: placement rate by sector/course. */
  async courseAnalytics() {
    const rows = await this.prisma.$queryRaw<
      {
        sector: string;
        total_trainees: bigint;
        placements: bigint;
        placement_rate: number;
      }[]
    >`
      SELECT
        COALESCE(tr.sector, 'Unknown') AS sector,
        COUNT(DISTINCT tr.trainee_id) AS total_trainees,
        COUNT(DISTINCT er.trainee_id) AS placements,
        CASE
          WHEN COUNT(DISTINCT tr.trainee_id) > 0
          THEN ROUND(COUNT(DISTINCT er.trainee_id)::numeric / COUNT(DISTINCT tr.trainee_id) * 100, 1)
          ELSE 0
        END AS placement_rate
      FROM training_records tr
      LEFT JOIN employment_records er ON er.trainee_id = tr.trainee_id
        AND er.leaving_date IS NULL
      GROUP BY tr.sector
      HAVING COUNT(DISTINCT tr.trainee_id) > 0
      ORDER BY placement_rate DESC
    `;

    return rows.map((r) => ({
      sector: r.sector,
      total_trainees: Number(r.total_trainees),
      placements: Number(r.placements),
      placement_rate: Number(r.placement_rate),
    }));
  }
}
