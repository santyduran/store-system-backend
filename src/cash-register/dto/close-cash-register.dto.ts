
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CloseCashRegisterDto {
  @IsNumber()
  @Min(0)
  countedCash: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  differenceReason?: string;
}
