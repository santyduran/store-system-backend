import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { InventoryService } from './inventory.service.js';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';

@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('movements')
  createMovement(
    @Body() createInventoryMovementDto: CreateInventoryMovementDto,
    @Req() request: Request,
  ) {
    const user = request.user as {
      userId: string;
    };

    return this.inventoryService.createMovement(
      createInventoryMovementDto,
      user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('movements')
  findAll() {
    return this.inventoryService.findAll();
  }
}