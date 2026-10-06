import { InvoiceDocument } from '../schemas/invoice.schema.js';

export interface InvoiceProviderResult {
  status: 'SENT' | 'VALIDATED' | 'REJECTED';
  uuid?: string;
  cufe?: string;
  qrCode?: string;
  xml?: string;
  dianResponse?: string;
  providerResponse?: string;
  validatedAt?: Date;
}

export interface InvoiceProvider {
  sendInvoice(
    invoice: InvoiceDocument,
  ): Promise<InvoiceProviderResult>;
}