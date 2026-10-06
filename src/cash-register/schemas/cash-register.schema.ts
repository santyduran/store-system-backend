import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

export type CashRegisterDocument =
  HydratedDocument<CashRegister>;

@Schema({
  timestamps: true,
})
export class CashRegister {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    min: 0,
  })
  openingAmount: number;

  @Prop({
    required: true,
    default: Date.now,
  })
  openingDate: Date;

  @Prop()
  closingDate?: Date;

  @Prop({
    required: true,
    min: 0,
    default: 0,
  })
  expectedCash: number;

  @Prop({
    min: 0,
  })
  countedCash?: number;

  @Prop()
  difference?: number;

  @Prop({
    required: true,
    enum: [
      'OPEN',
      'CLOSED',
    ],
    default: 'OPEN',
  })
  status: string;
}

export const CashRegisterSchema =
  SchemaFactory.createForClass(
    CashRegister,
  );