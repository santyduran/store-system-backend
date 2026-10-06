import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { Response } from 'express';
import {
  InvoicesService,
} from './invoices.service.js';

@Injectable()
export class InvoicePdfService {
  constructor(
    private readonly invoicesService:
      InvoicesService,
  ) {}

  async generateInvoicePdf(
    invoiceId: string,
    response: Response,
  ): Promise<void> {
    const invoice =
      await this.invoicesService.findOne(
        invoiceId,
      );

    if (!invoice) {
      throw new NotFoundException(
        'Factura no encontrada',
      );
    }

    const invoiceData =
      invoice as any;

    const doc =
      new PDFDocument({
        size: 'LETTER',
        margin: 40,
      });

    response.setHeader(
      'Content-Type',
      'application/pdf',
    );

    response.setHeader(
      'Content-Disposition',
      `inline; filename="${invoiceData.invoiceNumber}.pdf"`,
    );

    doc.pipe(response);

    const formatMoney = (
      value: number,
    ): string => {
      return `$${Number(
        value ?? 0,
      ).toLocaleString(
        'es-CO',
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        },
      )}`;
    };

    const formatDate = (
      value:
        | string
        | Date
        | undefined,
    ): string => {
      if (!value) {
        return '';
      }

      return new Date(
        value,
      ).toLocaleString(
        'es-CO',
      );
    };

    const invoiceNumber =
      invoiceData.invoiceNumber ??
      '';

    const prefix =
      invoiceData.prefix ??
      '';

    const formattedInvoiceNumber =
      prefix &&
      invoiceNumber.startsWith(
        `${prefix}-`,
      )
        ? invoiceNumber
        : prefix
          ? `${prefix}-${invoiceNumber}`
          : invoiceNumber;

    let qrBuffer:
      | Buffer
      | null = null;

    if (invoiceData.qrCode) {
      qrBuffer =
        await QRCode.toBuffer(
          invoiceData.qrCode,
          {
            type: 'png',
            width: 160,
            margin: 1,
            errorCorrectionLevel: 'M',
          },
        );
    }

    doc
      .fontSize(21)
      .font('Helvetica-Bold')
      .text(
        invoiceData.issuer?.storeName ??
          'Store System',
        {
          align: 'center',
        },
      );

    doc
      .moveDown(0.15)
      .fontSize(9)
      .font('Helvetica')
      .text(
        invoiceData.issuer?.legalName ??
          '',
        {
          align: 'center',
        },
      );

    doc.text(
      `NIT: ${
        invoiceData.issuer?.nit ?? ''
      }-${
        invoiceData.issuer?.dv ?? ''
      }`,
      {
        align: 'center',
      },
    );

    if (
      invoiceData.issuer
        ?.economicActivity
    ) {
      doc.text(
        `Actividad económica: ${
          invoiceData.issuer
            .economicActivity
        }`,
        {
          align: 'center',
        },
      );
    }

    doc.text(
      `${
        invoiceData.issuer?.address ?? ''
      } - ${
        invoiceData.issuer?.city ?? ''
      }`,
      {
        align: 'center',
      },
    );

    if (
      invoiceData.issuer
        ?.department
    ) {
      doc.text(
        invoiceData.issuer.department,
        {
          align: 'center',
        },
      );
    }

    if (
      invoiceData.issuer?.phone
    ) {
      doc.text(
        `Tel: ${
          invoiceData.issuer.phone
        }`,
        {
          align: 'center',
        },
      );
    }

    if (
      invoiceData.issuer?.email
    ) {
      doc.text(
        `Email: ${
          invoiceData.issuer.email
        }`,
        {
          align: 'center',
        },
      );
    }

    doc.moveDown(0.6);

    doc
      .moveTo(40, doc.y)
      .lineTo(572, doc.y)
      .lineWidth(0.8)
      .stroke();

    doc.moveDown(0.6);

    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text(
        'FACTURA DE VENTA',
        {
          align: 'center',
        },
      );

    doc.moveDown(0.45);

    const invoiceInfoY =
      doc.y;

    doc
      .fontSize(8.5)
      .font('Helvetica');

    doc.text(
      `Factura: ${formattedInvoiceNumber}`,
      40,
      invoiceInfoY,
      {
        width: 260,
      },
    );

    doc.text(
      `Fecha de emisión: ${formatDate(
        invoiceData.issueDate,
      )}`,
      40,
      doc.y,
      {
        width: 300,
      },
    );

    doc.text(
      `Estado: ${
        invoiceData.status ?? ''
      }`,
      40,
      doc.y,
      {
        width: 260,
      },
    );

    doc
      .font('Helvetica-Bold')
      .text(
        `Total: ${formatMoney(
          invoiceData.total,
        )}`,
        332,
        invoiceInfoY,
        {
          width: 240,
          align: 'right',
        },
      );

    doc
      .font('Helvetica')
      .text(
        `Método de pago: ${
          invoiceData.paymentMethod ??
          ''
        }`,
        332,
        doc.y,
        {
          width: 240,
          align: 'right',
        },
      );

    doc.moveDown(0.9);

    if (
      invoiceData.authorizationNumber
    ) {
      const authorizationY =
        doc.y;

      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(
          'AUTORIZACIÓN DE NUMERACIÓN',
          40,
          authorizationY,
          {
            width: 532,
          },
        );

      doc
        .fontSize(8)
        .font('Helvetica');

      doc.text(
        `Número: ${
          invoiceData.authorizationNumber
        }`,
        40,
        authorizationY + 13,
        {
          width: 300,
        },
      );

      if (
        invoiceData.authorizationRangeFrom !==
          undefined &&
        invoiceData.authorizationRangeTo !==
          undefined
      ) {
        doc.text(
          `Rango: ${
            invoiceData.authorizationRangeFrom
          } - ${
            invoiceData.authorizationRangeTo
          }`,
          380,
          authorizationY + 13,
          {
            width: 192,
            align: 'right',
          },
        );
      }

      if (
        invoiceData.authorizationDate
      ) {
        doc.text(
          `Fecha: ${formatDate(
            invoiceData.authorizationDate,
          )}`,
          40,
          authorizationY + 26,
          {
            width: 300,
          },
        );
      }

      doc.moveDown(0.45);
    }

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(
        'DATOS DEL CLIENTE',
      );

    doc.moveDown(0.15);

    const customer =
      invoiceData.customerId;

    doc
      .fontSize(8.5)
      .font('Helvetica');

    if (customer) {
      doc.text(
        `Documento: ${
          customer.documentType ??
          ''
        } ${
          customer.documentNumber ??
          ''
        }`,
      );

      doc.text(
        `Nombre: ${
          customer.firstName ??
          ''
        } ${
          customer.lastName ??
          ''
        }`,
      );

      if (customer.email) {
        doc.text(
          `Email: ${customer.email}`,
        );
      }

      if (customer.phone) {
        doc.text(
          `Teléfono: ${customer.phone}`,
        );
      }

      if (customer.address) {
        doc.text(
          `Dirección: ${customer.address}`,
        );
      }

      if (customer.city) {
        doc.text(
          `Ciudad: ${customer.city}`,
        );
      }
    } else {
      doc.text(
        'Consumidor final',
      );
    }

    doc.moveDown(0.6);

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(
        'DETALLE DE PRODUCTOS',
      );

    doc.moveDown(0.25);

    const tableX = 40;
    const tableWidth = 532;
    const productX = 40;
    const quantityX = 310;
    const priceX = 360;
    const taxX = 435;
    const totalX = 490;
    const headerY = doc.y;

    doc
      .fontSize(8)
      .font('Helvetica-Bold');

    doc.text(
      'Producto',
      productX,
      headerY,
      {
        width: 260,
      },
    );

    doc.text(
      'Cant.',
      quantityX,
      headerY,
      {
        width: 40,
        align: 'center',
      },
    );

    doc.text(
      'Precio antes de IVA',
      priceX - 10,
      headerY,
      {
        width: 85,
        align: 'right',
      },
    );

    doc.text(
      'IVA',
      taxX,
      headerY,
      {
        width: 45,
        align: 'right',
      },
    );

    doc.text(
      'Total',
      totalX,
      headerY,
      {
        width: 82,
        align: 'right',
      },
    );

    doc.moveDown(0.4);

    doc
      .moveTo(
        tableX,
        doc.y,
      )
      .lineTo(
        tableX + tableWidth,
        doc.y,
      )
      .lineWidth(0.7)
      .stroke();

    doc.moveDown(0.35);

    const items =
      invoiceData.items ?? [];

    doc
      .fontSize(8)
      .font('Helvetica');

    for (
      const item of items
    ) {
      const rowY =
        doc.y;

      const taxRate =
        Number(
          item.taxRate ?? 0,
        );

      const priceBeforeTax =
        Number(
          item.unitPrice ?? 0,
        );

      doc.text(
        item.productName ??
          '',
        productX,
        rowY,
        {
          width: 260,
        },
      );

      doc.text(
        String(
          item.quantity ?? 0,
        ),
        quantityX,
        rowY,
        {
          width: 40,
          align: 'center',
        },
      );

      doc.text(
        formatMoney(
          priceBeforeTax,
        ),
        priceX,
        rowY,
        {
          width: 65,
          align: 'right',
        },
      );

      doc.text(
        `${Number(
          taxRate ?? 0,
        ).toFixed(2)}%`,
        taxX,
        rowY,
        {
          width: 45,
          align: 'right',
        },
      );

      doc.text(
        formatMoney(
          item.total,
        ),
        totalX,
        rowY,
        {
          width: 82,
          align: 'right',
        },
      );

      doc.moveDown(1.25);
    }

    doc
      .moveTo(
        tableX,
        doc.y,
      )
      .lineTo(
        tableX + tableWidth,
        doc.y,
      )
      .lineWidth(0.5)
      .stroke();

    doc.moveDown(0.45);

    const totalsY =
      doc.y;

    doc
      .fontSize(8.5)
      .font('Helvetica');

    doc.text(
      `Subtotal: ${formatMoney(
        invoiceData.subtotal,
      )}`,
      330,
      totalsY,
      {
        width: 242,
        align: 'right',
      },
    );

    doc.text(
      `Descuento: ${formatMoney(
        invoiceData.discount,
      )}`,
      330,
      doc.y,
      {
        width: 242,
        align: 'right',
      },
    );

    doc.text(
      `IVA incluido: ${formatMoney(
        invoiceData.taxTotal,
      )}`,
      330,
      doc.y,
      {
        width: 242,
        align: 'right',
      },
    );

    doc.moveDown(0.2);

    doc
      .fontSize(13)
      .font('Helvetica-Bold')
      .text(
        `TOTAL: ${formatMoney(
          invoiceData.total,
        )}`,
        330,
        doc.y,
        {
          width: 242,
          align: 'right',
        },
      );

    doc.moveDown(0.5);

    const electronicY =
      doc.y;

    doc
      .fontSize(9.5)
      .font('Helvetica-Bold')
      .text(
        'INFORMACIÓN ELECTRÓNICA',
        40,
        electronicY,
        {
          width: 350,
        },
      );

    doc
      .fontSize(7.5)
      .font('Helvetica');

    let electronicTextY =
      electronicY + 17;

    if (invoiceData.uuid) {
      doc.text(
        `UUID: ${invoiceData.uuid}`,
        40,
        electronicTextY,
        {
          width: 350,
        },
      );

      electronicTextY += 12;
    }

    if (invoiceData.cufe) {
      doc.text(
        `CUFE: ${invoiceData.cufe}`,
        40,
        electronicTextY,
        {
          width: 350,
        },
      );

      electronicTextY += 12;
    }

    if (
      invoiceData.validatedAt
    ) {
      doc.text(
        `Fecha de validación: ${formatDate(
          invoiceData.validatedAt,
        )}`,
        40,
        electronicTextY,
        {
          width: 350,
        },
      );

      electronicTextY += 12;
    }

    if (
      invoiceData.dianResponse
    ) {
      doc.text(
        `Respuesta: ${invoiceData.dianResponse}`,
        40,
        electronicTextY,
        {
          width: 350,
        },
      );

      electronicTextY += 12;
    }

    if (
      invoiceData.providerResponse
    ) {
      doc.text(
        `Proveedor: ${invoiceData.providerResponse}`,
        40,
        electronicTextY,
        {
          width: 350,
        },
      );

      electronicTextY += 12;
    }

    if (qrBuffer) {
      const qrSize = 82;
      const qrX = 445;
      const qrLabelY =
        electronicY;
      const qrY =
        electronicY + 15;

      doc
        .fontSize(7.5)
        .font('Helvetica-Bold')
        .text(
          'Código QR',
          qrX,
          qrLabelY,
          {
            width: qrSize,
            align: 'center',
          },
        );

      doc.image(
        qrBuffer,
        qrX,
        qrY + 10,
        {
          width: qrSize,
          height: qrSize,
        },
      );

      doc
        .fontSize(6)
        .font('Helvetica')
        .text(
          'Escanee para consultar',
          qrX - 8,
          qrY + qrSize + 13,
          {
            width: qrSize + 16,
            align: 'center',
          },
        );
    }

    const qrBottomY =
      qrBuffer
        ? electronicY +
          15 +
          10 +
          82 +
          13 +
          8
        : electronicY;

    const electronicBottomY =
      Math.max(
        electronicTextY + 2,
        qrBottomY,
      );

    const separatorY =
      electronicBottomY + 7;

    doc
      .moveTo(
        40,
        separatorY,
      )
      .lineTo(
        572,
        separatorY,
      )
      .lineWidth(0.6)
      .stroke();

    let footerY =
      separatorY + 14;

    if (
      invoiceData.issuer
        ?.receiptMessage
    ) {
      doc
        .fontSize(7.5)
        .font('Helvetica')
        .text(
          invoiceData.issuer
            .receiptMessage,
          40,
          footerY,
          {
            align: 'center',
            width: 532,
          },
        );

      footerY =
        doc.y + 4;
    }

    doc
      .fontSize(7.5)
      .font('Helvetica')
      .text(
        'Documento generado por Store System.',
        40,
        footerY,
        {
          align: 'center',
          width: 532,
        },
      );

    footerY =
      doc.y + 3;

    doc.text(
      'Representación gráfica de factura electrónica.',
      40,
      footerY,
      {
        align: 'center',
        width: 532,
      },
    );

    footerY =
      doc.y + 3;

    if (
      invoiceData.status ===
      'VALIDATED'
    ) {
      doc
        .fontSize(6.5)
        .text(
          'Factura validada electrónicamente.',
          40,
          footerY,
          {
            align: 'center',
            width: 532,
          },
        );
    }

    doc.end();
  }
}