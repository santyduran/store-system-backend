import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
} from 'mongoose';

export type ProviderDocument =
  HydratedDocument<Provider>;

export type ProviderStatus =
  | 'ACTIVE'
  | 'INACTIVE';

@Schema({
  timestamps: true,
})
export class Provider {
  @Prop({
    required: true,
    trim: true,
    maxlength: 150,
  })
  businessName: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 30,
  })
  nit: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 2,
  })
  verificationDigit: string;

  @Prop({
    trim: true,
    maxlength: 100,
  })
  contactName?: string;

  @Prop({
    trim: true,
    maxlength: 30,
  })
  phone?: string;

  @Prop({
    trim: true,
    lowercase: true,
    maxlength: 150,
  })
  email?: string;

  @Prop({
    trim: true,
    maxlength: 200,
  })
  address?: string;

  @Prop({
    trim: true,
    maxlength: 100,
  })
  city?: string;

  @Prop({
    trim: true,
    maxlength: 100,
  })
  bankName?: string;

  @Prop({
    trim: true,
    maxlength: 50,
  })
  bankAccountNumber?: string;

  @Prop({
    trim: true,
    maxlength: 30,
  })
  bankAccountType?: string;

  @Prop({
    required: true,
    enum: [
      'ACTIVE',
      'INACTIVE',
    ],
    default: 'ACTIVE',
  })
  status: ProviderStatus;
}

export const ProviderSchema =
  SchemaFactory.createForClass(
    Provider,
  );