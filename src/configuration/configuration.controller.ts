import {
  Body,
  Controller,
  Get,
  Put,
  UseGuards,
} from '@nestjs/common';

import { ConfigurationService } from './configuration.service.js';

import { UpdateConfigurationDto } from './dto/update-configuration.dto.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';
import { Roles } from '../auth/decorators/roles/roles.decorator.js';
import { RolesGuard } from '../auth/guards/roles/roles.guard.js';

@Controller('configuration')
export class ConfigurationController {
  constructor(
    private readonly configurationService: ConfigurationService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getConfiguration() {
    return this.configurationService.getConfiguration();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Put()
  updateConfiguration(
    @Body() updateConfigurationDto: UpdateConfigurationDto,
  ) {
    return this.configurationService.updateConfiguration(
      updateConfigurationDto,
    );
  }
}