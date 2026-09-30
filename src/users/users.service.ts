import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  InjectModel,
} from '@nestjs/mongoose';

import {
  Model,
} from 'mongoose';

import * as bcrypt from 'bcryptjs';

import {
  User,
  UserDocument,
} from './schemas/user.schema.js';

import {
  CreateUserDto,
} from './dto/create-user.dto.js';

import {
  UpdateUserDto,
} from './dto/update-user.dto.js';

import {
  UpdateUserStatusDto,
} from './dto/update-user-status.dto.js';

import {
  UpdateUserPasswordDto,
} from './dto/update-user-password.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel:
      Model<UserDocument>,
  ) {}

  async create(
    createUserDto: CreateUserDto,
  ): Promise<UserDocument> {
    const hashedPassword =
      await bcrypt.hash(
        createUserDto.password,
        10,
      );

    return this.userModel.create({
      ...createUserDto,
      password: hashedPassword,
    });
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel
      .find()
      .select('-password')
      .exec();
  }

  async findOne(
    id: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findById(id)
      .select('-password')
      .exec();
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    const user =
      await this.userModel
        .findById(id)
        .exec();

    if (!user) {
      throw new NotFoundException(
        'Usuario no encontrado',
      );
    }

    if (updateUserDto.name !== undefined) {
      user.name =
        updateUserDto.name;
    }

    if (updateUserDto.email !== undefined) {
      user.email =
        updateUserDto.email.toLowerCase();
    }

    if (updateUserDto.role !== undefined) {
      user.role =
        updateUserDto.role;
    }

    await user.save();

    const updatedUser =
      await this.userModel
        .findById(id)
        .select('-password')
        .exec();

    if (!updatedUser) {
      throw new NotFoundException(
        'Usuario no encontrado',
      );
    }

    return updatedUser;
  }

  async updateStatus(
    id: string,
    updateUserStatusDto: UpdateUserStatusDto,
  ): Promise<UserDocument> {
    const user =
      await this.userModel
        .findById(id)
        .exec();

    if (!user) {
      throw new NotFoundException(
        'Usuario no encontrado',
      );
    }

    user.status =
      updateUserStatusDto.status;

    await user.save();

    const updatedUser =
      await this.userModel
        .findById(id)
        .select('-password')
        .exec();

    if (!updatedUser) {
      throw new NotFoundException(
        'Usuario no encontrado',
      );
    }

    return updatedUser;
  }

  async updatePassword(
    id: string,
    updateUserPasswordDto:
      UpdateUserPasswordDto,
  ): Promise<UserDocument> {
    const user =
      await this.userModel
        .findById(id)
        .exec();

    if (!user) {
      throw new NotFoundException(
        'Usuario no encontrado',
      );
    }

    const hashedPassword =
      await bcrypt.hash(
        updateUserPasswordDto.password,
        10,
      );

    user.password =
      hashedPassword;

    await user.save();

    const updatedUser =
      await this.userModel
        .findById(id)
        .select('-password')
        .exec();

    if (!updatedUser) {
      throw new NotFoundException(
        'Usuario no encontrado',
      );
    }

    return updatedUser;
  }
}