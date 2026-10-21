import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateProviderDto {
  @IsString()
  @MaxLength(150)
  businessName: string;

  @IsString()
  @MaxLength(30)
  nit: string;

  @IsString()
  @MaxLength(2)
  verificationDigit: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  contactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  bankAccountNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  bankAccountType?: string;
}