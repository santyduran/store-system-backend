import { Injectable } from '@nestjs/common';

import {
  InvoiceDocument,
} from '../schemas/invoice.schema.js';

import {
  InvoiceProvider,
  InvoiceProviderResult,
} from './invoice-provider.interface.js';

@Injectable()
export class MockElectronicInvoiceProvider
  implements InvoiceProvider
{
  async sendInvoice(
    invoice: InvoiceDocument,
  ): Promise<InvoiceProviderResult> {
    const invoiceIdentifier =
      invoice.invoiceNumber.replace(
        /[^a-zA-Z0-9]/g,
        '',
      );

    const uuid =
      `MOCK-UUID-${invoiceIdentifier}-${Date.now()}`;

    const cufe =
      `MOCK-CUFE-${invoiceIdentifier}`;

    const qrCode =
      `https://example.com/mock-invoice/${invoice.invoiceNumber}`;

    const xml = `
<Invoice>
  <InvoiceNumber>${invoice.invoiceNumber}</InvoiceNumber>
  <IssueDate>${invoice.issueDate.toISOString()}</IssueDate>
  <Total>${invoice.total.toFixed(2)}</Total>
  <PaymentMethod>${invoice.paymentMethod}</PaymentMethod>
  <Status>VALIDATED</Status>
</Invoice>
`.trim();

    return {
      status: 'VALIDATED',
      uuid,
      cufe,
      qrCode,
      xml,
      dianResponse:
        'Factura procesada correctamente por MockElectronicInvoiceProvider.',
      providerResponse:
        'Respuesta simulada de proveedor electrónico.',
      validatedAt: new Date(),
    };
  }
}