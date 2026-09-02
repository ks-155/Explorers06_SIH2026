import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateConsentDto {
  @ApiProperty({ description: 'New consent opt-in/out flag' })
  @IsBoolean()
  consent_given!: boolean;

  @ApiProperty({
    description:
      'Consent doc version being accepted/withdrawn, required on every write',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  consent_version!: string;
}
