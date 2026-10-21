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

import {
  Provider,
} from '../providers/schemas/provider.schema.js';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,

    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,

    @InjectModel(Provider.name)
    private readonly providerModel: Model<Provider>,
  ) {}

  async create(
    createProductDto: CreateProductDto,
  ): Promise<ProductDocument> {
    const {
      categoryId,
      providerId,
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

    let providerObjectId: Types.ObjectId | null = null;

    if (providerId) {
      if (!Types.ObjectId.isValid(providerId)) {
        throw new BadRequestException(
          'El ID del proveedor no es válido.',
        );
      }

      const provider =
        await this.providerModel
          .findById(providerId)
          .exec();

      if (!provider) {
        throw new NotFoundException(
          'El proveedor no existe.',
        );
      }

      if (provider.status !== 'ACTIVE') {
        throw new BadRequestException(
          'No se puede asignar un proveedor inactivo.',
        );
      }

      providerObjectId = new Types.ObjectId(providerId);
    }

    try {
      return await this.productModel.create({
        ...productData,
        category: new Types.ObjectId(categoryId),
        provider: providerObjectId,
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
      .populate('provider')
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  async findByProvider(
    providerId: string,
  ): Promise<ProductDocument[]> {
    if (!Types.ObjectId.isValid(providerId)) {
      throw new BadRequestException(
        'El ID del proveedor no es válido.',
      );
    }

    const provider =
      await this.providerModel
        .findById(providerId)
        .exec();

    if (!provider) {
      throw new NotFoundException(
        'El proveedor no existe.',
      );
    }

    return this.productModel
      .find({
        provider: new Types.ObjectId(providerId),
      })
      .populate('category')
      .populate('provider')
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  async search(
    term: string,
  ): Promise<ProductDocument[]> {
    const searchTerm = term?.trim();

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
      .populate('provider')
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
        .populate('provider')
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
      providerId,
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

      updateData.category = new Types.ObjectId(categoryId);
    }

    if (providerId !== undefined) {
      if (providerId === null || providerId === '') {
        updateData.provider = null;
      } else {
        if (!Types.ObjectId.isValid(providerId)) {
          throw new BadRequestException(
            'El ID del proveedor no es válido.',
          );
        }

        const provider =
          await this.providerModel
            .findById(providerId)
            .exec();

        if (!provider) {
          throw new NotFoundException(
            'El proveedor no existe.',
          );
        }

        if (provider.status !== 'ACTIVE') {
          throw new BadRequestException(
            'No se puede asignar un proveedor inactivo.',
          );
        }

        updateData.provider = new Types.ObjectId(providerId);
      }
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
          .populate('provider')
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