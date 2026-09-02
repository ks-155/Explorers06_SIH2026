import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connection established');
    } catch (error) {
      // Do not crash the app during startup when the database is not yet
      // reachable (e.g. before `docker compose up`). The /health endpoint
      // reports database status. Connection retries on first query.
      this.logger.warn(
        `Database not reachable at startup (${(error as Error).message}). ` +
          `Run the database first, then retry.`,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
