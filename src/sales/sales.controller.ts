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

import {
  CreatePendingSaleDto,
} from './dto/create-pending-sale.dto.js';

import {
  UpdatePendingSaleDto,
} from './dto/update-pending-sale.dto.js';

import {
  CompletePendingSaleDto,
} from './dto/complete-pending-sale.dto.js';

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

  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles('ADMIN', 'CASHIER')
  @Post('pending')
  createPendingSale(
    @Body()
    createPendingSaleDto:
      CreatePendingSaleDto,
    @Req() request: Request,
  ) {
    const user =
      request.user as {
        userId: string;
      };

    return this.salesService.createPendingSale(
      createPendingSaleDto,
      user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('pending')
  findPendingSales(
    @Req() request: Request,
  ) {
    const user =
      request.user as {
        userId: string;
      };

    return this.salesService.findPendingSales(
      user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('pending/:id')
  findPendingSale(
    @Param('id') id: string,
  ) {
    return this.salesService.findPendingSale(
      id,
    );
  }

  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles('ADMIN', 'CASHIER')
  @Patch('pending/:id')
  updatePendingSale(
    @Param('id') id: string,
    @Body()
    updatePendingSaleDto:
      UpdatePendingSaleDto,
    @Req() request: Request,
  ) {
    const user =
      request.user as {
        userId: string;
      };

    return this.salesService.updatePendingSale(
      id,
      updatePendingSaleDto,
      user.userId,
    );
  }

  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles('ADMIN', 'CASHIER')
  @Post('pending/:id/complete')
  completePendingSale(
    @Param('id') id: string,
    @Body()
    completePendingSaleDto:
      CompletePendingSaleDto,
    @Req() request: Request,
  ) {
    const user =
      request.user as {
        userId: string;
      };

    return this.salesService.completePendingSale(
      id,
      completePendingSaleDto,
      user.userId,
    );
  }

  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles('ADMIN', 'CASHIER')
  @Patch('pending/:id/cancel')
  cancelPendingSale(
    @Param('id') id: string,
  ) {
    return this.salesService.cancelPendingSale(
      id,
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
  @Roles('ADMIN', 'CASHIER')
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