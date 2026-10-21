import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  JwtAuthGuard,
} from '../auth/guards/jwt-auth/jwt-auth.guard.js';

import {
  RolesGuard,
} from '../auth/guards/roles/roles.guard.js';

import {
  Roles,
} from '../auth/decorators/roles/roles.decorator.js';

import {
  CreateProviderDto,
} from './dto/create-provider.dto.js';

import {
  UpdateProviderDto,
} from './dto/update-provider.dto.js';

import {
  ProvidersService,
} from './providers.service.js';

@Controller('providers')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class ProvidersController {
  constructor(
    private readonly providersService:
      ProvidersService,
  ) {}

  @Post()
  @Roles('ADMIN')
  create(
    @Body()
    createProviderDto: CreateProviderDto,
  ) {
    return this.providersService.create(
      createProviderDto,
    );
  }

  @Get()
  @Roles('ADMIN', 'CASHIER')
  findAll() {
    return this.providersService.findAll();
  }

  @Get('active')
  @Roles('ADMIN', 'CASHIER')
  findActive() {
    return this.providersService.findActive();
  }

  @Get(':id')
  @Roles('ADMIN', 'CASHIER')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.providersService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id')
    id: string,
    @Body()
    updateProviderDto: UpdateProviderDto,
  ) {
    return this.providersService.update(
      id,
      updateProviderDto,
    );
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(
    @Param('id')
    id: string,
  ) {
    return this.providersService.remove(id);
  }
}