import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SkillGapsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.skillGap.findMany({
      orderBy: { created_at: 'desc' },
    });
  }
}
