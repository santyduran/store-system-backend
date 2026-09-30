import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Sale,
  SaleDocument,
} from '../sales/schemas/sale.schema.js';

import {
  SaleItem,
  SaleItemDocument,
} from '../sales/schemas/sale-item.schema.js';

import {
  Product,
  ProductDocument,
} from '../products/schemas/product.schema.js';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Sale.name)
    private readonly saleModel: Model<SaleDocument>,

    @InjectModel(SaleItem.name)
    private readonly saleItemModel: Model<SaleItemDocument>,

    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async getSalesReport(
    startDate?: string,
    endDate?: string,
  ) {
    const filter: {
      status: string;
      createdAt?: {
        $gte?: Date;
        $lte?: Date;
      };
    } = {
      status: 'COMPLETED',
    };

    if (startDate || endDate) {
      filter.createdAt = {};

      if (startDate) {
        filter.createdAt.$gte = new Date(
          `${startDate}T00:00:00.000Z`,
        );
      }

      if (endDate) {
        filter.createdAt.$lte = new Date(
          `${endDate}T23:59:59.999Z`,
        );
      }
    }

    const sales = await this.saleModel
      .find(filter)
      .exec();

    const totalSales = sales.length;

    const subtotalAmount = sales.reduce(
      (total, sale) => total + sale.subtotal,
      0,
    );

    const discountAmount = sales.reduce(
      (total, sale) => total + sale.discount,
      0,
    );

    const totalAmount = sales.reduce(
      (total, sale) => total + sale.total,
      0,
    );

    const cashAmount = sales
      .filter(
        (sale) => sale.paymentMethod === 'CASH',
      )
      .reduce(
        (total, sale) => total + sale.total,
        0,
      );

    const cardAmount = sales
      .filter(
        (sale) => sale.paymentMethod === 'CARD',
      )
      .reduce(
        (total, sale) => total + sale.total,
        0,
      );

    const transferAmount = sales
      .filter(
        (sale) => sale.paymentMethod === 'TRANSFER',
      )
      .reduce(
        (total, sale) => total + sale.total,
        0,
      );

    const averageSale =
      totalSales > 0
        ? totalAmount / totalSales
        : 0;

    return {
      totalSales,
      subtotalAmount,
      discountAmount,
      totalAmount,
      averageSale,
      cashAmount,
      cardAmount,
      transferAmount,
    };
  }

  async getInventoryReport() {
    const products = await this.productModel
      .find()
      .exec();

    const totalProducts = products.length;

    const activeProducts = products.filter(
      (product) => product.status === 'ACTIVE',
    ).length;

    const inactiveProducts = products.filter(
      (product) => product.status === 'INACTIVE',
    ).length;

    const lowStockProducts = products.filter(
      (product) => product.stock <= product.minStock,
    ).length;

    return {
      totalProducts,
      activeProducts,
      inactiveProducts,
      lowStockProducts,
    };
  }

  async getLowStockProductsReport() {
    const products = await this.productModel
      .find({
        status: 'ACTIVE',
      })
      .exec();

    const lowStockProducts = products
      .filter(
        (product) => product.stock <= product.minStock,
      )
      .map((product) => ({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        stock: product.stock,
        minStock: product.minStock,
        difference:
          product.minStock - product.stock,
      }));

    return {
      totalLowStockProducts:
        lowStockProducts.length,
      products: lowStockProducts,
    };
  }

  async getBestSellingProductsReport(
    startDate?: string,
    endDate?: string,
  ) {
    const filter: {
      status: string;
      createdAt?: {
        $gte?: Date;
        $lte?: Date;
      };
    } = {
      status: 'COMPLETED',
    };

    if (startDate || endDate) {
      filter.createdAt = {};

      if (startDate) {
        filter.createdAt.$gte = new Date(
          `${startDate}T00:00:00.000Z`,
        );
      }

      if (endDate) {
        filter.createdAt.$lte = new Date(
          `${endDate}T23:59:59.999Z`,
        );
      }
    }

    const completedSales =
      await this.saleModel
        .find(filter)
        .select('_id')
        .exec();

    const completedSaleIds =
      completedSales.map(
        (sale) => sale._id,
      );

    const saleItems =
      await this.saleItemModel
        .find({
          saleId: {
            $in: completedSaleIds,
          },
        })
        .exec();

    const productsMap = new Map<
      string,
      {
        productId: string;
        quantitySold: number;
        totalAmount: number;
      }
    >();

    for (const item of saleItems) {
      const productId =
        item.productId.toString();

      const existing =
        productsMap.get(productId);

      if (existing) {
        existing.quantitySold +=
          item.quantity;

        existing.totalAmount +=
          item.subtotal;
      } else {
        productsMap.set(productId, {
          productId,
          quantitySold: item.quantity,
          totalAmount: item.subtotal,
        });
      }
    }

    const products = await this.productModel
      .find({
        _id: {
          $in: Array.from(
            productsMap.keys(),
          ),
        },
      })
      .select('name sku barcode')
      .exec();

    const productsReport = products
      .map((product) => {
        const salesData =
          productsMap.get(
            product._id.toString(),
          );

        return {
          productId:
            product._id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          quantitySold:
            salesData?.quantitySold ?? 0,
          totalAmount:
            salesData?.totalAmount ?? 0,
        };
      })
      .sort(
        (a, b) =>
          b.quantitySold -
          a.quantitySold,
      );

    return {
      totalProductsSold:
        productsReport.length,
      products: productsReport,
    };
  }

  async getInventoryValueReport() {
    const products = await this.productModel
      .find({
        status: 'ACTIVE',
      })
      .exec();

    const purchaseValue = products.reduce(
      (total, product) =>
        total +
        product.purchasePrice * product.stock,
      0,
    );

    const saleValue = products.reduce(
      (total, product) =>
        total +
        product.salePrice * product.stock,
      0,
    );

    const potentialMargin =
      saleValue - purchaseValue;

    return {
      purchaseValue,
      saleValue,
      potentialMargin,
    };
  }
}