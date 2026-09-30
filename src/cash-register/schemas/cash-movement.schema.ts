import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

export type CashMovementDocument =
  HydratedDocument<CashMovement>;

@Schema({
  timestamps: true,
})
export class CashMovement {
  @Prop({
    type: Types.ObjectId,
    ref: 'CashRegister',
    required: true,
  })
  cashRegisterId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    enum: [
      'OPENING',
      'SALE',
      'SALE_CANCELLATION',
    ],
  })
  type: string;

  @Prop({
    required: true,
    enum: [
      'IN',
      'OUT',
    ],
  })
  movementType: string;

  @Prop({
    required: true,
    min: 0,
  })
  amount: number;

  @Prop({
    type: Types.ObjectId,
    ref: 'Sale',
  })
  saleId?: Types.ObjectId;

  @Prop({
    trim: true,
  })
  description?: string;
}

export const CashMovementSchema =
  SchemaFactory.createForClass(
    CashMovement,
  );