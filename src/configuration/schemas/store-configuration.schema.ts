import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
} from 'mongoose';

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
  legalName?: string;

  @Prop({
    trim: true,
  })
  nit?: string;

  @Prop({
    trim: true,
  })
  dv?: string;

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
  city?: string;

  @Prop({
    trim: true,
  })
  department?: string;

  @Prop({
    trim: true,
  })
  email?: string;

  @Prop({
    trim: true,
  })
  economicActivity?: string;

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

  @Prop({
    required: true,
    trim: true,
    default: 'FV',
  })
  invoicePrefix: string;

  @Prop({
    required: true,
    min: 0,
    default: 0,
  })
  invoiceCurrentNumber: number;

  /**
   * Número de autorización de numeración
   * asignado posteriormente por la DIAN.
   */
  @Prop({
    trim: true,
  })
  authorizationNumber?: string;

  /**
   * Fecha de autorización de numeración
   * asignada posteriormente por la DIAN.
   */
  @Prop()
  authorizationDate?: Date;

  /**
   * Primer número autorizado para el prefijo.
   */
  @Prop({
    min: 0,
  })
  authorizationRangeFrom?: number;

  /**
   * Último número autorizado para el prefijo.
   */
  @Prop({
    min: 0,
  })
  authorizationRangeTo?: number;
}

export const StoreConfigurationSchema =
  SchemaFactory.createForClass(
    StoreConfiguration,
  );