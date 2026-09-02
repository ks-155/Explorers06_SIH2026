import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmploymentService } from './employment.service';
import { CreateEmploymentDto } from './dto/create-employment.dto';

@ApiTags('Employment')
@ApiBearerAuth()
@Controller('employment')
export class EmploymentController {
  constructor(private readonly employmentService: EmploymentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create employment record (self-reported)' })
  create(@Body() dto: CreateEmploymentDto) {
    return this.employmentService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employment record with confidence score' })
  findOne(@Param('id') id: string) {
    return this.employmentService.findById(id);
  }
}
