import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class PaySupplierInvoiceDto {
  @IsEnum([
    'CASH',
    'CARD',
    'TRANSFER',
  ])
  @IsNotEmpty()
  paymentMethod:
    | 'CASH'
    | 'CARD'
    | 'TRANSFER';

  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observations?: string;
}