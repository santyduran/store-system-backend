import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsMongoId,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateInventoryMovementDto {
  @IsMongoId()
  @IsNotEmpty()
  productId: string;

  @IsEnum(['IN', 'OUT', 'ADJUSTMENT'])
  @IsNotEmpty()
  type: 'IN' | 'OUT' | 'ADJUSTMENT';

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}