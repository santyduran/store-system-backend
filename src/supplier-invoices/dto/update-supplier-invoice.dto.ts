import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateSupplierInvoiceDto {
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum([
    'PENDING',
    'PAID',
    'OVERDUE',
    'CANCELLED',
  ])
  status?:
    | 'PENDING'
    | 'PAID'
    | 'OVERDUE'
    | 'CANCELLED';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observations?: string;
}