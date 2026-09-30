import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ReportsService } from './reports.service.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('sales')
  getSalesReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getSalesReport(
      startDate,
      endDate,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('inventory')
  getInventoryReport() {
    return this.reportsService.getInventoryReport();
  }

  @UseGuards(JwtAuthGuard)
  @Get('low-stock')
  getLowStockProductsReport() {
    return this.reportsService.getLowStockProductsReport();
  }

  @UseGuards(JwtAuthGuard)
  @Get('inventory-value')
  getInventoryValueReport() {
    return this.reportsService.getInventoryValueReport();
  }

  @UseGuards(JwtAuthGuard)
  @Get('best-selling-products')
  getBestSellingProductsReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getBestSellingProductsReport(
      startDate,
      endDate,
    );
  }
}