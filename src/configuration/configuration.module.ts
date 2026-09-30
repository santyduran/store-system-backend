import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ConfigurationService } from './configuration.service.js';

import {
  StoreConfiguration,
  StoreConfigurationSchema,
} from './schemas/store-configuration.schema.js';
import { ConfigurationController } from './configuration.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: StoreConfiguration.name,
        schema: StoreConfigurationSchema,
      },
    ]),
  ],
  providers: [ConfigurationService],
  exports: [ConfigurationService],
  controllers: [ConfigurationController],
})
export class ConfigurationModule {}