import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  InjectModel,
} from '@nestjs/mongoose';

import {
  Model,
  Types,
} from 'mongoose';

import {
  CreditNote,
  CreditNoteDocument,
} from './schemas/credit-note.schema.js';

import {
  CreditNoteItem,
  CreditNoteItemDocument,
} from './schemas/credit-note-item.schema.js';

import {
  Invoice,
  InvoiceDocument,
} from '../invoicing/schemas/invoice.schema.js';

import {
  InvoiceItem,
  InvoiceItemDocument,
} from '../invoicing/schemas/invoice-item.schema.js';

import {
  CreateCreditNoteDto,
  CreateCreditNoteItemDto,
} from './dto/create-credit-note.dto.js';

type CreditNoteWithItems = {
  creditNote: CreditNoteDocument;
  items: CreditNoteItemDocument[];
};

@Injectable()
export class CreditNotesService {
  constructor(
    @InjectModel(CreditNote.name)
    private readonly creditNoteModel:
      Model<CreditNoteDocument>,

    @InjectModel(CreditNoteItem.name)
    private readonly creditNoteItemModel:
      Model<CreditNoteItemDocument>,

    @InjectModel(Invoice.name)
    private readonly invoiceModel:
      Model<InvoiceDocument>,

    @InjectModel(InvoiceItem.name)
    private readonly invoiceItemModel:
      Model<InvoiceItemDocument>,
  ) {}

  async validateInvoice(
    invoiceId: string,
  ): Promise<{
    invoice: InvoiceDocument;
    items: InvoiceItemDocument[];
  }> {
    if (!Types.ObjectId.isValid(invoiceId)) {
      throw new BadRequestException(
        'El id de la factura no es válido',
      );
    }

    const invoice =
      await this.invoiceModel
        .findById(invoiceId)
        .exec();

    if (!invoice) {
      throw new NotFoundException(
        'Factura no encontrada',
      );
    }

    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException(
        'No se puede generar una nota crédito sobre una factura cancelada',
      );
    }

    const items =
      await this.invoiceItemModel
        .find({
          invoiceId: invoice._id,
        })
        .sort({
          createdAt: 1,
        })
        .exec();

    if (items.length === 0) {
      throw new BadRequestException(
        'La factura no tiene productos asociados',
      );
    }

    return {
      invoice,
      items,
    };
  }

  async validateAvailableCreditNoteQuantities(
    invoiceId: Types.ObjectId,
    invoiceItems: InvoiceItemDocument[],
    requestedItems: CreateCreditNoteItemDto[],
  ): Promise<void> {
    const existingCreditNotes =
      await this.creditNoteModel
        .find({
          invoiceId,
          status: 'GENERATED',
        })
        .select({
          _id: 1,
        })
        .exec();

    const existingCreditNoteIds =
      existingCreditNotes.map(
        (creditNote) =>
          creditNote._id,
      );

    const existingCreditNoteItems =
      existingCreditNoteIds.length > 0
        ? await this.creditNoteItemModel
            .find({
              creditNoteId: {
                $in: existingCreditNoteIds,
              },
            })
            .exec()
        : [];

    const creditedQuantities =
      new Map<string, number>();

    for (
      const creditNoteItem
      of existingCreditNoteItems
    ) {
      const productId =
        creditNoteItem.productId.toString();

      const currentQuantity =
        creditedQuantities.get(
          productId,
        ) ?? 0;

      creditedQuantities.set(
        productId,
        currentQuantity +
          creditNoteItem.quantity,
      );
    }

    const requestedQuantities =
      new Map<string, number>();

    for (
      const requestedItem
      of requestedItems
    ) {
      const currentQuantity =
        requestedQuantities.get(
          requestedItem.productId,
        ) ?? 0;

      requestedQuantities.set(
        requestedItem.productId,
        currentQuantity +
          requestedItem.quantity,
      );
    }

    for (
      const [
        productId,
        requestedQuantity,
      ]
      of requestedQuantities
    ) {
      const invoiceItem =
        invoiceItems.find(
          (item) =>
            item.productId.toString() ===
            productId,
        );

      if (!invoiceItem) {
        throw new BadRequestException(
          `El producto ${productId} no pertenece a la factura`,
        );
      }

      const alreadyCredited =
        creditedQuantities.get(
          productId,
        ) ?? 0;

      const availableQuantity =
        invoiceItem.quantity -
        alreadyCredited;

      if (
        requestedQuantity >
        availableQuantity
      ) {
        throw new BadRequestException(
          `La cantidad solicitada para el producto ${invoiceItem.productName} supera la cantidad disponible para acreditar. Cantidad facturada: ${invoiceItem.quantity}. Cantidad ya acreditada: ${alreadyCredited}. Cantidad disponible: ${availableQuantity}. Cantidad solicitada: ${requestedQuantity}.`,
        );
      }
    }
  }

  validateCreditNoteItems(
    invoiceItems: InvoiceItemDocument[],
    requestedItems: CreateCreditNoteItemDto[],
  ): InvoiceItemDocument[] {
    const selectedItems: InvoiceItemDocument[] = [];

    for (
      const requestedItem
      of requestedItems
    ) {
      const invoiceItem =
        invoiceItems.find(
          (item) =>
            item.productId.toString() ===
            requestedItem.productId,
        );

      if (!invoiceItem) {
        throw new BadRequestException(
          `El producto ${requestedItem.productId} no pertenece a la factura`,
        );
      }

      if (
        requestedItem.quantity >
        invoiceItem.quantity
      ) {
        throw new BadRequestException(
          `La cantidad solicitada para el producto ${invoiceItem.productName} supera la cantidad facturada`,
        );
      }

      selectedItems.push(invoiceItem);
    }

    return selectedItems;
  }

  calculateCreditNoteItem(
    invoiceItem: InvoiceItemDocument,
    quantity: number,
  ): {
    subtotal: number;
    taxAmount: number;
    total: number;
  } {
    if (quantity < 1) {
      throw new BadRequestException(
        'La cantidad a acreditar debe ser mayor que cero',
      );
    }

    if (
      quantity >
      invoiceItem.quantity
    ) {
      throw new BadRequestException(
        `La cantidad solicitada para el producto ${invoiceItem.productName} supera la cantidad facturada`,
      );
    }

    const unitPriceBeforeTax =
      Number(
        invoiceItem.unitPrice ?? 0,
      );

    const taxRate =
      Number(
        invoiceItem.taxRate ?? 0,
      );

    const subtotal =
      Math.round(
        unitPriceBeforeTax *
          quantity *
          100,
      ) / 100;

    const taxAmount =
      Math.round(
        (
          subtotal *
          taxRate /
          100
        ) *
          100,
      ) / 100;

    const total =
      Math.round(
        (
          subtotal +
          taxAmount
        ) *
          100,
      ) / 100;

    return {
      subtotal,
      taxAmount,
      total,
    };
  }

  calculateCreditNoteTotals(
    invoiceItems: InvoiceItemDocument[],
    requestedItems: CreateCreditNoteItemDto[],
  ): {
    subtotal: number;
    taxTotal: number;
    total: number;
  } {
    let subtotal = 0;
    let taxTotal = 0;
    let total = 0;

    for (
      const requestedItem
      of requestedItems
    ) {
      const invoiceItem =
        invoiceItems.find(
          (item) =>
            item.productId.toString() ===
            requestedItem.productId,
        );

      if (!invoiceItem) {
        throw new BadRequestException(
          `El producto ${requestedItem.productId} no pertenece a la factura`,
        );
      }

      const calculatedItem =
        this.calculateCreditNoteItem(
          invoiceItem,
          requestedItem.quantity,
        );

      subtotal +=
        calculatedItem.subtotal;

      taxTotal +=
        calculatedItem.taxAmount;

      total +=
        calculatedItem.total;
    }

    subtotal =
      Math.round(
        subtotal * 100,
      ) / 100;

    taxTotal =
      Math.round(
        taxTotal * 100,
      ) / 100;

    total =
      Math.round(
        total * 100,
      ) / 100;

    return {
      subtotal,
      taxTotal,
      total,
    };
  }

  async create(
    createCreditNoteDto: CreateCreditNoteDto,
    userId: string,
  ): Promise<CreditNoteDocument> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException(
        'El id del usuario no es válido',
      );
    }

    const {
      invoice,
      items: invoiceItems,
    } =
      await this.validateInvoice(
        createCreditNoteDto.invoiceId,
      );

    this.validateCreditNoteItems(
      invoiceItems,
      createCreditNoteDto.items,
    );

    await this.validateAvailableCreditNoteQuantities(
      invoice._id,
      invoiceItems,
      createCreditNoteDto.items,
    );

    const totals =
      this.calculateCreditNoteTotals(
        invoiceItems,
        createCreditNoteDto.items,
      );

    const lastCreditNote =
      await this.creditNoteModel
        .findOne()
        .sort({
          createdAt: -1,
        })
        .exec();

    let nextNumber = 1;

    if (lastCreditNote) {
      const match =
        lastCreditNote.creditNoteNumber.match(
          /(\d+)$/,
        );

      if (match) {
        nextNumber =
          Number(match[1]) + 1;
      }
    }

    const creditNoteNumber =
      `NC-${String(nextNumber).padStart(6, '0')}`;

    const creditNote =
      await this.creditNoteModel.create({
        invoiceId: invoice._id,

        creditNoteNumber,

        prefix: 'NC',

        issueDate: new Date(),

        reason:
          createCreditNoteDto.reason,

        subtotal: totals.subtotal,

        taxTotal: totals.taxTotal,

        total: totals.total,

        status: 'GENERATED',

        createdBy:
          new Types.ObjectId(userId),
      });

    for (
      const requestedItem
      of createCreditNoteDto.items
    ) {
      const invoiceItem =
        invoiceItems.find(
          (item) =>
            item.productId.toString() ===
            requestedItem.productId,
        );

      if (!invoiceItem) {
        throw new BadRequestException(
          `El producto ${requestedItem.productId} no pertenece a la factura`,
        );
      }

      const calculatedItem =
        this.calculateCreditNoteItem(
          invoiceItem,
          requestedItem.quantity,
        );

      await this.creditNoteItemModel.create({
        creditNoteId:
          creditNote._id,

        productId:
          invoiceItem.productId,

        productName:
          invoiceItem.productName,

        quantity:
          requestedItem.quantity,

        unitPrice:
          invoiceItem.unitPrice,

        subtotal:
          calculatedItem.subtotal,

        taxRate:
          invoiceItem.taxRate,

        taxAmount:
          calculatedItem.taxAmount,

        total:
          calculatedItem.total,
      });
    }

    return creditNote;
  }

  async cancel(
    id: string,
    userId: string,
    cancellationReason: string,
  ): Promise<CreditNoteDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'El id de la nota crédito no es válido',
      );
    }

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException(
        'El id del usuario no es válido',
      );
    }

    const reason =
      cancellationReason?.trim();

    if (!reason) {
      throw new BadRequestException(
        'El motivo de cancelación es obligatorio',
      );
    }

    if (reason.length > 500) {
      throw new BadRequestException(
        'El motivo de cancelación no puede superar los 500 caracteres',
      );
    }

    const creditNote =
      await this.creditNoteModel
        .findById(id)
        .exec();

    if (!creditNote) {
      throw new NotFoundException(
        'Nota crédito no encontrada',
      );
    }

    if (
      creditNote.status ===
      'CANCELLED'
    ) {
      throw new BadRequestException(
        'La nota crédito ya se encuentra cancelada',
      );
    }

    if (
      creditNote.status !==
      'GENERATED'
    ) {
      throw new BadRequestException(
        'Solo se pueden cancelar notas crédito en estado GENERADA',
      );
    }

    creditNote.status =
      'CANCELLED';

    creditNote.cancelledAt =
      new Date();

    creditNote.cancelledBy =
      new Types.ObjectId(userId);

    creditNote.cancellationReason =
      reason;

    return creditNote.save();
  }

  async findAll(): Promise<CreditNoteDocument[]> {
    return this.creditNoteModel
      .find()
      .populate({
        path: 'invoiceId',
        select:
          'invoiceNumber prefix subtotal taxTotal total status',
      })
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  async findOne(
    id: string,
  ): Promise<CreditNoteWithItems> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'El id de la nota crédito no es válido',
      );
    }

    const creditNote =
      await this.creditNoteModel
        .findById(id)
        .populate({
          path: 'invoiceId',
          select:
            'invoiceNumber prefix subtotal taxTotal total status',
        })
        .exec();

    if (!creditNote) {
      throw new NotFoundException(
        'Nota crédito no encontrada',
      );
    }

    const items =
      await this.creditNoteItemModel
        .find({
          creditNoteId:
            creditNote._id,
        })
        .sort({
          createdAt: 1,
        })
        .exec();

    return {
      creditNote,
      items,
    };
  }
}