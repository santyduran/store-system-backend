import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

import type {
  Request,
  Response,
} from 'express';

import {
  InvoicesService,
} from './invoices.service.js';

import {
  InvoicePdfService,
} from './invoice-pdf.service.js';

import {
  CreateInvoiceDto,
} from './dto/create-invoice.dto.js';

import {
  CancelInvoiceDto,
} from './dto/cancel-invoice.dto.js';

import {
  JwtAuthGuard,
} from '../auth/guards/jwt-auth/jwt-auth.guard.js';

import {
  Roles,
} from '../auth/decorators/roles/roles.decorator.js';

import {
  RolesGuard,
} from '../auth/guards/roles/roles.guard.js';

@Controller('invoicing')
@UseGuards(JwtAuthGuard)
export class InvoicingController {
  constructor(
    private readonly invoicesService:
      InvoicesService,

    private readonly invoicePdfService:
      InvoicePdfService,
  ) {}

  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles('ADMIN', 'CASHIER')
  @Post()
  create(
    @Body()
    createInvoiceDto: CreateInvoiceDto,
  ) {
    return this.invoicesService.create(
      createInvoiceDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.invoicesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/pdf')
  async generatePdf(
    @Param('id')
    id: string,

    @Res()
    response: Response,
  ) {
    return this.invoicePdfService.generateInvoicePdf(
      id,
      response,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.invoicesService.findOne(id);
  }

  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles('ADMIN', 'CASHIER')
  @Patch(':id/cancel')
  cancel(
    @Param('id')
    id: string,

    @Body()
    cancelInvoiceDto: CancelInvoiceDto,

    @Req()
    request: Request,
  ) {
    const user =
      request.user as {
        userId: string;
      };

    return this.invoicesService.cancel(
      id,
      cancelInvoiceDto,
      user.userId,
    );
  }
}