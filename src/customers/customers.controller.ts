import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import {
  CustomersService,
} from './customers.service.js';

import {
  CreateCustomerDto,
} from './dto/create-customer.dto.js';

import {
  UpdateCustomerDto,
} from './dto/update-customer.dto.js';

import {
  JwtAuthGuard,
} from '../auth/guards/jwt-auth/jwt-auth.guard.js';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(
    private readonly customersService:
      CustomersService,
  ) {}

  @Post()
  create(
    @Body()
    createCustomerDto: CreateCustomerDto,
  ) {
    return this.customersService.create(
      createCustomerDto,
    );
  }

  @Get()
  findAll() {
    return this.customersService.findAll();
  }

  @Get('active')
  findActive() {
    return this.customersService.findActive();
  }

  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.customersService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id')
    id: string,
    @Body()
    updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(
      id,
      updateCustomerDto,
    );
  }

  @Delete(':id')
  remove(
    @Param('id')
    id: string,
  ) {
    return this.customersService.remove(id);
  }
}