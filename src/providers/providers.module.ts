import {
  Module,
} from '@nestjs/common';

import {
  MongooseModule,
} from '@nestjs/mongoose';

import {
  Provider,
  ProviderSchema,
} from './schemas/provider.schema.js';

import {
  ProvidersController,
} from './providers.controller.js';

import {
  ProvidersService,
} from './providers.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Provider.name,
        schema: ProviderSchema,
      },
    ]),
  ],
  controllers: [
    ProvidersController,
  ],
  providers: [
    ProvidersService,
  ],
  exports: [
    ProvidersService,
  ],
})
export class ProvidersModule {}