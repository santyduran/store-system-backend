import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Product,
  ProductDocument,
} from './schemas/product.schema.js';

import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';

import {
  Category,
  CategoryDocument,
} from '../categories/schemas/category.schema.js';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,

    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  async create(
    createProductDto: CreateProductDto,
  ): Promise<ProductDocument> {
    const {
      categoryId,
      ...productData
    } = createProductDto;

    if (!Types.ObjectId.isValid(categoryId)) {
      throw new BadRequestException(
        'El ID de la categoría no es válido.',
      );
    }

    const category =
      await this.categoryModel
        .findById(categoryId)
        .exec();

    if (!category) {
      throw new NotFoundException(
        'La categoría no existe.',
      );
    }

    try {
      return await this.productModel.create({
        ...productData,
        category:
          new Types.ObjectId(categoryId),
      });
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          'Ya existe un producto con ese SKU o código de barras.',
        );
      }

      throw error;
    }
  }

  async findAll(): Promise<ProductDocument[]> {
    return this.productModel
      .find()
      .populate('category')
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  async search(
    term: string,
  ): Promise<ProductDocument[]> {
    const searchTerm =
      term?.trim();

    if (!searchTerm) {
      return [];
    }

    return this.productModel
      .find({
        status: 'ACTIVE',
        $or: [
          {
            barcode: searchTerm,
          },
          {
            sku: searchTerm,
          },
          {
            name: {
              $regex: searchTerm,
              $options: 'i',
            },
          },
        ],
      })
      .populate('category')
      .exec();
  }

  async findOne(
    id: string,
  ): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'El ID del producto no es válido.',
      );
    }

    const product =
      await this.productModel
        .findById(id)
        .populate('category')
        .exec();

    if (!product) {
      throw new NotFoundException(
        'Producto no encontrado.',
      );
    }

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'El ID del producto no es válido.',
      );
    }

    const {
      categoryId,
      ...productData
    } = updateProductDto;

    const updateData: Record<string, unknown> = {
      ...productData,
    };

    if (categoryId !== undefined) {
      if (!Types.ObjectId.isValid(categoryId)) {
        throw new BadRequestException(
          'El ID de la categoría no es válido.',
        );
      }

      const category =
        await this.categoryModel
          .findById(categoryId)
          .exec();

      if (!category) {
        throw new NotFoundException(
          'La categoría no existe.',
        );
      }

      updateData.category =
        new Types.ObjectId(categoryId);
    }

    try {
      const updatedProduct =
        await this.productModel
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
          .populate('category')
          .exec();

      if (!updatedProduct) {
        throw new NotFoundException(
          'Producto no encontrado.',
        );
      }

      return updatedProduct;
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          'Ya existe un producto con ese SKU o código de barras.',
        );
      }

      throw error;
    }
  }

  async remove(
    id: string,
  ): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'El ID del producto no es válido.',
      );
    }

    const product =
      await this.productModel
        .findById(id)
        .exec();

    if (!product) {
      throw new NotFoundException(
        'Producto no encontrado.',
      );
    }

    product.status = 'INACTIVE';

    return product.save();
  }
}