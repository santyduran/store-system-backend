import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateCustomerDto {
  @IsOptional()
  @IsEnum([
    'CC',
    'CE',
    'NIT',
    'PASSPORT',
    'OTHER',
  ])
  documentType?:
    | 'CC'
    | 'CE'
    | 'NIT'
    | 'PASSPORT'
    | 'OTHER';

  @IsOptional()
  @IsString()
  @MaxLength(30)
  documentNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsEnum([
    'ACTIVE',
    'INACTIVE',
  ])
  status?: 'ACTIVE' | 'INACTIVE';
}