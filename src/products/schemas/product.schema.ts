import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({
  timestamps: true,
  collection: 'Products',
})
export class Product {
  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    trim: true,
  })
  description?: string;

  @Prop({
    trim: true,
    unique: true,
    sparse: true,
  })
  sku?: string;

  @Prop({
    trim: true,
    unique: true,
    sparse: true,
  })
  barcode?: string;

  @Prop({
    trim: true,
  })
  brand?: string;

  @Prop({
    type: Object,
  })
  attributes?: Record<string, unknown>;

  @Prop({
    required: true,
    min: 0,
  })
  purchasePrice: number;

  @Prop({
    required: true,
    min: 0,
  })
  salePrice: number;

  @Prop({
    required: true,
    min: 0,
    default: 0,
  })
  stock: number;

  @Prop({
    required: true,
    min: 0,
    default: 0,
  })
  minStock: number;

  @Prop({
    type: Types.ObjectId,
    ref: 'Category',
    required: true,
  })
  category: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE',
  })
  status: string;
}

export const ProductSchema =
  SchemaFactory.createForClass(Product);