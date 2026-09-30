import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

export type SaleDocument =
  HydratedDocument<Sale>;

@Schema({
  timestamps: true,
})
export class Sale {
  @Prop({
    required: true,
    unique: true,
    trim: true,
  })
  saleNumber: string;

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
  subtotal: number;

  @Prop({
    required: true,
    min: 0,
    default: 0,
  })
  discount: number;

  @Prop({
    required: true,
    min: 0,
  })
  total: number;

  @Prop({
    required: true,
    enum: [
      'CASH',
      'CARD',
      'TRANSFER',
    ],
  })
  paymentMethod: string;

  @Prop({
    required: true,
    enum: [
      'COMPLETED',
      'CANCELLED',
    ],
    default: 'COMPLETED',
  })
  status: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
  })
  cancelledBy?: Types.ObjectId;

  @Prop()
  cancelledAt?: Date;

  @Prop({
    trim: true,
    maxlength: 500,
  })
  cancellationReason?: string;
}

export const SaleSchema =
  SchemaFactory.createForClass(Sale);