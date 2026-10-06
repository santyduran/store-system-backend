import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  CashRegister,
  CashRegisterDocument,
} from './schemas/cash-register.schema.js';

import {
  CashMovement,
  CashMovementDocument,
} from './schemas/cash-movement.schema.js';

import { OpenCashRegisterDto } from './dto/open-cash-register.dto.js';
import { CloseCashRegisterDto } from './dto/close-cash-register.dto.js';
import { CreateCashEntryDto } from './dto/create-cash-entry.dto.js';
import { CreateCashExitDto } from './dto/create-cash-exit.dto.js';

@Injectable()
export class CashRegisterService {
  constructor(
    @InjectModel(CashRegister.name)
    private readonly cashRegisterModel: Model<CashRegisterDocument>,

    @InjectModel(CashMovement.name)
    private readonly cashMovementModel: Model<CashMovementDocument>,
  ) {}

  async open(
    openCashRegisterDto: OpenCashRegisterDto,
    userId: string,
  ): Promise<CashRegisterDocument> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException(
        'El usuario autenticado no es válido.',
      );
    }

    const openingAmount = Number(
      openCashRegisterDto.openingAmount,
    );

    if (!Number.isFinite(openingAmount) || openingAmount < 0) {
      throw new BadRequestException(
        'El monto de apertura no es válido.',
      );
    }

    const existingOpenCashRegister =
      await this.cashRegisterModel.findOne({
        status: 'OPEN',
      });

    if (existingOpenCashRegister) {
      throw new BadRequestException(
        'Ya existe una caja abierta.',
      );
    }

    const cashRegister =
      await this.cashRegisterModel.create({
        userId: new Types.ObjectId(userId),
        openingAmount,
        openingDate: new Date(),
        expectedCash: openingAmount,
        status: 'OPEN',
      });

    await this.cashMovementModel.create({
      cashRegisterId: cashRegister._id,
      userId: new Types.ObjectId(userId),
      type: 'OPENING',
      movementType: 'IN',
      amount: openingAmount,
      description: 'Apertura de caja',
    });

    return cashRegister;
  }

  async getCurrent(
    _userId: string,
  ): Promise<CashRegisterDocument | null> {
    return this.cashRegisterModel
      .findOne({
        status: 'OPEN',
      })
      .sort({
        openingDate: -1,
      })
      .exec();
  }

  async getLatest(
    _userId: string,
  ): Promise<CashRegisterDocument | null> {
    return this.cashRegisterModel
      .findOne()
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  async getMovements(
    _userId: string,
  ): Promise<CashMovementDocument[]> {
    const currentCashRegister =
      await this.cashRegisterModel
        .findOne({
          status: 'OPEN',
        })
        .sort({
          openingDate: -1,
        })
        .exec();

    let cashRegisterId: Types.ObjectId | undefined;

    if (currentCashRegister) {
      cashRegisterId = currentCashRegister._id;
    } else {
      const latestCashRegister =
        await this.cashRegisterModel
          .findOne()
          .sort({
            createdAt: -1,
          })
          .exec();

      if (latestCashRegister) {
        cashRegisterId = latestCashRegister._id;
      }
    }

    if (!cashRegisterId) {
      return [];
    }

    return this.cashMovementModel
      .find({
        cashRegisterId,
      })
      .populate(
        'userId',
        'name email role',
      )
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
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException(
        'El usuario autenticado no es válido.',
      );
    }

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      throw new BadRequestException(
        'El monto de entrada no es válido.',
      );
    }

    const currentCashRegister =
      await this.cashRegisterModel.findOneAndUpdate(
        {
          status: 'OPEN',
        },
        {
          $inc: {
            expectedCash: numericAmount,
          },
        },
        {
          new: true,
        },
      );

    if (!currentCashRegister) {
      throw new BadRequestException(
        'No existe una caja abierta.',
      );
    }

    await this.cashMovementModel.create({
      cashRegisterId: currentCashRegister._id,
      userId: new Types.ObjectId(userId),
      type: 'SALE',
      movementType: 'IN',
      amount: numericAmount,
      ...(saleId
        ? {
            saleId: new Types.ObjectId(saleId),
          }
        : {}),
      description: 'Entrada por venta',
    });

    return currentCashRegister;
  }

  async removeCash(
    userId: string,
    amount: number,
    saleId?: string,
  ): Promise<CashRegisterDocument> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException(
        'El usuario autenticado no es válido.',
      );
    }

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      throw new BadRequestException(
        'El monto de salida no es válido.',
      );
    }

    const currentCashRegister =
      await this.cashRegisterModel.findOneAndUpdate(
        {
          status: 'OPEN',
          expectedCash: {
            $gte: numericAmount,
          },
        },
        {
          $inc: {
            expectedCash: -numericAmount,
          },
        },
        {
          new: true,
        },
      );

    if (!currentCashRegister) {
      const openCashRegister =
        await this.cashRegisterModel.findOne({
          status: 'OPEN',
        });

      if (!openCashRegister) {
        throw new BadRequestException(
          'No existe una caja abierta.',
        );
      }

      throw new BadRequestException(
        'La salida de caja no puede superar el efectivo disponible.',
      );
    }

    await this.cashMovementModel.create({
      cashRegisterId: currentCashRegister._id,
      userId: new Types.ObjectId(userId),
      type: 'SALE_CANCELLATION',
      movementType: 'OUT',
      amount: numericAmount,
      ...(saleId
        ? {
            saleId: new Types.ObjectId(saleId),
          }
        : {}),
      description: 'Salida por cancelación de venta',
    });

    return currentCashRegister;
  }

  async createCashEntry(
    dto: CreateCashEntryDto,
    userId: string,
  ): Promise<CashRegisterDocument> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException(
        'El usuario autenticado no es válido.',
      );
    }

    const amount = Number(dto.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException(
        'El monto de entrada no es válido.',
      );
    }

    const currentCashRegister =
      await this.cashRegisterModel.findOneAndUpdate(
        {
          status: 'OPEN',
        },
        {
          $inc: {
            expectedCash: amount,
          },
        },
        {
          new: true,
        },
      );

    if (!currentCashRegister) {
      throw new BadRequestException(
        'No existe una caja abierta.',
      );
    }

    await this.cashMovementModel.create({
      cashRegisterId: currentCashRegister._id,
      userId: new Types.ObjectId(userId),
      type: 'CASH_ENTRY',
      movementType: 'IN',
      amount,
      description: dto.description,
    });

    return currentCashRegister;
  }

  async createCashExit(
    dto: CreateCashExitDto,
    userId: string,
  ): Promise<CashRegisterDocument> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException(
        'El usuario autenticado no es válido.',
      );
    }

    const amount = Number(dto.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException(
        'El monto de salida no es válido.',
      );
    }

    const currentCashRegister =
      await this.cashRegisterModel.findOneAndUpdate(
        {
          status: 'OPEN',
          expectedCash: {
            $gte: amount,
          },
        },
        {
          $inc: {
            expectedCash: -amount,
          },
        },
        {
          new: true,
        },
      );

    if (!currentCashRegister) {
      const openCashRegister =
        await this.cashRegisterModel.findOne({
          status: 'OPEN',
        });

      if (!openCashRegister) {
        throw new BadRequestException(
          'No existe una caja abierta.',
        );
      }

      throw new BadRequestException(
        'La salida de caja no puede superar el efectivo esperado disponible.',
      );
    }

    await this.cashMovementModel.create({
      cashRegisterId: currentCashRegister._id,
      userId: new Types.ObjectId(userId),
      type: 'CASH_EXIT',
      movementType: 'OUT',
      amount,
      description: dto.description,
    });

    return currentCashRegister;
  }

  async close(
    closeCashRegisterDto: CloseCashRegisterDto,
    _userId: string,
  ): Promise<CashRegisterDocument> {
    const countedCash = Number(
      closeCashRegisterDto.countedCash,
    );

    if (!Number.isFinite(countedCash) || countedCash < 0) {
      throw new BadRequestException(
        'El efectivo contado no es válido.',
      );
    }

    const currentCashRegister =
      await this.cashRegisterModel.findOne({
        status: 'OPEN',
      });

    if (!currentCashRegister) {
      throw new BadRequestException(
        'No existe una caja abierta.',
      );
    }

    const difference =
      countedCash - currentCashRegister.expectedCash;

    const closedCashRegister =
      await this.cashRegisterModel.findOneAndUpdate(
        {
          _id: currentCashRegister._id,
          status: 'OPEN',
        },
        {
          $set: {
            countedCash,
            difference,
            closingDate: new Date(),
            status: 'CLOSED',
          },
        },
        {
          new: true,
        },
      );

    if (!closedCashRegister) {
      throw new BadRequestException(
        'La caja ya fue cerrada por otro usuario.',
      );
    }

    await this.cashMovementModel.create({
      cashRegisterId: closedCashRegister._id,
      userId: new Types.ObjectId(_userId),
      type: 'CASH_EXIT',
      movementType: 'OUT',
      amount: 0,
      description: 'Cierre de caja',
    });

    return closedCashRegister;
  }
}