import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const [trainedCount, certifiedCount, verifiedEmployedCount, avgSalary, unreachableCount] =
      await Promise.all([
        this.prisma.trainee.count({ where: { consent_given: true } }),
        this.prisma.trainingRecord.count({ where: { status: 'completed' } }),
        this.prisma.employmentRecord.count({
          where: {
            verification_status: {
              in: ['employer_confirmed', 'evidence_confirmed'],
            },
          },
        }),
        this.prisma.employmentRecord.aggregate({
          _avg: { current_salary: true },
          where: { current_salary: { not: null } },
        }),
        this.prisma.followUp.count({ where: { status: 'failed' } }),
      ]);

    const allTrained = await this.prisma.trainee.findMany({
      where: { consent_given: true },
      include: {
        employment_records: {
          where: { leaving_date: null },
          take: 1,
        },
      },
    });

    const withActiveEmployment = allTrained.filter(
      (t) => t.employment_records.length > 0,
    ).length;

    const unemployed = allTrained.length - withActiveEmployment - unreachableCount;

    const retention3m = await this.getRetention(90);
    const retention6m = await this.getRetention(180);
    const retention12m = await this.getRetention(365);
    const retention24m = await this.getRetention(730);

    const wageBuckets = [90, 180, 365, 730];
    const wageProgression: Record<string, { avg_salary: number; count: number }> = {};

    for (const days of wageBuckets) {
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

      wageProgression[`${days}d`] = {
        avg_salary: rows[0]?.avg_salary ? Math.round(rows[0].avg_salary) : 0,
        count: Number(rows[0]?.cnt ?? 0),
      };
    }

    return {
      trained: trainedCount,
      certified: certifiedCount,
      verified_employed: verifiedEmployedCount,
      unemployed,
      unreachable: unreachableCount,
      retention: {
        '3m': retention3m,
        '6m': retention6m,
        '12m': retention12m,
        '24m': retention24m,
      },
      wage_progression: {
        start: wageProgression['90d']?.avg_salary ?? 0,
        m6: wageProgression['180d']?.avg_salary ?? 0,
        m12: wageProgression['365d']?.avg_salary ?? 0,
      },
      avg_monthly_salary: avgSalary._avg.current_salary
        ? Number(avgSalary._avg.current_salary)
        : null,
    };
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

  async providerRanking() {
    const rows = await this.prisma.$queryRaw<
      {
        provider_id: string;
        name: string;
        district_id: number | null;
        total_trainees: bigint;
        placements: bigint;
        placement_rate: number;
        retention_pct: number;
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
        END AS placement_rate,
        CASE
          WHEN COUNT(DISTINCT tr.trainee_id) > 0
          THEN ROUND(
            COUNT(DISTINCT CASE WHEN er.leaving_date IS NULL THEN er.trainee_id END)::numeric
            / COUNT(DISTINCT tr.trainee_id) * 100, 1
          )
          ELSE 0
        END AS retention_pct
      FROM training_providers p
      JOIN training_records tr ON tr.provider_id = p.id
      LEFT JOIN employment_records er ON er.trainee_id = tr.trainee_id
      GROUP BY p.id, p.name, p.district_id
      HAVING COUNT(DISTINCT tr.trainee_id) > 0
      ORDER BY placement_rate DESC
      LIMIT 20
    `;
    return rows.map((r) => ({
      provider_id: r.provider_id,
      name: r.name,
      id: r.provider_id,
      district_id: r.district_id,
      total_trainees: Number(r.total_trainees),
      placements: Number(r.placements),
      placement: Number(r.placement_rate),
      placement_rate: Number(r.placement_rate),
      retention: Number(r.retention_pct),
      retention_pct: Number(r.retention_pct),
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
      district_id: r.district_id,
      total_trainees: Number(r.total_trainees),
      placements: Number(r.placements),
    }));
  }

  /** Course analytics: placement rate by sector/course. */
  async courseAnalytics() {
    return this.prisma.$queryRaw<
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
  }

  async districtById(id: string) {
    const districtId = parseInt(id, 10);
    if (isNaN(districtId)) return null;

    const [districtStats] = await this.prisma.$queryRaw<any[]>`
      SELECT
        t.district_id,
        COUNT(DISTINCT t.id) AS total_trainees,
        COUNT(DISTINCT e.id) AS placements,
        COUNT(DISTINCT CASE WHEN e.verification_status IN ('employer_confirmed', 'evidence_confirmed') THEN e.id END) AS verified_placements
      FROM trainees t
      LEFT JOIN employment_records e ON e.trainee_id = t.id AND e.leaving_date IS NULL
      WHERE t.consent_given = true AND t.district_id = ${districtId}
      GROUP BY t.district_id
    `;

    const sectors = await this.prisma.$queryRaw<any[]>`
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
      JOIN trainees t ON tr.trainee_id = t.id
      LEFT JOIN employment_records er ON er.trainee_id = tr.trainee_id AND er.leaving_date IS NULL
      WHERE t.consent_given = true AND t.district_id = ${districtId}
      GROUP BY tr.sector
      HAVING COUNT(DISTINCT tr.trainee_id) > 0
      ORDER BY placement_rate DESC
    `;

    if (!districtStats) {
      return { district_id: districtId, total_trainees: 0, placements: 0, verified_placements: 0, sectors: [] };
    }

    return {
      district_id: Number(districtStats.district_id),
      total_trainees: Number(districtStats.total_trainees),
      placements: Number(districtStats.placements),
      verified_placements: Number(districtStats.verified_placements),
      sectors: sectors.map((s) => ({
        sector: s.sector,
        total_trainees: Number(s.total_trainees),
        placements: Number(s.placements),
        placement_rate: Number(s.placement_rate),
        employed: Number(s.placements),
      })),
    };
  }

  async followUpMonitoring() {
    const [statusCounts] = await this.prisma.$queryRaw`
      SELECT
        COUNT(*) FILTER (WHERE status = 'scheduled') AS scheduled,
        COUNT(*) FILTER (WHERE status = 'sent') AS sent,
        COUNT(*) FILTER (WHERE status = 'responded') AS responded,
        COUNT(*) FILTER (WHERE status = 'failed') AS failed,
        COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
        COUNT(*) AS total
      FROM follow_ups
    ` as any;

    const nonPlacementReasons = await this.prisma.$queryRaw`
      SELECT non_placement_reason, COUNT(*) AS count
      FROM follow_ups
      WHERE non_placement_reason IS NOT NULL AND non_placement_reason != ''
      GROUP BY non_placement_reason
      ORDER BY count DESC
      LIMIT 10
    ` as any;

    return {
      status_breakdown: {
        scheduled: Number(statusCounts?.scheduled ?? 0),
        sent: Number(statusCounts?.sent ?? 0),
        responded: Number(statusCounts?.responded ?? 0),
        failed: Number(statusCounts?.failed ?? 0),
        cancelled: Number(statusCounts?.cancelled ?? 0),
        total: Number(statusCounts?.total ?? 0),
      },
      non_placement_reasons: nonPlacementReasons.map((r: any) => ({
        reason: r.non_placement_reason,
        count: Number(r.count),
      })),
    };
  }

  async outcomeFunnel() {
    const totalRegistered = await this.prisma.trainee.count({ where: { consent_given: true } });
    const totalTrained = await this.prisma.trainingRecord.count({ where: { status: 'completed' } });
    const totalCertified = await this.prisma.trainingRecord.count({ where: { status: 'completed', certification_id: { not: null } } });
    const totalEmployed = await this.prisma.employmentRecord.count();
    const totalVerified = await this.prisma.employmentRecord.count({ where: { verification_status: { in: ['employer_confirmed', 'evidence_confirmed'] } } });
    const totalActive = await this.prisma.employmentRecord.count({ where: { leaving_date: null } });

    return {
      registered: totalRegistered,
      trained: totalTrained,
      certified: totalCertified,
      employed: totalEmployed,
      verified_employed: totalVerified,
      active_retained: totalActive,
    };
  }

  async outcomeBreakdown() {
    const breakdown = await this.prisma.$queryRaw`
      SELECT
        employment_type,
        COUNT(*) AS count,
        COUNT(*) FILTER (WHERE verification_status IN ('employer_confirmed', 'evidence_confirmed')) AS verified
      FROM employment_records
      GROUP BY employment_type
      ORDER BY count DESC
    ` as any;

    const unemployedCount = await this.prisma.trainee.count({
      where: {
        consent_given: true,
        employment_records: { none: { leaving_date: null } },
      },
    });

    return {
      by_type: breakdown.map((b: any) => ({
        type: b.employment_type,
        count: Number(b.count),
        verified: Number(b.verified),
      })),
      unemployed: unemployedCount,
    };
  }
}
