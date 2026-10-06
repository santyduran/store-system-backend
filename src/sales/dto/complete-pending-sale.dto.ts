import {
  IsEnum,
} from 'class-validator';

export class CompletePendingSaleDto {
  @IsEnum([
    'CASH',
    'CARD',
    'TRANSFER',
  ])
  paymentMethod:
    | 'CASH'
    | 'CARD'
    | 'TRANSFER';
}