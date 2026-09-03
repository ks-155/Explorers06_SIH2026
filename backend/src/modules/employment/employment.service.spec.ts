import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EmploymentService } from './employment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';

describe('EmploymentService.findById (ownership)', () => {
  let service: EmploymentService;

  const traineeId = '11111111-1111-4111-8111-111111111111';
  const employerId = '22222222-2222-4222-8222-222222222222';
  const otherId = '33333333-3333-4333-8333-333333333333';
  const recordId = '44444444-4444-4444-8444-444444444444';

  const fakeRecord = {
    id: recordId,
    trainee_id: traineeId,
    employer_id: employerId,
    confidence_score: 20,
    trainee: { id: traineeId, name: 'T', phone: '91xxxxxxxxxx' },
    employer: { id: employerId, name: 'E' },
    evidence: [],
    verification_status: 'self_reported',
  };

  let prisma: { employmentRecord: { findUnique: any } };

  const build = async (mockFind: any) => {
    prisma = {
      employmentRecord: {
        findUnique: jest.fn().mockImplementation(mockFind),
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmploymentService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { record: jest.fn() } },
      ],
    }).compile();
    service = module.get<EmploymentService>(EmploymentService);
  };

  beforeEach(async () => {
    await build(() => fakeRecord);
  });

  it('throws NotFound when record missing', async () => {
    await build(() => null);
    await expect(service.findById(recordId, { role: 'admin' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('admin can read any record', async () => {
    await expect(
      service.findById(recordId, { role: 'admin', id: 'a' }),
    ).resolves.toMatchObject({ id: recordId, level: 'LOW' });
  });

  it('government can read any record', async () => {
    await expect(
      service.findById(recordId, { role: 'government', id: 'g' }),
    ).resolves.toMatchObject({ id: recordId, level: 'LOW' });
  });

  it('provider can read any record', async () => {
    await expect(
      service.findById(recordId, { role: 'provider', id: 'p' }),
    ).resolves.toMatchObject({ id: recordId, level: 'LOW' });
  });

  it('owning trainee can read', async () => {
    await expect(
      service.findById(recordId, { role: 'trainee', id: 'u', traineeId }),
    ).resolves.toMatchObject({ id: recordId, level: 'LOW' });
  });

  it('unrelated trainee is forbidden', async () => {
    await expect(
      service.findById(recordId, {
        role: 'trainee',
        id: 'u',
        traineeId: otherId,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('owning employer can read', async () => {
    await expect(
      service.findById(recordId, {
        role: 'employer',
        id: 'u',
        employerId,
      }),
    ).resolves.toMatchObject({ id: recordId, level: 'LOW' });
  });

  it('employer of a different org is forbidden', async () => {
    await expect(
      service.findById(recordId, {
        role: 'employer',
        id: 'u',
        employerId: otherId,
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
