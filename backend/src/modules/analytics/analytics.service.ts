import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Dashboard KPIs: total trainees, placements, retention, avg wage. */
  async dashboard() {
    const [totalTrainees, totalPlacements, verifiedPlacements, avgSalary] =
      await Promise.all([
        this.prisma.trainee.count({ where: { consent_given: true } }),
        this.prisma.employmentRecord.count(),
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
      ]);

    const retention3m = await this.getRetention(90);
    const retention6m = await this.getRetention(180);
    const retention12m = await this.getRetention(365);
    const retention24m = await this.getRetention(730);

    return {
      total_trainees: totalTrainees,
      total_placements: totalPlacements,
      verified_placements: verifiedPlacements,
      avg_monthly_salary: avgSalary._avg.current_salary
        ? Number(avgSalary._avg.current_salary)
        : null,
      retention: {
        '3m': retention3m,
        '6m': retention6m,
        '12m': retention12m,
        '24m': retention24m,
      },
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

  /** Provider ranking: top providers by placement rate. */
  async providerRanking() {
    return this.prisma.$queryRaw<
      {
        provider_id: string;
        name: string;
        total_trainees: bigint;
        placements: bigint;
        placement_rate: number;
      }[]
    >`
      SELECT
        p.id AS provider_id,
        p.name,
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
      GROUP BY p.id, p.name
      HAVING COUNT(DISTINCT tr.trainee_id) > 0
      ORDER BY placement_rate DESC
      LIMIT 20
    `;
  }

  /** District analytics: trainees, placements, retention by district. */
  async districtAnalytics() {
    return this.prisma.$queryRaw<
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
}
