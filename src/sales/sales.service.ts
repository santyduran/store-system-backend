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
} from 'mongoose';

import { Types } from 'mongoose';

import {
  Sale,
  SaleDocument,
} from './schemas/sale.schema.js';

import {
  SaleItem,
  SaleItemDocument,
} from './schemas/sale-item.schema.js';

import {
  Product,
  ProductDocument,
} from '../products/schemas/product.schema.js';

import {
  CreateSaleDto,
} from './dto/create-sale.dto.js';

import {
  CancelSaleDto,
} from './dto/cancel-sale.dto.js';

import {
  InventoryService,
} from '../inventory/inventory.service.js';

import {
  CashRegisterService,
} from '../cash-register/cash-register.service.js';

@Injectable()
export class SalesService {
  constructor(
    @InjectModel(Sale.name)
    private readonly saleModel:
      Model<SaleDocument>,

    @InjectModel(SaleItem.name)
    private readonly saleItemModel:
      Model<SaleItemDocument>,

    @InjectModel(Product.name)
    private readonly productModel:
      Model<ProductDocument>,

    private readonly inventoryService:
      InventoryService,

    private readonly cashRegisterService:
      CashRegisterService,
  ) {}

  async create(
    createSaleDto: CreateSaleDto,
    userId: string,
  ): Promise<SaleDocument> {
    const {
      items,
      discount = 0,
      paymentMethod,
    } = createSaleDto;

    if (items.length === 0) {
      throw new BadRequestException(
        'La venta debe tener al menos un producto',
      );
    }

    if (paymentMethod === 'CASH') {
      await this.cashRegisterService.getCurrent(
        userId,
      );
    }

    let subtotal = 0;

    const saleItemsData: {
      productId: ProductDocument['_id'];
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }[] = [];

    for (const item of items) {
      const product =
        await this.productModel
          .findById(item.productId)
          .exec();

      if (!product) {
        throw new NotFoundException(
          `Producto no encontrado: ${item.productId}`,
        );
      }

      if (product.status !== 'ACTIVE') {
        throw new BadRequestException(
          `El producto ${product.name} está inactivo`,
        );
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para el producto ${product.name}`,
        );
      }

      const itemSubtotal =
        product.salePrice * item.quantity;

      subtotal += itemSubtotal;

      saleItemsData.push({
        productId: product._id,
        quantity: item.quantity,
        unitPrice: product.salePrice,
        subtotal: itemSubtotal,
      });
    }

    if (discount > subtotal) {
      throw new BadRequestException(
        'El descuento no puede ser mayor que el subtotal',
      );
    }

    const total = subtotal - discount;

    const saleNumber =
      `SALE-${Date.now()}`;

    const sale =
      await this.saleModel.create({
        saleNumber,
        userId,
        subtotal,
        discount,
        total,
        paymentMethod,
        status: 'COMPLETED',
      });

    await this.saleItemModel.insertMany(
      saleItemsData.map((item) => ({
        ...item,
        saleId: sale._id,
      })),
    );

    for (const item of saleItemsData) {
      await this.inventoryService.createMovement(
        {
          productId:
            item.productId.toString(),
          type: 'OUT',
          quantity: item.quantity,
          reason:
            `Venta ${saleNumber}`,
        },
        userId,
      );
    }

    if (paymentMethod === 'CASH') {
      await this.cashRegisterService.addCash(
        userId,
        total,
        sale._id.toString(),
      );
    }

    return sale;
  }

  async findAll(): Promise<SaleDocument[]> {
    return this.saleModel
      .find()
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string) {
    const sale =
      await this.saleModel
        .findById(id)
        .exec();

    if (!sale) {
      throw new NotFoundException(
        'Venta no encontrada',
      );
    }

    const items =
      await this.saleItemModel
        .find({
          saleId: sale._id,
        })
        .populate(
          'productId',
          'name barcode sku brand',
        )
        .exec();

    return {
      sale,
      items,
    };
  }

  async cancel(
    id: string,
    cancelSaleDto: CancelSaleDto,
    userId: string,
  ): Promise<SaleDocument> {
    const sale =
      await this.saleModel
        .findById(id)
        .exec();

    if (!sale) {
      throw new NotFoundException(
        'Venta no encontrada',
      );
    }

    if (sale.status !== 'COMPLETED') {
      throw new BadRequestException(
        'La venta no puede cancelarse porque no está en estado COMPLETED',
      );
    }

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

    if (sale.paymentMethod === 'CASH') {
      await this.cashRegisterService.getCurrent(
        userId,
      );
    }

    for (const item of saleItems) {
      const product =
        await this.productModel
          .findById(item.productId)
          .exec();

      if (!product) {
        throw new NotFoundException(
          `Producto no encontrado: ${item.productId}`,
        );
      }

      await this.inventoryService.createMovement(
        {
          productId:
            item.productId.toString(),
          type: 'IN',
          quantity: item.quantity,
          reason:
            `Cancelación venta ${sale.saleNumber}`,
        },
        userId,
      );
    }

    if (sale.paymentMethod === 'CASH') {
      await this.cashRegisterService.removeCash(
        userId,
        sale.total,
        sale._id.toString(),
      );
    }

    sale.status = 'CANCELLED';

    sale.cancelledBy =
      new Types.ObjectId(userId);

    sale.cancelledAt =
      new Date();

    sale.cancellationReason =
      cancelSaleDto.cancellationReason;

    return sale.save();
  }
}