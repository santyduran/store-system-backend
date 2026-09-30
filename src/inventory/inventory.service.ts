import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  InventoryMovement,
  InventoryMovementDocument,
} from './schemas/inventory-movement.schema.js';

import {
  Product,
  ProductDocument,
} from '../products/schemas/product.schema.js';

import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto.js';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(InventoryMovement.name)
    private readonly inventoryMovementModel: Model<InventoryMovementDocument>,

    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async createMovement(
    createInventoryMovementDto: CreateInventoryMovementDto,
    userId: string,
  ): Promise<InventoryMovementDocument> {
    const {
      productId,
      type,
      quantity,
      reason,
    } = createInventoryMovementDto;

    const product = await this.productModel
      .findById(productId)
      .exec();

    if (!product) {
      throw new NotFoundException(
        'Producto no encontrado',
      );
    }

    const previousStock = product.stock;

    let newStock = previousStock;

    if (type === 'IN') {
      newStock = previousStock + quantity;
    }

    if (type === 'OUT') {
      newStock = previousStock - quantity;
    }

    if (type === 'ADJUSTMENT') {
      newStock = quantity;
    }

    if (newStock < 0) {
      throw new BadRequestException(
        'El stock no puede ser negativo',
      );
    }

    product.stock = newStock;

    await product.save();

    return this.inventoryMovementModel.create({
      productId: product._id,
      type,
      quantity,
      previousStock,
      newStock,
      reason,
      userId,
    });
  }

  async findAll(): Promise<InventoryMovementDocument[]> {
    return this.inventoryMovementModel
      .find()
      .sort({ createdAt: -1 })
      .exec();
  }
}
