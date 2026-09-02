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
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { EmployersService } from './employers.service';
import { CreateEmployerDto } from './dto/create-employer.dto';
import { VerifyEmploymentDto } from './dto/verify-employer.dto';

@ApiTags('Employers')
@ApiBearerAuth()
@Controller('employers')
export class EmployersController {
  constructor(private readonly employersService: EmployersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register employer' })
  create(@Body() dto: CreateEmployerDto) {
    return this.employersService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employer details' })
  findOne(@Param('id') id: string) {
    return this.employersService.findById(id);
  }

  @Get(':id/verify-pending')
  @ApiOperation({ summary: 'Get pending verifications for employer' })
  findPending(@Param('id') id: string) {
    return this.employersService.findPendingVerifications(id);
  }

  @Post(':id/verify-employment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Employer confirms or denies employment claim' })
  verifyEmployment(
    @Param('id') _employerId: string,
    @Body() dto: VerifyEmploymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.employersService.verifyEmployment(dto, user.id);
  }
}
