import { Module } from '@nestjs/common';
import { IdentityMatchesController } from './identity-matches.controller';
import { IdentityMatchesService } from './identity-matches.service';

@Module({
  controllers: [IdentityMatchesController],
  providers: [IdentityMatchesService],
  exports: [IdentityMatchesService],
})
export class IdentityMatchesModule {}
