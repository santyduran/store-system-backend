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
        'El ID de la categorÃ­a no es vÃ¡lido.',
      );
    }

    const category =
      await this.categoryModel
        .findById(categoryId)
        .exec();

    if (!category) {
      throw new NotFoundException(
        'La categorÃ­a no existe.',
      );
    }

    try {
      return await this.productModel.create({
        ...productData,
        category: new Types.ObjectId(categoryId),
      });
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          'Ya existe un producto con ese SKU o cÃ³digo de barras.',
        );
      }

      throw error;
    }
  }

  async findAll(): Promise<ProductDocument[]> {
    return this.productModel
      .find()
      .populate('category')
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
  ): Promise<ProductDocument | null> {
    return this.productModel
      .findById(id)
      .populate('category')
      .exec();
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductDocument | null> {
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
          'El ID de la categorÃ­a no es vÃ¡lido.',
        );
      }

      const category =
        await this.categoryModel
          .findById(categoryId)
          .exec();

      if (!category) {
        throw new NotFoundException(
          'La categorÃ­a no existe.',
        );
      }

      updateData.category =
        new Types.ObjectId(categoryId);
    }

    try {
      return await this.productModel
        .findByIdAndUpdate(
          id,
          updateData,
          {
            new: true,
            runValidators: true,
          },
        )
        .populate('category')
        .exec();
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          'Ya existe un producto con ese SKU o cÃ³digo de barras.',
        );
      }

      throw error;
    }
  }

  async remove(
    id: string,
  ): Promise<ProductDocument | null> {
    return this.productModel
      .findByIdAndDelete(id)
      .exec();
  }
}