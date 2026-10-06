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
  Invoice,
  InvoiceDocument,
  InvoicePaymentMethod,
} from './schemas/invoice.schema.js';

import {
  InvoiceItem,
  InvoiceItemDocument,
} from './schemas/invoice-item.schema.js';

import {
  Sale,
  SaleDocument,
} from '../sales/schemas/sale.schema.js';

import {
  SaleItem,
  SaleItemDocument,
} from '../sales/schemas/sale-item.schema.js';

import {
  Product,
  ProductDocument,
} from '../products/schemas/product.schema.js';

import {
  Customer,
  CustomerDocument,
} from '../customers/schemas/customer.schema.js';

import {
  ConfigurationService,
} from '../configuration/configuration.service.js';

import {
  CreateInvoiceDto,
} from './dto/create-invoice.dto.js';

import {
  CancelInvoiceDto,
} from './dto/cancel-invoice.dto.js';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectModel(Invoice.name)
    private readonly invoiceModel:
      Model<InvoiceDocument>,

    @InjectModel(InvoiceItem.name)
    private readonly invoiceItemModel:
      Model<InvoiceItemDocument>,

    @InjectModel(Sale.name)
    private readonly saleModel:
      Model<SaleDocument>,

    @InjectModel(SaleItem.name)
    private readonly saleItemModel:
      Model<SaleItemDocument>,

    @InjectModel(Product.name)
    private readonly productModel:
      Model<ProductDocument>,

    @InjectModel(Customer.name)
    private readonly customerModel:
      Model<CustomerDocument>,

    private readonly configurationService:
      ConfigurationService,
  ) {}

  async create(
    createInvoiceDto: CreateInvoiceDto,
  ): Promise<InvoiceDocument> {
    const {
      saleId,
      prefix,
      invoiceNumber,
      customer: invoiceCustomerData,
    } = createInvoiceDto;

    if (!Types.ObjectId.isValid(saleId)) {
      throw new BadRequestException(
        'El saleId no es válido',
      );
    }

    const sale =
      await this.saleModel
        .findById(saleId)
        .exec();

    if (!sale) {
      throw new NotFoundException(
        'Venta no encontrada',
      );
    }

    if (sale.status !== 'COMPLETED') {
      throw new BadRequestException(
        'Solo se puede facturar una venta en estado COMPLETED',
      );
    }

    const existingInvoice =
      await this.invoiceModel
        .findOne({
          saleId: sale._id,
        })
        .exec();

    if (existingInvoice) {
      throw new ConflictException(
        'La venta ya tiene una factura asociada',
      );
    }

    let invoiceCustomerId =
      sale.customerId;

    if (sale.customerId) {
      const customer =
        await this.customerModel
          .findById(sale.customerId)
          .exec();

      if (!customer) {
        throw new NotFoundException(
          'El cliente asociado a la venta no existe',
        );
      }

      if (invoiceCustomerData) {
        const customerWithSameDocument =
          await this.customerModel
            .findOne({
              documentType:
                invoiceCustomerData.documentType,
              documentNumber:
                invoiceCustomerData.documentNumber,
            })
            .exec();

        if (
          customerWithSameDocument &&
          customerWithSameDocument._id.toString() !==
            customer._id.toString()
        ) {
          throw new ConflictException(
            'Ya existe otro cliente con ese tipo y número de documento',
          );
        }

        customer.documentType =
          invoiceCustomerData.documentType;

        customer.documentNumber =
          invoiceCustomerData.documentNumber;

        customer.firstName =
          invoiceCustomerData.firstName;

        customer.lastName =
          invoiceCustomerData.lastName;

        customer.email =
          invoiceCustomerData.email;

        await customer.save();
      }
    } else if (invoiceCustomerData) {
      let customer =
        await this.customerModel
          .findOne({
            documentType:
              invoiceCustomerData.documentType,
            documentNumber:
              invoiceCustomerData.documentNumber,
          })
          .exec();

      if (customer) {
        customer.firstName =
          invoiceCustomerData.firstName;

        customer.lastName =
          invoiceCustomerData.lastName;

        customer.email =
          invoiceCustomerData.email;

        await customer.save();
      } else {
        customer =
          await this.customerModel.create({
            documentType:
              invoiceCustomerData.documentType,

            documentNumber:
              invoiceCustomerData.documentNumber,

            firstName:
              invoiceCustomerData.firstName,

            lastName:
              invoiceCustomerData.lastName,

            email:
              invoiceCustomerData.email,

            status: 'ACTIVE',
          });
      }

      invoiceCustomerId =
        customer._id;
    }

    const configuration =
      await this.configurationService
        .getConfiguration();

    const saleItems =
      await this.saleItemModel
        .find({
          saleId: sale._id,
        })
        .exec();

    if (saleItems.length === 0) {
      throw new BadRequestException(
        'La venta no tiene productos asociados',
      );
    }

    let generatedInvoiceNumber =
      invoiceNumber;

    let invoicePrefix =
      prefix;

    if (!generatedInvoiceNumber) {
      const nextInvoiceNumber =
        configuration.invoiceCurrentNumber + 1;

      if (
        configuration.authorizationRangeTo !== undefined &&
        nextInvoiceNumber >
          configuration.authorizationRangeTo
      ) {
        throw new BadRequestException(
          'El siguiente número de factura está fuera del rango autorizado.',
        );
      }

      invoicePrefix =
        prefix ??
        configuration.invoicePrefix;

      generatedInvoiceNumber =
        `${invoicePrefix}-${String(
          nextInvoiceNumber,
        ).padStart(6, '0')}`;

      configuration.invoiceCurrentNumber =
        nextInvoiceNumber;

      await configuration.save();
    }

    const existingInvoiceNumber =
      await this.invoiceModel
        .findOne({
          invoiceNumber:
            generatedInvoiceNumber,
        })
        .exec();

    if (existingInvoiceNumber) {
      throw new ConflictException(
        'Ya existe una factura con ese número',
      );
    }

    const paymentMethod =
      sale.paymentMethod as InvoicePaymentMethod;

    let invoiceSubtotal = 0;
    let invoiceTaxTotal = 0;

    const invoiceItemsData: Array<{
      productId: Types.ObjectId;
      productName: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      taxRate: number;
      taxAmount: number;
      total: number;
    }> = [];

    for (const saleItem of saleItems) {
      const product =
        await this.productModel
          .findById(saleItem.productId)
          .exec();

      if (!product) {
        throw new NotFoundException(
          `Producto no encontrado: ${saleItem.productId}`,
        );
      }

      const taxRate =
        saleItem.taxRate ?? 0;

      const itemSubtotal =
        Math.round(
          (saleItem.subtotal ?? 0) * 100,
        ) / 100;

      const itemTaxAmount =
        Math.round(
          (saleItem.taxAmount ?? 0) * 100,
        ) / 100;

      const itemTotal =
        Math.round(
          (itemSubtotal + itemTaxAmount) * 100,
        ) / 100;

      invoiceSubtotal +=
        itemSubtotal;

      invoiceTaxTotal +=
        itemTaxAmount;

      invoiceItemsData.push({
        productId:
          saleItem.productId,

        productName:
          product.name,

        quantity:
          saleItem.quantity,

        unitPrice:
          Math.round(
            (saleItem.unitPrice ?? 0) * 100,
          ) / 100,

        subtotal:
          itemSubtotal,

        taxRate,

        taxAmount:
          itemTaxAmount,

        total:
          itemTotal,
      });
    }

    invoiceSubtotal =
      Math.round(
        invoiceSubtotal * 100,
      ) / 100;

    invoiceTaxTotal =
      Math.round(
        invoiceTaxTotal * 100,
      ) / 100;

    const invoice =
      await this.invoiceModel.create({
        saleId: sale._id,

        customerId:
          invoiceCustomerId,

        invoiceNumber:
          generatedInvoiceNumber,

        prefix:
          invoicePrefix,

        authorizationNumber:
          configuration.authorizationNumber,

        authorizationDate:
          configuration.authorizationDate,

        authorizationRangeFrom:
          configuration.authorizationRangeFrom,

        authorizationRangeTo:
          configuration.authorizationRangeTo,

        issueDate: new Date(),

        issuer: {
          storeName:
            configuration.storeName,

          legalName:
            configuration.legalName,

          nit:
            configuration.nit,

          dv:
            configuration.dv,

          phone:
            configuration.phone,

          address:
            configuration.address,

          city:
            configuration.city,

          department:
            configuration.department,

          email:
            configuration.email,

          economicActivity:
            configuration.economicActivity,
        },

        subtotal:
          invoiceSubtotal,

        discount:
          sale.discount,

        taxTotal:
          invoiceTaxTotal,

        total:
          sale.total,

        paymentMethod,

        status: 'GENERATED',
      });

    for (
      const invoiceItemData of invoiceItemsData
    ) {
      await this.invoiceItemModel.create({
        invoiceId:
          invoice._id,

        productId:
          invoiceItemData.productId,

        productName:
          invoiceItemData.productName,

        quantity:
          invoiceItemData.quantity,

        unitPrice:
          invoiceItemData.unitPrice,

        subtotal:
          invoiceItemData.subtotal,

        taxRate:
          invoiceItemData.taxRate,

        taxAmount:
          invoiceItemData.taxAmount,

        total:
          invoiceItemData.total,
      });
    }

    return invoice;
  }

  async findAll(): Promise<InvoiceDocument[]> {
    return this.invoiceModel
      .find()
      .populate(
        'customerId',
        'documentType documentNumber firstName lastName email phone address city status',
      )
      .populate(
        'saleId',
        'saleNumber subtotal discount total paymentMethod status',
      )
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  async findOne(
    id: string,
  ): Promise<InvoiceDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'El id de la factura no es válido',
      );
    }

    const invoice =
      await this.invoiceModel
        .findById(id)
        .populate(
          'customerId',
          'documentType documentNumber firstName lastName email phone address city status',
        )
        .populate(
          'saleId',
          'saleNumber subtotal discount total paymentMethod status',
        )
        .exec();

    if (!invoice) {
      throw new NotFoundException(
        'Factura no encontrada',
      );
    }

    const items =
      await this.invoiceItemModel
        .find({
          invoiceId: invoice._id,
        })
        .populate(
          'productId',
          'name sku barcode salePrice taxRate',
        )
        .sort({
          createdAt: 1,
        })
        .exec();

    return {
      ...invoice.toObject(),
      items,
    } as unknown as InvoiceDocument;
  }

  async cancel(
    id: string,
    cancelInvoiceDto: CancelInvoiceDto,
    userId: string,
  ): Promise<InvoiceDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'El id de la factura no es válido',
      );
    }

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException(
        'El id del usuario no es válido',
      );
    }

    const invoice =
      await this.invoiceModel
        .findById(id)
        .exec();

    if (!invoice) {
      throw new NotFoundException(
        'Factura no encontrada',
      );
    }

    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException(
        'La factura ya está cancelada',
      );
    }

    const cancellableStatuses = [
      'GENERATED',
      'SENT',
      'VALIDATED',
    ];

    if (
      !cancellableStatuses.includes(
        invoice.status,
      )
    ) {
      throw new BadRequestException(
        `La factura no puede cancelarse en estado ${invoice.status}`,
      );
    }

    invoice.status = 'CANCELLED';

    invoice.cancelledAt =
      new Date();

    invoice.cancelledBy =
      new Types.ObjectId(userId);

    invoice.cancellationReason =
      cancelInvoiceDto.cancellationReason;

    await invoice.save();

    return invoice;
  }
}