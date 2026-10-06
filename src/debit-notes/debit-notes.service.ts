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
  DebitNote,
  DebitNoteDocument,
} from './schemas/debit-note.schema.js';

import {
  DebitNoteItem,
  DebitNoteItemDocument,
} from './schemas/debit-note-item.schema.js';

import {
  Invoice,
  InvoiceDocument,
} from '../invoicing/schemas/invoice.schema.js';

import {
  InvoiceItem,
  InvoiceItemDocument,
} from '../invoicing/schemas/invoice-item.schema.js';

import {
  CreateDebitNoteDto,
  CreateDebitNoteItemDto,
} from './dto/create-debit-note.dto.js';

type DebitNoteWithItems = {
  debitNote: DebitNoteDocument;
  items: DebitNoteItemDocument[];
};

@Injectable()
export class DebitNotesService {
  constructor(
    @InjectModel(DebitNote.name)
    private readonly debitNoteModel:
      Model<DebitNoteDocument>,

    @InjectModel(DebitNoteItem.name)
    private readonly debitNoteItemModel:
      Model<DebitNoteItemDocument>,

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
        'No se puede generar una nota débito sobre una factura cancelada',
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

  validateDebitNoteItems(
    invoiceItems: InvoiceItemDocument[],
    requestedItems: CreateDebitNoteItemDto[],
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
        requestedItem.quantity <
        1
      ) {
        throw new BadRequestException(
          `La cantidad para el producto ${invoiceItem.productName} debe ser mayor que cero`,
        );
      }

      selectedItems.push(invoiceItem);
    }

    return selectedItems;
  }

  calculateDebitNoteItem(
    invoiceItem: InvoiceItemDocument,
    quantity: number,
  ): {
    subtotal: number;
    taxAmount: number;
    total: number;
  } {
    if (quantity < 1) {
      throw new BadRequestException(
        'La cantidad de la nota débito debe ser mayor que cero',
      );
    }

    const unitPriceBeforeTax =
      Number(invoiceItem.unitPrice ?? 0);

    const taxRate =
      Number(invoiceItem.taxRate ?? 0);

    const subtotal =
      Math.round(
        unitPriceBeforeTax *
        quantity *
        100,
      ) / 100;

    const taxAmount =
      Math.round(
        subtotal *
        taxRate /
        100 *
        100,
      ) / 100;

    const total =
      Math.round(
        (subtotal + taxAmount) *
        100,
      ) / 100;

    return {
      subtotal,
      taxAmount,
      total,
    };
  }

  calculateDebitNoteTotals(
    invoiceItems: InvoiceItemDocument[],
    requestedItems: CreateDebitNoteItemDto[],
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
        this.calculateDebitNoteItem(
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
    createDebitNoteDto: CreateDebitNoteDto,
    userId: string,
  ): Promise<DebitNoteDocument> {
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
        createDebitNoteDto.invoiceId,
      );

    this.validateDebitNoteItems(
      invoiceItems,
      createDebitNoteDto.items,
    );

    const totals =
      this.calculateDebitNoteTotals(
        invoiceItems,
        createDebitNoteDto.items,
      );

    const lastDebitNote =
      await this.debitNoteModel
        .findOne()
        .sort({
          createdAt: -1,
        })
        .exec();

    let nextNumber = 1;

    if (lastDebitNote) {
      const match =
        lastDebitNote.debitNoteNumber.match(
          /(\d+)$/,
        );

      if (match) {
        nextNumber =
          Number(match[1]) + 1;
      }
    }

    const debitNoteNumber =
      `ND-${String(nextNumber).padStart(6, '0')}`;

    const debitNote =
      await this.debitNoteModel.create({
        invoiceId:
          invoice._id,

        debitNoteNumber,

        prefix: 'ND',

        issueDate:
          new Date(),

        reason:
          createDebitNoteDto.reason,

        subtotal:
          totals.subtotal,

        taxTotal:
          totals.taxTotal,

        total:
          totals.total,

        status:
          'GENERATED',

        createdBy:
          new Types.ObjectId(userId),
      });

    for (
      const requestedItem
      of createDebitNoteDto.items
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
        this.calculateDebitNoteItem(
          invoiceItem,
          requestedItem.quantity,
        );

      await this.debitNoteItemModel.create({
        debitNoteId:
          debitNote._id,

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

    return debitNote;
  }

  async cancel(
    id: string,
    userId: string,
    cancellationReason: string,
  ): Promise<DebitNoteDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'El id de la nota débito no es válido',
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

    const debitNote =
      await this.debitNoteModel
        .findById(id)
        .exec();

    if (!debitNote) {
      throw new NotFoundException(
        'Nota débito no encontrada',
      );
    }

    if (
      debitNote.status ===
      'CANCELLED'
    ) {
      throw new BadRequestException(
        'La nota débito ya se encuentra cancelada',
      );
    }

    if (
      debitNote.status !==
      'GENERATED'
    ) {
      throw new BadRequestException(
        'Solo se pueden cancelar notas débito en estado GENERADA',
      );
    }

    debitNote.status =
      'CANCELLED';

    debitNote.cancelledAt =
      new Date();

    debitNote.cancelledBy =
      new Types.ObjectId(userId);

    debitNote.cancellationReason =
      reason;

    return debitNote.save();
  }

  async findAll(): Promise<DebitNoteDocument[]> {
    return this.debitNoteModel
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
  ): Promise<DebitNoteWithItems> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'El id de la nota débito no es válido',
      );
    }

    const debitNote =
      await this.debitNoteModel
        .findById(id)
        .populate({
          path: 'invoiceId',
          select:
            'invoiceNumber prefix subtotal taxTotal total status',
        })
        .exec();

    if (!debitNote) {
      throw new NotFoundException(
        'Nota débito no encontrada',
      );
    }

    const items =
      await this.debitNoteItemModel
        .find({
          debitNoteId:
            debitNote._id,
        })
        .sort({
          createdAt: 1,
        })
        .exec();

    return {
      debitNote,
      items,
    };
  }
}