import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import {
  Type,
} from 'class-transformer';

class UpdatePendingSaleItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class UpdatePendingSaleDto {
  @IsArray()
  @ValidateNested({
    each: true,
  })
  @Type(() => UpdatePendingSaleItemDto)
  items: UpdatePendingSaleItemDto[];

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;
}