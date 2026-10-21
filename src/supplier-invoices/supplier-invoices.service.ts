import {
  BadRequestException,
  ConflictException,
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
  SupplierInvoice,
  SupplierInvoiceDocument,
} from './schemas/supplier-invoice.schema.js';

import {
  SupplierInvoiceItem,
  SupplierInvoiceItemDocument,
} from './schemas/supplier-invoice-item.schema.js';

import {
  CreateSupplierInvoiceDto,
} from './dto/create-supplier-invoice.dto.js';

import {
  UpdateSupplierInvoiceDto,
} from './dto/update-supplier-invoice.dto.js';

import {
  PaySupplierInvoiceDto,
} from './dto/pay-supplier-invoice.dto.js';

import {
  Provider,
  ProviderDocument,
} from '../providers/schemas/provider.schema.js';

import {
  Product,
  ProductDocument,
} from '../products/schemas/product.schema.js';

@Injectable()
export class SupplierInvoicesService {
  constructor(
    @InjectModel(SupplierInvoice.name)
    private readonly supplierInvoiceModel:
      Model<SupplierInvoiceDocument>,

    @InjectModel(SupplierInvoiceItem.name)
    private readonly supplierInvoiceItemModel:
      Model<SupplierInvoiceItemDocument>,

    @InjectModel(Provider.name)
    private readonly providerModel:
      Model<ProviderDocument>,

    @InjectModel(Product.name)
    private readonly productModel:
      Model<ProductDocument>,
  ) {}

  async create(
    createSupplierInvoiceDto: CreateSupplierInvoiceDto,
  ): Promise<SupplierInvoiceDocument> {
    const {
      invoiceNumber,
      providerId,
      issueDate,
      dueDate,
      items,
      observations,
      supplierInvoiceNumber,
      authorizationNumber,
    } = createSupplierInvoiceDto;

    if (!Types.ObjectId.isValid(providerId)) {
      throw new BadRequestException(
        'El id del proveedor no es válido',
      );
    }

    if (!items || items.length === 0) {
      throw new BadRequestException(
        'La factura debe tener al menos un producto',
      );
    }

    const existingInvoice =
      await this.supplierInvoiceModel
        .findOne({
          invoiceNumber: invoiceNumber.trim(),
        })
        .exec();

    if (existingInvoice) {
      throw new ConflictException(
        'Ya existe una factura de proveedor con ese número',
      );
    }

    const provider = await this.providerModel
      .findById(providerId)
      .exec();

    if (!provider) {
      throw new NotFoundException(
        'Proveedor no encontrado',
      );
    }

    if (provider.status !== 'ACTIVE') {
      throw new BadRequestException(
        'No se puede registrar una factura de un proveedor inactivo',
      );
    }

    const requestedProductIds = items.map(
      (item) => item.productId,
    );

    if (
      new Set(requestedProductIds).size !==
      requestedProductIds.length
    ) {
      throw new BadRequestException(
        'No se puede repetir un producto dentro de la factura',
      );
    }

    let subtotal = 0;
    let taxTotal = 0;

    const invoiceItems: Array<{
      productId: Types.ObjectId;
      productName: string;
      quantity: number;
      unitCost: number;
      taxRate: number;
      subtotal: number;
      taxAmount: number;
      total: number;
    }> = [];

    for (const item of items) {
      if (!Types.ObjectId.isValid(item.productId)) {
        throw new BadRequestException(
          'Uno de los productos de la factura tiene un id no válido',
        );
      }

      const product = await this.productModel
        .findById(item.productId)
        .exec();

      if (!product) {
        throw new NotFoundException(
          `Producto ${item.productId} no encontrado`,
        );
      }

      const quantity = Number(item.quantity);
      const unitCost = Number(item.unitCost);
      const taxRate = Number(item.taxRate);

      if (
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(unitCost) ||
        unitCost < 0 ||
        !Number.isFinite(taxRate) ||
        taxRate < 0 ||
        taxRate > 100
      ) {
        throw new BadRequestException(
          'La cantidad, el costo o el impuesto de un producto no son válidos',
        );
      }

      const itemSubtotal = this.round(
        quantity * unitCost,
      );

      const itemTaxAmount = this.round(
        itemSubtotal * taxRate / 100,
      );

      const itemTotal = this.round(
        itemSubtotal + itemTaxAmount,
      );

      subtotal = this.round(
        subtotal + itemSubtotal,
      );

      taxTotal = this.round(
        taxTotal + itemTaxAmount,
      );

      invoiceItems.push({
        productId: new Types.ObjectId(
          item.productId,
        ),
        productName: product.name,
        quantity,
        unitCost,
        taxRate,
        subtotal: itemSubtotal,
        taxAmount: itemTaxAmount,
        total: itemTotal,
      });
    }

    const total = this.round(
      subtotal + taxTotal,
    );

    const supplierInvoice =
      await this.supplierInvoiceModel.create({
        invoiceNumber: invoiceNumber.trim(),
        providerId: new Types.ObjectId(providerId),
        issueDate: new Date(issueDate),
        dueDate: dueDate
          ? new Date(dueDate)
          : undefined,
        subtotal,
        taxTotal,
        total,
        status: 'PENDING',
        observations:
          observations?.trim() || undefined,
        supplierInvoiceNumber:
          supplierInvoiceNumber?.trim() || undefined,
        authorizationNumber:
          authorizationNumber?.trim() || undefined,
      });

    try {
      await this.supplierInvoiceItemModel.insertMany(
        invoiceItems.map((item) => ({
          supplierInvoiceId: supplierInvoice._id,
          ...item,
        })),
      );
    } catch (error) {
      await this.supplierInvoiceModel
        .findByIdAndDelete(supplierInvoice._id)
        .exec();

      throw error;
    }

    return supplierInvoice;
  }

  async findAll(): Promise<SupplierInvoiceDocument[]> {
    await this.updateOverdueInvoices();

    return this.supplierInvoiceModel
      .find()
      .populate(
        'providerId',
        'businessName nit verificationDigit contactName phone email',
      )
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  async findOne(
    id: string,
  ): Promise<SupplierInvoiceDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'El id de la factura no es válido',
      );
    }

    await this.updateOverdueInvoices();

    const invoice = await this.supplierInvoiceModel
      .findById(id)
      .populate(
        'providerId',
        'businessName nit verificationDigit contactName phone email',
      )
      .exec();

    if (!invoice) {
      throw new NotFoundException(
        'Factura de proveedor no encontrada',
      );
    }

    return invoice;
  }

  async findItems(
    invoiceId: string,
  ): Promise<SupplierInvoiceItemDocument[]> {
    if (!Types.ObjectId.isValid(invoiceId)) {
      throw new BadRequestException(
        'El id de la factura no es válido',
      );
    }

    const invoice = await this.supplierInvoiceModel
      .findById(invoiceId)
      .exec();

    if (!invoice) {
      throw new NotFoundException(
        'Factura de proveedor no encontrada',
      );
    }

    return this.supplierInvoiceItemModel
      .find({
        supplierInvoiceId: new Types.ObjectId(invoiceId),
      })
      .populate(
        'productId',
        'name sku barcode purchasePrice salePrice taxRate stock',
      )
      .sort({
        createdAt: 1,
      })
      .exec();
  }

  async update(
    id: string,
    updateSupplierInvoiceDto: UpdateSupplierInvoiceDto,
  ): Promise<SupplierInvoiceDocument> {
    const invoice = await this.findOne(id);

    if (
      invoice.status === 'PAID' ||
      invoice.status === 'CANCELLED'
    ) {
      throw new BadRequestException(
        'No se puede modificar una factura pagada o cancelada',
      );
    }

    const updateData: Record<string, unknown> = {};

    if (updateSupplierInvoiceDto.dueDate) {
      updateData.dueDate = new Date(
        updateSupplierInvoiceDto.dueDate,
      );
    }

    if (
      updateSupplierInvoiceDto.observations !== undefined
    ) {
      updateData.observations =
        updateSupplierInvoiceDto.observations.trim();
    }

    if (updateSupplierInvoiceDto.status) {
      if (updateSupplierInvoiceDto.status === 'PAID') {
        throw new BadRequestException(
          'Para registrar un pago utilice el endpoint de pago',
        );
      }

      if (
        updateSupplierInvoiceDto.status === 'CANCELLED'
      ) {
        throw new BadRequestException(
          'Para cancelar una factura utilice el endpoint de cancelación',
        );
      }

      updateData.status = updateSupplierInvoiceDto.status;
    }

    const updatedInvoice =
      await this.supplierInvoiceModel
        .findByIdAndUpdate(
          id,
          {
            $set: updateData,
          },
          {
            new: true,
            runValidators: true,
          },
        )
        .populate(
          'providerId',
          'businessName nit verificationDigit contactName phone email',
        )
        .exec();

    if (!updatedInvoice) {
      throw new NotFoundException(
        'Factura de proveedor no encontrada',
      );
    }

    return updatedInvoice;
  }

  async pay(
    id: string,
    paySupplierInvoiceDto: PaySupplierInvoiceDto,
  ): Promise<SupplierInvoiceDocument> {
    const invoice = await this.findOne(id);

    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException(
        'No se puede pagar una factura cancelada',
      );
    }

    if (invoice.status === 'PAID') {
      throw new BadRequestException(
        'La factura ya está pagada',
      );
    }

    const paymentDate =
      paySupplierInvoiceDto.paymentDate
        ? new Date(paySupplierInvoiceDto.paymentDate)
        : new Date();

    invoice.status = 'PAID';
    invoice.paymentMethod =
      paySupplierInvoiceDto.paymentMethod;
    invoice.paymentDate = paymentDate;

    if (
      paySupplierInvoiceDto.observations !== undefined
    ) {
      invoice.observations =
        paySupplierInvoiceDto.observations.trim();
    }

    await invoice.save();

    return this.findOne(id);
  }

  async cancel(
    id: string,
    reason?: string,
  ): Promise<SupplierInvoiceDocument> {
    const invoice = await this.findOne(id);

    if (invoice.status === 'PAID') {
      throw new BadRequestException(
        'No se puede cancelar una factura pagada',
      );
    }

    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException(
        'La factura ya está cancelada',
      );
    }

    invoice.status = 'CANCELLED';

    if (reason?.trim()) {
      invoice.observations = reason.trim();
    }

    await invoice.save();

    return this.findOne(id);
  }

  async findPendingPayables(): Promise<
    SupplierInvoiceDocument[]
  > {
    await this.updateOverdueInvoices();

    return this.supplierInvoiceModel
      .find({
        status: 'PENDING',
      })
      .populate(
        'providerId',
        'businessName nit verificationDigit contactName phone email',
      )
      .sort({
        dueDate: 1,
        createdAt: 1,
      })
      .exec();
  }

  async findOverduePayables(): Promise<
    SupplierInvoiceDocument[]
  > {
    await this.updateOverdueInvoices();

    return this.supplierInvoiceModel
      .find({
        status: 'OVERDUE',
      })
      .populate(
        'providerId',
        'businessName nit verificationDigit contactName phone email',
      )
      .sort({
        dueDate: 1,
        createdAt: 1,
      })
      .exec();
  }

  async findPaidPayables(): Promise<
    SupplierInvoiceDocument[]
  > {
    return this.supplierInvoiceModel
      .find({
        status: 'PAID',
      })
      .populate(
        'providerId',
        'businessName nit verificationDigit contactName phone email',
      )
      .sort({
        paymentDate: -1,
        createdAt: -1,
      })
      .exec();
  }

  async getPayablesSummary(): Promise<{
    pending: {
      count: number;
      total: number;
    };
    overdue: {
      count: number;
      total: number;
    };
    paid: {
      count: number;
      total: number;
    };
    outstandingCount: number;
    outstandingTotal: number;
  }> {
    await this.updateOverdueInvoices();

    const summary = await this.supplierInvoiceModel
      .aggregate<{
        _id: string;
        count: number;
        total: number;
      }>([
        {
          $match: {
            status: {
              $in: [
                'PENDING',
                'OVERDUE',
                'PAID',
              ],
            },
          },
        },
        {
          $group: {
            _id: '$status',
            count: {
              $sum: 1,
            },
            total: {
              $sum: '$total',
            },
          },
        },
      ])
      .exec();

    const pending = summary.find(
      (item) => item._id === 'PENDING',
    );

    const overdue = summary.find(
      (item) => item._id === 'OVERDUE',
    );

    const paid = summary.find(
      (item) => item._id === 'PAID',
    );

    const pendingCount = pending?.count ?? 0;
    const pendingTotal = this.round(
      pending?.total ?? 0,
    );

    const overdueCount = overdue?.count ?? 0;
    const overdueTotal = this.round(
      overdue?.total ?? 0,
    );

    const paidCount = paid?.count ?? 0;
    const paidTotal = this.round(
      paid?.total ?? 0,
    );

    return {
      pending: {
        count: pendingCount,
        total: pendingTotal,
      },
      overdue: {
        count: overdueCount,
        total: overdueTotal,
      },
      paid: {
        count: paidCount,
        total: paidTotal,
      },
      outstandingCount: pendingCount + overdueCount,
      outstandingTotal: this.round(
        pendingTotal + overdueTotal,
      ),
    };
  }

  private async updateOverdueInvoices(): Promise<void> {
    const now = new Date();

    await this.supplierInvoiceModel
      .updateMany(
        {
          status: 'PENDING',
          dueDate: {
            $lt: now,
          },
        },
        {
          $set: {
            status: 'OVERDUE',
          },
        },
      )
      .exec();
  }

  private round(value: number): number {
    return Math.round(
      (value + Number.EPSILON) * 100,
    ) / 100;
  }
}