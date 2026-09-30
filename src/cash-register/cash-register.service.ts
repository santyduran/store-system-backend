import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import {
  InjectModel,
} from '@nestjs/mongoose';

import {
  Model,
} from 'mongoose';

import {
  CashRegister,
  CashRegisterDocument,
} from './schemas/cash-register.schema.js';

import {
  CashMovement,
  CashMovementDocument,
} from './schemas/cash-movement.schema.js';

import {
  OpenCashRegisterDto,
} from './dto/open-cash-register.dto.js';

import {
  CloseCashRegisterDto,
} from './dto/close-cash-register.dto.js';

@Injectable()
export class CashRegisterService {
  constructor(
    @InjectModel(CashRegister.name)
    private readonly cashRegisterModel:
      Model<CashRegisterDocument>,

    @InjectModel(CashMovement.name)
    private readonly cashMovementModel:
      Model<CashMovementDocument>,
  ) {}

  async open(
    openCashRegisterDto: OpenCashRegisterDto,
    userId: string,
  ): Promise<CashRegisterDocument> {
    const existingCashRegister =
      await this.cashRegisterModel
        .findOne({
          userId,
          status: 'OPEN',
        })
        .exec();

    if (existingCashRegister) {
      throw new BadRequestException(
        'El usuario ya tiene una caja abierta',
      );
    }

    const cashRegister =
      await this.cashRegisterModel.create({
        userId,
        openingAmount:
          openCashRegisterDto.openingAmount,
        openingDate: new Date(),
        expectedCash:
          openCashRegisterDto.openingAmount,
        status: 'OPEN',
      });

    await this.cashMovementModel.create({
      cashRegisterId: cashRegister._id,
      userId,
      type: 'OPENING',
      movementType: 'IN',
      amount:
        openCashRegisterDto.openingAmount,
      description:
        'Apertura de caja',
    });

    return cashRegister;
  }

  async getCurrent(
    userId: string,
  ): Promise<CashRegisterDocument> {
    const cashRegister =
      await this.cashRegisterModel
        .findOne({
          userId,
          status: 'OPEN',
        })
        .exec();

    if (!cashRegister) {
      throw new BadRequestException(
        'El usuario no tiene una caja abierta',
      );
    }

    return cashRegister;
  }

  async getLatest(
    userId: string,
  ): Promise<CashRegisterDocument> {
    const cashRegister =
      await this.cashRegisterModel
        .findOne({
          userId,
        })
        .sort({
          createdAt: -1,
        })
        .exec();

    if (!cashRegister) {
      throw new BadRequestException(
        'El usuario no tiene cajas registradas',
      );
    }

    return cashRegister;
  }

  async getMovements(
    userId: string,
  ): Promise<CashMovementDocument[]> {
    const cashRegister =
      await this.getLatest(userId);

    return this.cashMovementModel
      .find({
        cashRegisterId:
          cashRegister._id,
      })
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  async addCash(
    userId: string,
    amount: number,
    saleId?: string,
  ): Promise<CashRegisterDocument> {
    const cashRegister =
      await this.getCurrent(userId);

    cashRegister.expectedCash += amount;

    await cashRegister.save();

    await this.cashMovementModel.create({
      cashRegisterId: cashRegister._id,
      userId,
      type: 'SALE',
      movementType: 'IN',
      amount,
      saleId,
      description:
        'Venta en efectivo',
    });

    return cashRegister;
  }

  async removeCash(
    userId: string,
    amount: number,
    saleId?: string,
  ): Promise<CashRegisterDocument> {
    const cashRegister =
      await this.getCurrent(userId);

    if (
      cashRegister.expectedCash <
      amount
    ) {
      throw new BadRequestException(
        'El efectivo esperado de la caja no puede quedar negativo',
      );
    }

    cashRegister.expectedCash -= amount;

    await cashRegister.save();

    await this.cashMovementModel.create({
      cashRegisterId: cashRegister._id,
      userId,
      type: 'SALE_CANCELLATION',
      movementType: 'OUT',
      amount,
      saleId,
      description:
        'Cancelación de venta en efectivo',
    });

    return cashRegister;
  }

  async close(
    closeCashRegisterDto: CloseCashRegisterDto,
    userId: string,
  ): Promise<CashRegisterDocument> {
    const cashRegister =
      await this.getCurrent(userId);

    const countedCash =
      closeCashRegisterDto.countedCash;

    const difference =
      countedCash -
      cashRegister.expectedCash;

    cashRegister.countedCash =
      countedCash;

    cashRegister.difference =
      difference;

    cashRegister.closingDate =
      new Date();

    cashRegister.status =
      'CLOSED';

    return cashRegister.save();
  }
}