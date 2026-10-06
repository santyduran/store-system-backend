import {
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
    const normalizedEmail =
      createUserDto.email.toLowerCase().trim();

    const existingUser =
      await this.userModel
        .findOne({
          email: normalizedEmail,
        })
        .exec();

    if (existingUser) {
      throw new ConflictException(
        'El correo electrónico ya está registrado.',
      );
    }

    const hashedPassword =
      await bcrypt.hash(
        createUserDto.password,
        10,
      );

    return this.userModel.create({
      ...createUserDto,
      email: normalizedEmail,
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
  ): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(
        'Usuario no encontrado',
      );
    }

    const user =
      await this.userModel
        .findById(id)
        .select('-password')
        .exec();

    if (!user) {
      throw new NotFoundException(
        'Usuario no encontrado',
      );
    }

    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(
        'Usuario no encontrado',
      );
    }

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
        updateUserDto.name.trim();
    }

    if (updateUserDto.email !== undefined) {
      const normalizedEmail =
        updateUserDto.email
          .toLowerCase()
          .trim();

      const existingUser =
        await this.userModel
          .findOne({
            email: normalizedEmail,
            _id: {
              $ne: user._id,
            },
          })
          .exec();

      if (existingUser) {
        throw new ConflictException(
          'El correo electrónico ya está registrado.',
        );
      }

      user.email =
        normalizedEmail;
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
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(
        'Usuario no encontrado',
      );
    }

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
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(
        'Usuario no encontrado',
      );
    }

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