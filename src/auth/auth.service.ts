
import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import {
  InjectModel,
} from '@nestjs/mongoose';

import {
  Model,
} from 'mongoose';

import * as bcrypt from 'bcryptjs';

import {
  randomBytes,
} from 'crypto';

import {
  JwtService,
} from '@nestjs/jwt';

import {
  User,
  UserDocument,
} from '../users/schemas/user.schema.js';

import {
  EmailService,
} from './email.service.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel:
      Model<UserDocument>,

    private readonly jwtService:
      JwtService,

    private readonly emailService:
      EmailService,
  ) {}

  async login(
    email: string,
    password: string,
  ) {
    const normalizedEmail =
      email.toLowerCase().trim();

    const user =
      await this.userModel
        .findOne({
          email: normalizedEmail,
        })
        .exec();

    if (!user) {
      throw new UnauthorizedException(
        'Credenciales inválidas',
      );
    }

    if (user.status === 'INACTIVE') {
      throw new UnauthorizedException(
        'El usuario está inactivo. Contacta al administrador.',
      );
    }

    const passwordIsValid =
      await bcrypt.compare(
        password,
        user.password,
      );

    if (!passwordIsValid) {
      throw new UnauthorizedException(
        'Credenciales inválidas',
      );
    }

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken =
      await this.jwtService.signAsync(
        payload,
      );

    return {
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    };
  }

  async forgotPassword(
    email: string,
  ) {
    const normalizedEmail =
      email.toLowerCase().trim();

    const user =
      await this.userModel
        .findOne({
          email: normalizedEmail,
        })
        .exec();

    if (!user) {
      return {
        message:
          'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.',
      };
    }

    const resetToken =
      randomBytes(32).toString('hex');

    const resetExpires =
      new Date(
        Date.now() +
          15 * 60 * 1000,
      );

    user.passwordResetToken =
      resetToken;

    user.passwordResetExpires =
      resetExpires;

    await user.save();

    const frontendUrl =
      'http://localhost:4200';

    const resetUrl =
      `${frontendUrl}/reset-password?token=${resetToken}`;

    await this.emailService.sendPasswordResetEmail(
      normalizedEmail,
      resetUrl,
    );

    return {
      message:
        'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.',
    };
  }

  async resetPassword(
    token: string,
    password: string,
  ) {
    const user =
      await this.userModel
        .findOne({
          passwordResetToken: token,
          passwordResetExpires: {
            $gt: new Date(),
          },
        })
        .exec();

    if (!user) {
      throw new UnauthorizedException(
        'El enlace de recuperación no es válido o ha expirado.',
      );
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        10,
      );

    user.password =
      hashedPassword;

    user.passwordResetToken =
      null;

    user.passwordResetExpires =
      null;

    await user.save();

    return {
      message:
        'Contraseña restablecida correctamente.',
    };
  }
}
