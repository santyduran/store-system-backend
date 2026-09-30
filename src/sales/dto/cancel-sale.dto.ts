import {
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CancelSaleDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancellationReason?: string;
}