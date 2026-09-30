import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SaleItemDocument = HydratedDocument<SaleItem>;

@Schema({
  timestamps: true,
})
export class SaleItem {
  @Prop({
    type: Types.ObjectId,
    ref: 'Sale',
    required: true,
  })
  saleId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
    required: true,
  })
  productId: Types.ObjectId;

  @Prop({
    required: true,
    min: 1,
  })
  quantity: number;

  @Prop({
    required: true,
    min: 0,
  })
  unitPrice: number;

  @Prop({
    required: true,
    min: 0,
  })
  subtotal: number;
}

export const SaleItemSchema =
  SchemaFactory.createForClass(SaleItem);
