import {
  IsArray,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import {
  Type,
} from 'class-transformer';

export class CreateSupplierInvoiceItemDto {
  @IsMongoId()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitCost: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate: number;
}

export class CreateSupplierInvoiceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  invoiceNumber: string;

  @IsMongoId()
  @IsNotEmpty()
  providerId: string;

  @IsDateString()
  @IsNotEmpty()
  issueDate: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSupplierInvoiceItemDto)
  items: CreateSupplierInvoiceItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observations?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplierInvoiceNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  authorizationNumber?: string;
}