import { Controller, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { IdentityMatchesService } from './identity-matches.service';

@ApiTags('Identity Matches')
@ApiBearerAuth()
@Controller('identity-matches')
export class IdentityMatchesController {
  constructor(private readonly service: IdentityMatchesService) {}

  @Post(':id/confirm')
  @Roles(Role.admin, Role.provider, Role.government)
  @ApiOperation({ summary: 'Confirm a merge (commit dedup)' })
  confirm(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.service.confirm(id, actor);
  }

  @Post(':id/reject')
  @Roles(Role.admin, Role.provider, Role.government)
  @ApiOperation({ summary: 'Reject a false-positive match' })
  reject(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.service.reject(id, actor);
  }
}
