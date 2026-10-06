import {
  Injectable,
} from '@nestjs/common';

import {
  InjectModel,
} from '@nestjs/mongoose';

import {
  Model,
} from 'mongoose';

import {
  StoreConfiguration,
  StoreConfigurationDocument,
} from './schemas/store-configuration.schema.js';

import {
  UpdateConfigurationDto,
} from './dto/update-configuration.dto.js';

@Injectable()
export class ConfigurationService {
  constructor(
    @InjectModel(StoreConfiguration.name)
    private readonly configurationModel:
      Model<StoreConfigurationDocument>,
  ) {}

  async getConfiguration(): Promise<StoreConfigurationDocument> {
    let configuration =
      await this.configurationModel
        .findOne()
        .exec();

    if (!configuration) {
      configuration =
        await this.configurationModel.create({
          storeName: 'Store System',
          invoicePrefix: 'FV',
          invoiceCurrentNumber: 0,
        });
    }

    return configuration;
  }

  async updateConfiguration(
    updateConfigurationDto: UpdateConfigurationDto,
  ): Promise<StoreConfigurationDocument> {
    let configuration =
      await this.configurationModel
        .findOne()
        .exec();

    if (!configuration) {
      configuration =
        await this.configurationModel.create({
          storeName: 'Store System',
          invoicePrefix: 'FV',
          invoiceCurrentNumber: 0,
        });
    }

    const updateData = {
      ...updateConfigurationDto,
      storeName:
        updateConfigurationDto.storeName ??
        configuration.storeName ??
        'Store System',
      invoicePrefix:
        updateConfigurationDto.invoicePrefix ??
        configuration.invoicePrefix ??
        'FV',
      invoiceCurrentNumber:
        updateConfigurationDto.invoiceCurrentNumber ??
        configuration.invoiceCurrentNumber ??
        0,
    };

    return this.configurationModel
      .findByIdAndUpdate(
        configuration._id,
        {
          $set: updateData,
        },
        {
          new: true,
          runValidators: true,
        },
      )
      .exec()
      .then((updatedConfiguration) => {
        if (!updatedConfiguration) {
          throw new Error(
            'No se pudo actualizar la configuración.',
          );
        }

        return updatedConfiguration;
      });
  }
}