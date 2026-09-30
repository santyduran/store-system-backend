import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { SalesService } from './sales.service.js';

import { CreateSaleDto } from './dto/create-sale.dto.js';

import { CancelSaleDto } from './dto/cancel-sale.dto.js';

import {
  JwtAuthGuard,
} from '../auth/guards/jwt-auth/jwt-auth.guard.js';

import {
  Roles,
} from '../auth/decorators/roles/roles.decorator.js';

import {
  RolesGuard,
} from '../auth/guards/roles/roles.guard.js';

@Controller('sales')
export class SalesController {
  constructor(
    private readonly salesService:
      SalesService,
  ) {}

  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles('ADMIN', 'CASHIER')
  @Post()
  create(
    @Body()
    createSaleDto: CreateSaleDto,
    @Req() request: Request,
  ) {
    const user =
      request.user as {
        userId: string;
      };

    return this.salesService.create(
      createSaleDto,
      user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.salesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.salesService.findOne(id);
  }

  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles('ADMIN')
  @Patch(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Body()
    cancelSaleDto: CancelSaleDto,
    @Req() request: Request,
  ) {
    const user =
      request.user as {
        userId: string;
      };

    return this.salesService.cancel(
      id,
      cancelSaleDto,
      user.userId,
    );
  }
}