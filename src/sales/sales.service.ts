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
  Sale,
  SaleDocument,
} from './schemas/sale.schema.js';

import {
  SaleItem,
  SaleItemDocument,
} from './schemas/sale-item.schema.js';

import {
  PendingSale,
  PendingSaleDocument,
} from './schemas/pending-sale.schema.js';

import {
  Product,
  ProductDocument,
} from '../products/schemas/product.schema.js';

import {
  Customer,
  CustomerDocument,
} from '../customers/schemas/customer.schema.js';

import {
  CreateSaleDto,
} from './dto/create-sale.dto.js';

import {
  CreatePendingSaleDto,
} from './dto/create-pending-sale.dto.js';

import {
  UpdatePendingSaleDto,
} from './dto/update-pending-sale.dto.js';

import {
  CompletePendingSaleDto,
} from './dto/complete-pending-sale.dto.js';

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

    @InjectModel(PendingSale.name)
    private readonly pendingSaleModel:
      Model<PendingSaleDocument>,

    @InjectModel(Product.name)
    private readonly productModel:
      Model<ProductDocument>,

    @InjectModel(Customer.name)
    private readonly customerModel:
      Model<CustomerDocument>,

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
      customerId,
      discount = 0,
      paymentMethod,
    } = createSaleDto;

    if (items.length === 0) {
      throw new BadRequestException(
        'La venta debe tener al menos un producto',
      );
    }

    let customerObjectId:
      | Types.ObjectId
      | undefined;

    if (customerId) {
      if (!Types.ObjectId.isValid(customerId)) {
        throw new BadRequestException(
          'El customerId no es válido',
        );
      }

      const customer =
        await this.customerModel
          .findById(customerId)
          .exec();

      if (!customer) {
        throw new NotFoundException(
          'Cliente no encontrado',
        );
      }

      if (customer.status !== 'ACTIVE') {
        throw new BadRequestException(
          'El cliente está inactivo',
        );
      }

      customerObjectId =
        customer._id;
    }

    if (paymentMethod === 'CASH') {
      await this.cashRegisterService.getCurrent(
        userId,
      );
    }

    let subtotal = 0;
    let tax = 0;

    const saleItemsData: {
      productId: ProductDocument['_id'];
      quantity: number;
      unitPrice: number;
      subtotal: number;
      taxRate: number;
      taxAmount: number;
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

      const salePrice =
        Number(product.salePrice);

      const taxRate =
        Number(product.taxRate ?? 0);

      const quantity =
        Number(item.quantity);

      const unitPriceBeforeTax =
        taxRate > 0
          ? salePrice /
            (1 + taxRate / 100)
          : salePrice;

      const itemSubtotal =
        unitPriceBeforeTax *
        quantity;

      const itemTotalWithTax =
        salePrice *
        quantity;

      const itemTaxAmount =
        itemTotalWithTax -
        itemSubtotal;

      const roundedUnitPrice =
        Math.round(
          unitPriceBeforeTax * 100,
        ) / 100;

      const roundedSubtotal =
        Math.round(
          itemSubtotal * 100,
        ) / 100;

      const roundedTaxAmount =
        Math.round(
          itemTaxAmount * 100,
        ) / 100;

      subtotal += roundedSubtotal;
      tax += roundedTaxAmount;

      saleItemsData.push({
        productId: product._id,
        quantity,
        unitPrice: roundedUnitPrice,
        subtotal: roundedSubtotal,
        taxRate,
        taxAmount: roundedTaxAmount,
      });
    }

    subtotal =
      Math.round(
        subtotal * 100,
      ) / 100;

    tax =
      Math.round(
        tax * 100,
      ) / 100;

    const normalizedDiscount =
      Math.max(
        0,
        Number(discount),
      );

    if (
      normalizedDiscount >
      subtotal
    ) {
      throw new BadRequestException(
        'El descuento no puede ser mayor que el subtotal',
      );
    }

    const total =
      Math.round(
        (
          subtotal +
          tax -
          normalizedDiscount
        ) * 100,
      ) / 100;

    const saleNumber =
      `SALE-${Date.now()}`;

    const sale =
      await this.saleModel.create({
        saleNumber,
        userId,
        customerId: customerObjectId,
        subtotal,
        discount: normalizedDiscount,
        tax,
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

  async createPendingSale(
    createPendingSaleDto: CreatePendingSaleDto,
    userId: string,
  ): Promise<PendingSaleDocument> {
    const {
      items,
      customerId,
      discount = 0,
    } = createPendingSaleDto;

    if (items.length === 0) {
      throw new BadRequestException(
        'La venta debe tener al menos un producto',
      );
    }

    let customerObjectId:
      | Types.ObjectId
      | undefined;

    if (customerId) {
      if (!Types.ObjectId.isValid(customerId)) {
        throw new BadRequestException(
          'El customerId no es válido',
        );
      }

      const customer =
        await this.customerModel
          .findById(customerId)
          .exec();

      if (!customer) {
        throw new NotFoundException(
          'Cliente no encontrado',
        );
      }

      if (customer.status !== 'ACTIVE') {
        throw new BadRequestException(
          'El cliente está inactivo',
        );
      }

      customerObjectId =
        customer._id;
    }

    const pendingItems: {
      productId: Types.ObjectId;
      quantity: number;
      unitPrice: number;
      taxRate: number;
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

      const salePrice =
        Number(product.salePrice);

      const taxRate =
        Number(product.taxRate ?? 0);

      const unitPriceBeforeTax =
        taxRate > 0
          ? salePrice /
            (1 + taxRate / 100)
          : salePrice;

      const roundedUnitPrice =
        Math.round(
          unitPriceBeforeTax * 100,
        ) / 100;

      pendingItems.push({
        productId: product._id,
        quantity: Number(item.quantity),
        unitPrice: roundedUnitPrice,
        taxRate,
      });
    }

    const normalizedDiscount =
      Math.max(
        0,
        Number(discount),
      );

    const pendingNumber =
      `PENDING-${Date.now()}-${Math.floor(
        Math.random() * 1000,
      )}`;

    return this.pendingSaleModel.create({
      pendingNumber,
      userId: new Types.ObjectId(userId),
      customerId: customerObjectId,
      items: pendingItems,
      discount: normalizedDiscount,
      status: 'PENDING',
    });
  }

  async findPendingSales(
    userId?: string,
  ): Promise<PendingSaleDocument[]> {
    const filter: {
      status: string;
      userId?: Types.ObjectId;
    } = {
      status: 'PENDING',
    };

    if (
      userId &&
      Types.ObjectId.isValid(userId)
    ) {
      filter.userId =
        new Types.ObjectId(userId);
    }

    return this.pendingSaleModel
      .find(filter)
      .populate(
        'userId',
        'name email role',
      )
      .populate(
        'customerId',
        'documentType documentNumber firstName lastName email phone address city status',
      )
      .populate(
        'items.productId',
        'name barcode sku brand salePrice taxRate stock status',
      )
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  async findPendingSale(
    id: string,
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'El ID de la venta pendiente no es válido',
      );
    }

    const pendingSale =
      await this.pendingSaleModel
        .findById(id)
        .populate(
          'userId',
          'name email role',
        )
        .populate(
          'customerId',
          'documentType documentNumber firstName lastName email phone address city status',
        )
        .populate(
          'items.productId',
          'name barcode sku brand salePrice taxRate stock status',
        )
        .exec();

    if (!pendingSale) {
      throw new NotFoundException(
        'Venta pendiente no encontrada',
      );
    }

    return pendingSale;
  }

  async updatePendingSale(
    id: string,
    updatePendingSaleDto: UpdatePendingSaleDto,
    userId: string,
  ): Promise<PendingSaleDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'El ID de la venta pendiente no es válido',
      );
    }

    const pendingSale =
      await this.pendingSaleModel
        .findById(id)
        .exec();

    if (!pendingSale) {
      throw new NotFoundException(
        'Venta pendiente no encontrada',
      );
    }

    if (
      pendingSale.userId.toString() !== userId
    ) {
      throw new NotFoundException(
        'Venta pendiente no encontrada',
      );
    }

    if (pendingSale.status !== 'PENDING') {
      throw new BadRequestException(
        'La venta pendiente ya no puede actualizarse',
      );
    }

    const {
      items,
      customerId,
      discount = 0,
    } = updatePendingSaleDto;

    if (items.length === 0) {
      throw new BadRequestException(
        'La venta debe tener al menos un producto',
      );
    }

    let customerObjectId:
      | Types.ObjectId
      | undefined;

    if (customerId) {
      if (!Types.ObjectId.isValid(customerId)) {
        throw new BadRequestException(
          'El customerId no es válido',
        );
      }

      const customer =
        await this.customerModel
          .findById(customerId)
          .exec();

      if (!customer) {
        throw new NotFoundException(
          'Cliente no encontrado',
        );
      }

      if (customer.status !== 'ACTIVE') {
        throw new BadRequestException(
          'El cliente está inactivo',
        );
      }

      customerObjectId =
        customer._id;
    }

    const previousItems = new Map(
      pendingSale.items.map((item) => [
        item.productId.toString(),
        item,
      ]),
    );

    const pendingItems: {
      productId: Types.ObjectId;
      quantity: number;
      unitPrice: number;
      taxRate: number;
    }[] = [];

    let subtotal = 0;

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

      const quantity =
        Number(item.quantity);

      const previousItem =
        previousItems.get(
          product._id.toString(),
        );

      let unitPrice: number;
      let taxRate: number;

      if (previousItem) {
        unitPrice =
          Number(
            previousItem.unitPrice,
          );

        taxRate =
          Number(
            previousItem.taxRate,
          );
      } else {
        const salePrice =
          Number(product.salePrice);

        taxRate =
          Number(
            product.taxRate ?? 0,
          );

        const unitPriceBeforeTax =
          taxRate > 0
            ? salePrice /
              (1 + taxRate / 100)
            : salePrice;

        unitPrice =
          Math.round(
            unitPriceBeforeTax * 100,
          ) / 100;
      }

      const itemSubtotal =
        Math.round(
          unitPrice *
            quantity *
            100,
        ) / 100;

      subtotal += itemSubtotal;

      pendingItems.push({
        productId: product._id,
        quantity,
        unitPrice,
        taxRate,
      });
    }

    subtotal =
      Math.round(
        subtotal * 100,
      ) / 100;

    const normalizedDiscount =
      Math.max(
        0,
        Number(discount),
      );

    if (
      normalizedDiscount >
      subtotal
    ) {
      throw new BadRequestException(
        'El descuento no puede ser mayor que el subtotal',
      );
    }

    pendingSale.items =
      pendingItems;

    pendingSale.customerId =
      customerObjectId;

    pendingSale.discount =
      normalizedDiscount;

    await pendingSale.save();

    return this.findPendingSale(
      pendingSale._id.toString(),
    );
  }

  async completePendingSale(
    id: string,
    completePendingSaleDto: CompletePendingSaleDto,
    userId: string,
  ): Promise<SaleDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'El ID de la venta pendiente no es válido',
      );
    }

    const pendingSale =
      await this.pendingSaleModel
        .findById(id)
        .exec();

    if (!pendingSale) {
      throw new NotFoundException(
        'Venta pendiente no encontrada',
      );
    }

    if (pendingSale.status !== 'PENDING') {
      throw new BadRequestException(
        'La venta pendiente ya no está disponible para finalizar',
      );
    }

    if (
      completePendingSaleDto.paymentMethod ===
      'CASH'
    ) {
      await this.cashRegisterService.getCurrent(
        userId,
      );
    }

    let customerObjectId:
      | Types.ObjectId
      | undefined;

    if (pendingSale.customerId) {
      const customer =
        await this.customerModel
          .findById(
            pendingSale.customerId,
          )
          .exec();

      if (!customer) {
        throw new NotFoundException(
          'Cliente no encontrado',
        );
      }

      if (customer.status !== 'ACTIVE') {
        throw new BadRequestException(
          'El cliente está inactivo',
        );
      }

      customerObjectId =
        customer._id;
    }

    let subtotal = 0;
    let tax = 0;

    const saleItemsData: {
      productId: Types.ObjectId;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      taxRate: number;
      taxAmount: number;
    }[] = [];

    for (
      const pendingItem of
      pendingSale.items
    ) {
      const product =
        await this.productModel
          .findById(
            pendingItem.productId,
          )
          .exec();

      if (!product) {
        throw new NotFoundException(
          `Producto no encontrado: ${pendingItem.productId}`,
        );
      }

      if (product.status !== 'ACTIVE') {
        throw new BadRequestException(
          `El producto ${product.name} está inactivo`,
        );
      }

      if (
        product.stock <
        pendingItem.quantity
      ) {
        throw new BadRequestException(
          `Stock insuficiente para el producto ${product.name}`,
        );
      }

      const quantity =
        Number(pendingItem.quantity);

      const unitPrice =
        Number(pendingItem.unitPrice);

      const taxRate =
        Number(pendingItem.taxRate);

      const itemSubtotal =
        unitPrice * quantity;

      const itemTaxAmount =
        itemSubtotal *
        (taxRate / 100);

      const roundedSubtotal =
        Math.round(
          itemSubtotal * 100,
        ) / 100;

      const roundedTaxAmount =
        Math.round(
          itemTaxAmount * 100,
        ) / 100;

      subtotal += roundedSubtotal;
      tax += roundedTaxAmount;

      saleItemsData.push({
        productId:
          pendingItem.productId,
        quantity,
        unitPrice,
        subtotal: roundedSubtotal,
        taxRate,
        taxAmount: roundedTaxAmount,
      });
    }

    subtotal =
      Math.round(
        subtotal * 100,
      ) / 100;

    tax =
      Math.round(
        tax * 100,
      ) / 100;

    const normalizedDiscount =
      Math.max(
        0,
        Number(pendingSale.discount),
      );

    if (
      normalizedDiscount >
      subtotal
    ) {
      throw new BadRequestException(
        'El descuento no puede ser mayor que el subtotal',
      );
    }

    const total =
      Math.round(
        (
          subtotal +
          tax -
          normalizedDiscount
        ) * 100,
      ) / 100;

    const saleNumber =
      `SALE-${Date.now()}`;

    const sale =
      await this.saleModel.create({
        saleNumber,
        userId,
        customerId: customerObjectId,
        subtotal,
        discount: normalizedDiscount,
        tax,
        total,
        paymentMethod:
          completePendingSaleDto.paymentMethod,
        status: 'COMPLETED',
      });

    await this.saleItemModel.insertMany(
      saleItemsData.map((item) => ({
        ...item,
        saleId: sale._id,
      })),
    );

    for (
      const item of saleItemsData
    ) {
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

    if (
      completePendingSaleDto.paymentMethod ===
      'CASH'
    ) {
      await this.cashRegisterService.addCash(
        userId,
        total,
        sale._id.toString(),
      );
    }

    pendingSale.status =
      'COMPLETED';

    await pendingSale.save();

    return sale;
  }

  async cancelPendingSale(
    id: string,
  ): Promise<PendingSaleDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'El ID de la venta pendiente no es válido',
      );
    }

    const pendingSale =
      await this.pendingSaleModel
        .findById(id)
        .exec();

    if (!pendingSale) {
      throw new NotFoundException(
        'Venta pendiente no encontrada',
      );
    }

    if (pendingSale.status !== 'PENDING') {
      throw new BadRequestException(
        'La venta pendiente ya no puede cancelarse',
      );
    }

    pendingSale.status =
      'CANCELLED';

    return pendingSale.save();
  }

  async findAll(): Promise<SaleDocument[]> {
    return this.saleModel
      .find()
      .populate(
        'customerId',
        'documentType documentNumber firstName lastName email phone address city status',
      )
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  async findOne(id: string) {
    const sale =
      await this.saleModel
        .findById(id)
        .populate(
          'customerId',
          'documentType documentNumber firstName lastName email phone address city status',
        )
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
          'name barcode sku brand taxRate',
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