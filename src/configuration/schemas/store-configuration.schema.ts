import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type StoreConfigurationDocument =
  HydratedDocument<StoreConfiguration>;

@Schema({
  timestamps: true,
})
export class StoreConfiguration {
  @Prop({
    required: true,
    trim: true,
    default: 'Store System',
  })
  storeName: string;

  @Prop({
    trim: true,
  })
  logoUrl?: string;

  @Prop({
    trim: true,
  })
  phone?: string;

  @Prop({
    trim: true,
  })
  address?: string;

  @Prop({
    trim: true,
  })
  email?: string;

  @Prop({
    trim: true,
  })
  instagram?: string;

  @Prop({
    trim: true,
  })
  facebook?: string;

  @Prop({
    trim: true,
  })
  tiktok?: string;

  @Prop({
    trim: true,
  })
  receiptMessage?: string;
}

export const StoreConfigurationSchema =
  SchemaFactory.createForClass(
    StoreConfiguration,
  );