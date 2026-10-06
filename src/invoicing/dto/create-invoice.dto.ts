import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class InvoiceCustomerDto {
  @IsEnum(['CC', 'CE', 'NIT', 'PASSPORT', 'OTHER'])
  documentType: 'CC' | 'CE' | 'NIT' | 'PASSPORT' | 'OTHER';

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  documentNumber: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  firstName: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;
}

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty()
  saleId: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  prefix?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  invoiceNumber?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => InvoiceCustomerDto)
  customer?: InvoiceCustomerDto;
}