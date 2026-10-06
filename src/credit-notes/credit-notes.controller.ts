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

import type {
  Request,
} from 'express';

import {
  CreditNotesService,
} from './credit-notes.service.js';

import {
  CreateCreditNoteDto,
} from './dto/create-credit-note.dto.js';

import {
  JwtAuthGuard,
} from '../auth/guards/jwt-auth/jwt-auth.guard.js';

import {
  Roles,
} from '../auth/decorators/roles/roles.decorator.js';

import {
  RolesGuard,
} from '../auth/guards/roles/roles.guard.js';

@Controller('credit-notes')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class CreditNotesController {
  constructor(
    private readonly creditNotesService:
      CreditNotesService,
  ) {}

  @Post()
  @Roles('ADMIN', 'CASHIER')
  create(
    @Body()
    createCreditNoteDto: CreateCreditNoteDto,

    @Req()
    request: Request,
  ) {
    const user =
      request.user as {
        userId: string;
      };

    return this.creditNotesService.create(
      createCreditNoteDto,
      user.userId,
    );
  }

  @Patch(':id/cancel')
  @Roles('ADMIN', 'CASHIER')
  cancel(
    @Param('id')
    id: string,

    @Body()
    body: {
      cancellationReason: string;
    },

    @Req()
    request: Request,
  ) {
    const user =
      request.user as {
        userId: string;
      };

    return this.creditNotesService.cancel(
      id,
      user.userId,
      body.cancellationReason,
    );
  }

  @Get()
  findAll() {
    return this.creditNotesService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.creditNotesService.findOne(id);
  }
}