import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EmployersService } from './employers.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { ConfidenceScoreService } from '../verification/confidence-score.service';

describe('EmployersService.findById (ownership)', () => {
  let service: EmployersService;

  const employerId = '22222222-2222-4222-8222-222222222222';
  const otherId = '33333333-3333-4333-8333-333333333333';

  const fakeEmployer = {
    id: employerId,
    name: 'E',
    employment_records: [{ verification_status: 'pending' }],
  };

  const build = async (mockFind: any) => {
    const prisma = {
      employer: { findUnique: jest.fn().mockImplementation(mockFind) },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { record: jest.fn() } },
        {
          provide: ConfidenceScoreService,
          useValue: new ConfidenceScoreService(),
        },
      ],
    }).compile();
    service = module.get<EmployersService>(EmployersService);
  };

  beforeEach(async () => {
    await build(() => fakeEmployer);
  });

  it('throws NotFound when employer missing', async () => {
    await build(() => null);
    await expect(
      service.findById(employerId, { role: 'admin' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('owning employer can read own profile', async () => {
    await expect(
      service.findById(employerId, { role: 'employer', employerId }),
    ).resolves.toMatchObject({ id: employerId, pending_verifications: 1 });
  });

  it('employer cannot read another org profile', async () => {
    await expect(
      service.findById(employerId, { role: 'employer', employerId: otherId }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('admin can read any employer profile', async () => {
    await expect(
      service.findById(employerId, { role: 'admin', employerId: otherId }),
    ).resolves.toMatchObject({ id: employerId });
  });
});
