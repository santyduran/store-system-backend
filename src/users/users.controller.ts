import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

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

import {
  UsersService,
} from './users.service.js';

import {
  JwtAuthGuard,
} from '../auth/guards/jwt-auth/jwt-auth.guard.js';

import {
  Roles,
} from '../auth/decorators/roles/roles.decorator.js';

import {
  RolesGuard,
} from '../auth/guards/roles/roles.guard.js';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService:
      UsersService,
  ) {}

  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles('ADMIN')
  @Post()
  create(
    @Body()
    createUserDto: CreateUserDto,
  ) {
    return this.usersService.create(
      createUserDto,
    );
  }

  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles('ADMIN')
  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.usersService.findOne(
      id,
    );
  }

  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles('ADMIN')
  @Put(':id')
  update(
    @Param('id')
    id: string,
    @Body()
    updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(
      id,
      updateUserDto,
    );
  }

  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles('ADMIN')
  @Patch(':id/status')
  updateStatus(
    @Param('id')
    id: string,
    @Body()
    updateUserStatusDto:
      UpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(
      id,
      updateUserStatusDto,
    );
  }

  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles('ADMIN')
  @Patch(':id/password')
  updatePassword(
    @Param('id')
    id: string,
    @Body()
    updateUserPasswordDto:
      UpdateUserPasswordDto,
  ) {
    return this.usersService.updatePassword(
      id,
      updateUserPasswordDto,
    );
  }
}