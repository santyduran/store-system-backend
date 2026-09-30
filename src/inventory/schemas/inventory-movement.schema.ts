import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type InventoryMovementDocument =
  HydratedDocument<InventoryMovement>;

@Schema({
  timestamps: true,
})
export class InventoryMovement {
  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
    required: true,
  })
  productId: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['IN', 'OUT', 'ADJUSTMENT'],
  })
  type: string;

  @Prop({
    required: true,
    min: 0,
  })
  quantity: number;

  @Prop({
    required: true,
    min: 0,
  })
  previousStock: number;

  @Prop({
    required: true,
    min: 0,
  })
  newStock: number;

  @Prop({
    trim: true,
  })
  reason?: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: Types.ObjectId;
}

export const InventoryMovementSchema =
  SchemaFactory.createForClass(InventoryMovement);