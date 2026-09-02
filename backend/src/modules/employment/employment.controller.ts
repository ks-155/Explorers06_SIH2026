import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../../auth/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { EmploymentService } from './employment.service';
import { CreateEmploymentDto } from './dto/create-employment.dto';

@ApiTags('Employment')
@ApiBearerAuth()
@Controller('employment')
export class EmploymentController {
  constructor(private readonly employmentService: EmploymentService) {}

  @Post()
  @Roles(Role.trainee, Role.employer, Role.provider, Role.admin)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create employment record (self-reported)' })
  create(
    @Body() dto: CreateEmploymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.employmentService.create(dto, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employment record with confidence score' })
  findOne(@Param('id') id: string) {
    return this.employmentService.findById(id);
  }
}
