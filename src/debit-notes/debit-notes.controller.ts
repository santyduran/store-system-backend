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
  DebitNotesService,
} from './debit-notes.service.js';

import {
  CreateDebitNoteDto,
} from './dto/create-debit-note.dto.js';

import {
  JwtAuthGuard,
} from '../auth/guards/jwt-auth/jwt-auth.guard.js';

import {
  Roles,
} from '../auth/decorators/roles/roles.decorator.js';

import {
  RolesGuard,
} from '../auth/guards/roles/roles.guard.js';

@Controller('debit-notes')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class DebitNotesController {
  constructor(
    private readonly debitNotesService:
      DebitNotesService,
  ) {}

  @Post()
  @Roles('ADMIN', 'CASHIER')
  create(
    @Body()
    createDebitNoteDto: CreateDebitNoteDto,

    @Req()
    request: Request,
  ) {
    const user =
      request.user as {
        userId: string;
      };

    return this.debitNotesService.create(
      createDebitNoteDto,
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

    return this.debitNotesService.cancel(
      id,
      user.userId,
      body.cancellationReason,
    );
  }

  @Get()
  findAll() {
    return this.debitNotesService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.debitNotesService.findOne(id);
  }
}