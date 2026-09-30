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
        });
    }

    Object.assign(
      configuration,
      updateConfigurationDto,
    );

    return configuration.save();
  }
}