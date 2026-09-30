import {
  IsEnum,
} from 'class-validator';

export class UpdateUserStatusDto {
  @IsEnum([
    'ACTIVE',
    'INACTIVE',
  ])
  status: 'ACTIVE' | 'INACTIVE';
}