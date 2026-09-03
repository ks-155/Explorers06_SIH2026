import { ConfidenceScoreService } from './confidence-score.service';
import { EvidenceType } from '@prisma/client';

describe('ConfidenceScoreService', () => {
  let service: ConfidenceScoreService;

  beforeEach(() => {
    service = new ConfidenceScoreService();
  });

  it('self-report only -> 20 / LOW / UNVERIFIED-level boundary', () => {
    const r = service.calculate(true, false, [] as EvidenceType[]);
    expect(r.total).toBe(20);
    expect(r.level).toBe('LOW');
  });

  it('self + employer confirm -> 60 / MEDIUM', () => {
    const r = service.calculate(true, true, []);
    expect(r.total).toBe(60);
    expect(r.level).toBe('MEDIUM');
  });

  it('employer_confirmation evidence not double-counted when employer confirmed', () => {
    const r = service.calculate(true, true, ['employer_confirmation']);
    expect(r.total).toBe(60);
    expect(
      r.evidence.filter((e) => e.type === 'employer_confirmation'),
    ).toHaveLength(1);
  });

  it('full evidence stack caps at 100 / HIGH', () => {
    const r = service.calculate(true, true, [
      'salary_slip',
      'bank_statement',
      'offer_letter',
      'udyam_link',
      'epfo_check',
    ]);
    expect(r.total).toBe(100);
    expect(r.level).toBe('HIGH');
  });

  it('achievable mid-tier: self+employer+slip+bank+offer = 95 / HIGH (evidence order independent)', () => {
    const r1 = service.calculate(true, true, [
      'salary_slip',
      'bank_statement',
      'offer_letter',
    ]);
    expect(r1.total).toBe(95);
    expect(r1.level).toBe('HIGH');
  });

  it('self+employer+slip+bank = 85 / HIGH', () => {
    const r = service.calculate(true, true, ['salary_slip', 'bank_statement']);
    expect(r.total).toBe(85);
    expect(r.level).toBe('HIGH');
  });

  it('level boundaries: 49 LOW, 50 MEDIUM, 79 MEDIUM, 80 HIGH, 0 UNVERIFIED', () => {
    expect(service.getLevel(0)).toBe('UNVERIFIED');
    expect(service.getLevel(19)).toBe('UNVERIFIED');
    expect(service.getLevel(49)).toBe('LOW');
    expect(service.getLevel(50)).toBe('MEDIUM');
    expect(service.getLevel(79)).toBe('MEDIUM');
    expect(service.getLevel(80)).toBe('HIGH');
  });
});
