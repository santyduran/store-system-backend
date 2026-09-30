import {
  ConflictException,
  Injectable,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Category,
  CategoryDocument,
} from './schemas/category.schema.js';

import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
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
    return this.categoryModel.find().exec();
  }

  async findOne(
    id: string,
  ): Promise<CategoryDocument | null> {
    return this.categoryModel
      .findById(id)
      .exec();
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryDocument | null> {
    try {
      return await this.categoryModel
        .findByIdAndUpdate(
          id,
          updateCategoryDto,
          {
            new: true,
            runValidators: true,
          },
        )
        .exec();
    } catch (error: any) {
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
  ): Promise<CategoryDocument | null> {
    return this.categoryModel
      .findByIdAndDelete(id)
      .exec();
  }
}