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
  Provider,
  ProviderDocument,
} from './schemas/provider.schema.js';

import {
  CreateProviderDto,
} from './dto/create-provider.dto.js';

import {
  UpdateProviderDto,
} from './dto/update-provider.dto.js';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectModel(Provider.name)
    private readonly providerModel:
      Model<ProviderDocument>,
  ) {}

  async create(
    createProviderDto: CreateProviderDto,
  ): Promise<ProviderDocument> {
    const nit =
      createProviderDto.nit.trim();

    const verificationDigit =
      createProviderDto.verificationDigit.trim();

    const existingProvider =
      await this.providerModel
        .findOne({
          nit,
        })
        .exec();

    if (existingProvider) {
      throw new ConflictException(
        'Ya existe un proveedor con ese NIT',
      );
    }

    return this.providerModel.create({
      ...createProviderDto,
      nit,
      verificationDigit,
    });
  }

  async findAll(): Promise<ProviderDocument[]> {
    return this.providerModel
      .find()
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  async findActive(): Promise<ProviderDocument[]> {
    return this.providerModel
      .find({
        status: 'ACTIVE',
      })
      .sort({
        businessName: 1,
      })
      .exec();
  }

  async findOne(
    id: string,
  ): Promise<ProviderDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'El id del proveedor no es válido',
      );
    }

    const provider =
      await this.providerModel
        .findById(id)
        .exec();

    if (!provider) {
      throw new NotFoundException(
        'Proveedor no encontrado',
      );
    }

    return provider;
  }

  async update(
    id: string,
    updateProviderDto: UpdateProviderDto,
  ): Promise<ProviderDocument> {
    const provider =
      await this.findOne(id);

    if (
      updateProviderDto.nit
    ) {
      const nit =
        updateProviderDto.nit.trim();

      const existingProvider =
        await this.providerModel
          .findOne({
            nit,
            _id: {
              $ne: provider._id,
            },
          })
          .exec();

      if (existingProvider) {
        throw new ConflictException(
          'Ya existe otro proveedor con ese NIT',
        );
      }

      updateProviderDto = {
        ...updateProviderDto,
        nit,
      };
    }

    if (
      updateProviderDto.verificationDigit
    ) {
      updateProviderDto = {
        ...updateProviderDto,
        verificationDigit:
          updateProviderDto.verificationDigit.trim(),
      };
    }

    const updatedProvider =
      await this.providerModel
        .findByIdAndUpdate(
          id,
          {
            $set: updateProviderDto,
          },
          {
            new: true,
            runValidators: true,
          },
        )
        .exec();

    if (!updatedProvider) {
      throw new NotFoundException(
        'Proveedor no encontrado',
      );
    }

    return updatedProvider;
  }

  async remove(
    id: string,
  ): Promise<ProviderDocument> {
    const provider =
      await this.findOne(id);

    provider.status = 'INACTIVE';

    return provider.save();
  }
}