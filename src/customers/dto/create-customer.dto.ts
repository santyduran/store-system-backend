import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateCustomerDto {
  @IsEnum([
    'CC',
    'CE',
    'NIT',
    'PASSPORT',
    'OTHER',
  ])
  documentType:
    | 'CC'
    | 'CE'
    | 'NIT'
    | 'PASSPORT'
    | 'OTHER';

  @IsString()
  @MaxLength(30)
  documentNumber: string;

  @IsString()
  @MaxLength(100)
  firstName: string;

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
}