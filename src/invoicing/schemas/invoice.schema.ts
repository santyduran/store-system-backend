import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

export type InvoiceDocument =
  HydratedDocument<Invoice>;

export type InvoiceStatus =
  | 'DRAFT'
  | 'GENERATED'
  | 'SENT'
  | 'VALIDATED'
  | 'REJECTED'
  | 'CANCELLED';

export type InvoicePaymentMethod =
  | 'CASH'
  | 'CARD'
  | 'TRANSFER';

@Schema({
  _id: false,
})
export class InvoiceIssuer {
  @Prop({
    required: true,
    trim: true,
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
}

export const InvoiceIssuerSchema =
  SchemaFactory.createForClass(
    InvoiceIssuer,
  );

@Schema({
  timestamps: true,
})
export class Invoice {
  @Prop({
    type: Types.ObjectId,
    ref: 'Sale',
    required: true,
    unique: true,
  })
  saleId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Customer',
  })
  customerId?: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
  })
  invoiceNumber: string;

  @Prop({
    trim: true,
  })
  prefix?: string;

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

  @Prop({
    required: true,
  })
  issueDate: Date;

  @Prop({
    type: InvoiceIssuerSchema,
    required: true,
  })
  issuer: InvoiceIssuer;

  /**
   * Valor total de los productos
   * antes de descontar el impuesto incluido.
   */
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

  /**
   * Valor total de los impuestos
   * incluidos dentro del precio final.
   */
  @Prop({
    required: true,
    min: 0,
    default: 0,
  })
  taxTotal: number;

  /**
   * Valor final que paga el cliente.
   */
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
  paymentMethod: InvoicePaymentMethod;

  @Prop({
    required: true,
    enum: [
      'DRAFT',
      'GENERATED',
      'SENT',
      'VALIDATED',
      'REJECTED',
      'CANCELLED',
    ],
    default: 'DRAFT',
  })
  status: InvoiceStatus;

  /**
   * Identificador único del documento
   * utilizado por el sistema/proveedor.
   */
  @Prop({
    trim: true,
  })
  uuid?: string;

  /**
   * Código Único de Factura Electrónica.
   * Será generado cuando integremos
   * el proceso real de facturación electrónica.
   */
  @Prop({
    trim: true,
  })
  cufe?: string;

  /**
   * Información utilizada para el código QR
   * de la representación gráfica.
   */
  @Prop({
    trim: true,
  })
  qrCode?: string;

  /**
   * XML electrónico de la factura.
   */
  @Prop()
  xml?: string;

  /**
   * Respuesta recibida desde la DIAN.
   */
  @Prop({
    trim: true,
  })
  dianResponse?: string;

  /**
   * Respuesta recibida desde un proveedor
   * tecnológico de facturación.
   */
  @Prop({
    trim: true,
  })
  providerResponse?: string;

  /**
   * Fecha en la que la factura fue validada.
   */
  @Prop()
  validatedAt?: Date;

  /**
   * Fecha de cancelación de la factura.
   */
  @Prop()
  cancelledAt?: Date;

  /**
   * Usuario que realizó la cancelación
   * de la factura.
   */
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
  })
  cancelledBy?: Types.ObjectId;

  /**
   * Motivo de cancelación de la factura.
   */
  @Prop({
    trim: true,
    maxlength: 500,
  })
  cancellationReason?: string;
}

export const InvoiceSchema =
  SchemaFactory.createForClass(
    Invoice,
  );