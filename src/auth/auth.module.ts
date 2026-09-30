import {
  Module,
} from '@nestjs/common';

import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';

import {
  JwtModule,
} from '@nestjs/jwt';

import {
  MongooseModule,
} from '@nestjs/mongoose';

import {
  PassportModule,
} from '@nestjs/passport';

import {
  AuthController,
} from './auth.controller.js';

import {
  AuthService,
} from './auth.service.js';

import {
  EmailService,
} from './email.service.js';

import {
  JwtStrategy,
} from './strategies/jwt.strategy/jwt.strategy.js';

import {
  User,
  UserSchema,
} from '../users/schemas/user.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),

    ConfigModule,

    PassportModule,

    JwtModule.registerAsync({
      imports: [
        ConfigModule,
      ],

      inject: [
        ConfigService,
      ],

      useFactory: (
        configService: ConfigService,
      ) => ({
        secret:
          configService.get<string>(
            'JWT_SECRET',
          ),

        signOptions: {
          expiresIn: '1h',
        },
      }),
    }),
  ],

  controllers: [
    AuthController,
  ],

  providers: [
    AuthService,
    EmailService,
    JwtStrategy,
  ],
})
export class AuthModule {}