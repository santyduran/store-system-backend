import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  Category,
  CategoryDocument,
} from './schemas/category.schema.js';

import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel:
      Model<CategoryDocument>,
  ) {}

  async create(categoryData: {
    name: string;
    description?: string;
  }): Promise<CategoryDocument> {
    try {
      return await this.categoryModel.create(
        categoryData,
      );
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          'Ya existe una categoría con ese nombre.',
        );
      }

      throw error;
    }
  }

  async findAll(): Promise<CategoryDocument[]> {
    return this.categoryModel
      .find()
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  async findOne(
    id: string,
  ): Promise<CategoryDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'El ID de la categoría no es válido.',
      );
    }

    const category =
      await this.categoryModel
        .findById(id)
        .exec();

    if (!category) {
      throw new NotFoundException(
        'Categoría no encontrada.',
      );
    }

    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'El ID de la categoría no es válido.',
      );
    }

    try {
      const updatedCategory =
        await this.categoryModel
          .findByIdAndUpdate(
            id,
            {
              $set: updateCategoryDto,
            },
            {
              new: true,
              runValidators: true,
            },
          )
          .exec();

      if (!updatedCategory) {
        throw new NotFoundException(
          'Categoría no encontrada.',
        );
      }

      return updatedCategory;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error?.code === 11000) {
        throw new ConflictException(
          'Ya existe una categoría con ese nombre.',
        );
      }

      throw error;
    }
  }

  async remove(
    id: string,
  ): Promise<CategoryDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'El ID de la categoría no es válido.',
      );
    }

    const category =
      await this.categoryModel
        .findById(id)
        .exec();

    if (!category) {
      throw new NotFoundException(
        'Categoría no encontrada.',
      );
    }

    category.status = 'INACTIVE';

    return category.save();
  }
}