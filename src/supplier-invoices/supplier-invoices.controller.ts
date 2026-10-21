
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  StreamableFile,
  Res,
} from '@nestjs/common';

import {
  FileInterceptor,
} from '@nestjs/platform-express';

import type {
  Response,
} from 'express';

import {
  createReadStream,
} from 'node:fs';

import {
  basename,
} from 'node:path';

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
  SupplierInvoicesService,
} from './supplier-invoices.service.js';

import {
  SupplierInvoiceAttachmentService,
} from './supplier-invoice-attachment.service.js';

import {
  CreateSupplierInvoiceDto,
} from './dto/create-supplier-invoice.dto.js';

import {
  UpdateSupplierInvoiceDto,
} from './dto/update-supplier-invoice.dto.js';

import {
  PaySupplierInvoiceDto,
} from './dto/pay-supplier-invoice.dto.js';

@Controller('supplier-invoices')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class SupplierInvoicesController {
  constructor(
    private readonly supplierInvoicesService:
      SupplierInvoicesService,
    private readonly attachmentService:
      SupplierInvoiceAttachmentService,
  ) {}

  @Post()
  @Roles('ADMIN')
  create(
    @Body()
    createSupplierInvoiceDto:
      CreateSupplierInvoiceDto,
  ) {
    return this.supplierInvoicesService.create(
      createSupplierInvoiceDto,
    );
  }

  @Get()
  @Roles('ADMIN', 'CASHIER')
  findAll() {
    return this.supplierInvoicesService.findAll();
  }

  @Get('payables/pending')
  @Roles('ADMIN', 'CASHIER')
  findPendingPayables() {
    return this.supplierInvoicesService
      .findPendingPayables();
  }

  @Get('payables/overdue')
  @Roles('ADMIN', 'CASHIER')
  findOverduePayables() {
    return this.supplierInvoicesService
      .findOverduePayables();
  }

  @Get('payables/paid')
  @Roles('ADMIN', 'CASHIER')
  findPaidPayables() {
    return this.supplierInvoicesService
      .findPaidPayables();
  }

  @Get('payables/summary')
  @Roles('ADMIN', 'CASHIER')
  getPayablesSummary() {
    return this.supplierInvoicesService
      .getPayablesSummary();
  }

  @Get(':id/items')
  @Roles('ADMIN', 'CASHIER')
  findItems(
    @Param('id')
    id: string,
  ) {
    return this.supplierInvoicesService.findItems(
      id,
    );
  }

  @Post(':id/attachment')
  @Roles('ADMIN')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
      },
    }),
  )
  uploadAttachment(
    @Param('id')
    id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 5 * 1024 * 1024,
          }),
          new FileTypeValidator({
            fileType: /^(application\/pdf|image\/(jpeg|png|webp))$/,
          }),
        ],
      }),
    )
    file: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
  ) {
    if (!file) {
      throw new BadRequestException(
        'Debes seleccionar un archivo',
      );
    }

    return this.attachmentService.saveAttachment(
      id,
      file,
    );
  }

  @Get(':id/attachment')
  @Roles('ADMIN', 'CASHIER')
  async getAttachment(
    @Param('id')
    id: string,
    @Res({
      passthrough: true,
    })
    response: Response,
  ) {
    const attachment =
      await this.attachmentService.getAttachment(id);

    response.setHeader(
      'Content-Type',
      attachment.mimeType,
    );

    response.setHeader(
      'Content-Disposition',
      `inline; filename="${basename(attachment.fileName)}"`,
    );

    response.setHeader(
      'X-Content-Type-Options',
      'nosniff',
    );

    return new StreamableFile(
      createReadStream(attachment.filePath),
    );
  }

  @Get(':id')
  @Roles('ADMIN', 'CASHIER')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.supplierInvoicesService.findOne(
      id,
    );
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id')
    id: string,
    @Body()
    updateSupplierInvoiceDto:
      UpdateSupplierInvoiceDto,
  ) {
    return this.supplierInvoicesService.update(
      id,
      updateSupplierInvoiceDto,
    );
  }

  @Post(':id/pay')
  @Roles('ADMIN')
  pay(
    @Param('id')
    id: string,
    @Body()
    paySupplierInvoiceDto:
      PaySupplierInvoiceDto,
  ) {
    return this.supplierInvoicesService.pay(
      id,
      paySupplierInvoiceDto,
    );
  }

  @Patch(':id/cancel')
  @Roles('ADMIN')
  cancel(
    @Param('id')
    id: string,
    @Body()
    body: {
      reason?: string;
    },
  ) {
    return this.supplierInvoicesService.cancel(
      id,
      body?.reason,
    );
  }
}
