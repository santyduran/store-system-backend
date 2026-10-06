import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  InjectModel,
} from '@nestjs/mongoose';

import {
  Model,
  Types,
} from 'mongoose';

import {
  Customer,
  CustomerDocument,
} from './schemas/customer.schema.js';

import {
  CreateCustomerDto,
} from './dto/create-customer.dto.js';

import {
  UpdateCustomerDto,
} from './dto/update-customer.dto.js';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name)
    private readonly customerModel:
      Model<CustomerDocument>,
  ) {}

  async create(
    createCustomerDto: CreateCustomerDto,
  ): Promise<CustomerDocument> {
    const documentNumber =
      createCustomerDto.documentNumber.trim();

    const existingCustomer =
      await this.customerModel
        .findOne({
          documentType:
            createCustomerDto.documentType,
          documentNumber,
        })
        .exec();

    if (existingCustomer) {
      throw new ConflictException(
        'Ya existe un cliente con ese tipo y número de documento',
      );
    }

    return this.customerModel.create({
      ...createCustomerDto,
      documentNumber,
    });
  }

  async findAll(): Promise<CustomerDocument[]> {
    return this.customerModel
      .find()
      .sort({
        createdAt: -1,
      })
      .exec();
  }

  async findActive(): Promise<CustomerDocument[]> {
    return this.customerModel
      .find({
        status: 'ACTIVE',
      })
      .sort({
        firstName: 1,
        lastName: 1,
      })
      .exec();
  }

  async findOne(
    id: string,
  ): Promise<CustomerDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        'El id del cliente no es válido',
      );
    }

    const customer =
      await this.customerModel
        .findById(id)
        .exec();

    if (!customer) {
      throw new NotFoundException(
        'Cliente no encontrado',
      );
    }

    return customer;
  }

  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<CustomerDocument> {
    const customer =
      await this.findOne(id);

    if (
      updateCustomerDto.documentType ||
      updateCustomerDto.documentNumber
    ) {
      const documentType =
        updateCustomerDto.documentType ??
        customer.documentType;

      const documentNumber =
        (
          updateCustomerDto.documentNumber ??
          customer.documentNumber
        ).trim();

      const existingCustomer =
        await this.customerModel
          .findOne({
            documentType,
            documentNumber,
            _id: {
              $ne: customer._id,
            },
          })
          .exec();

      if (existingCustomer) {
        throw new ConflictException(
          'Ya existe otro cliente con ese tipo y número de documento',
        );
      }

      updateCustomerDto = {
        ...updateCustomerDto,
        documentNumber,
      };
    }

    const updatedCustomer =
      await this.customerModel
        .findByIdAndUpdate(
          id,
          {
            $set: updateCustomerDto,
          },
          {
            new: true,
            runValidators: true,
          },
        )
        .exec();

    if (!updatedCustomer) {
      throw new NotFoundException(
        'Cliente no encontrado',
      );
    }

    return updatedCustomer;
  }

  async remove(
    id: string,
  ): Promise<CustomerDocument> {
    const customer =
      await this.findOne(id);

    customer.status = 'INACTIVE';

    return customer.save();
  }
}