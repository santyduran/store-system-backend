import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { CashRegisterService } from './cash-register.service.js';
import { OpenCashRegisterDto } from './dto/open-cash-register.dto.js';
import { CloseCashRegisterDto } from './dto/close-cash-register.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';

@Controller('cash-register')
export class CashRegisterController {
  constructor(
    private readonly cashRegisterService: CashRegisterService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('open')
  open(
    @Body() openCashRegisterDto: OpenCashRegisterDto,
    @Req() request: Request,
  ) {
    const user = request.user as { userId: string };

    return this.cashRegisterService.open(
      openCashRegisterDto,
      user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('current')
  getCurrent(@Req() request: Request) {
    const user = request.user as { userId: string };

    return this.cashRegisterService.getCurrent(
      user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('latest')
  getLatest(@Req() request: Request) {
    const user = request.user as { userId: string };

    return this.cashRegisterService.getLatest(
      user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('movements')
  getMovements(@Req() request: Request) {
    const user = request.user as { userId: string };

    return this.cashRegisterService.getMovements(
      user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('close')
  close(
    @Body() closeCashRegisterDto: CloseCashRegisterDto,
    @Req() request: Request,
  ) {
    const user = request.user as { userId: string };

    return this.cashRegisterService.close(
      closeCashRegisterDto,
      user.userId,
    );
  }
}