
import {
  BadRequestException,
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
  promises as fs,
} from 'node:fs';

import * as path from 'node:path';

import {
  randomUUID,
} from 'node:crypto';

import {
  SupplierInvoice,
  SupplierInvoiceDocument,
} from './schemas/supplier-invoice.schema.js';

interface UploadedAttachmentFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class SupplierInvoiceAttachmentService {
  private readonly uploadDirectory = path.resolve(
    process.cwd(),
    'uploads',
    'supplier-invoices',
  );

  constructor(
    @InjectModel(SupplierInvoice.name)
    private readonly supplierInvoiceModel:
      Model<SupplierInvoiceDocument>,
  ) {}

  async saveAttachment(
    invoiceId: string,
    file: UploadedAttachmentFile,
  ) {
    if (!Types.ObjectId.isValid(invoiceId)) {
      throw new BadRequestException(
        'El id de la factura no es válido',
      );
    }

    if (!file || !file.buffer || file.size <= 0) {
      throw new BadRequestException(
        'Debes seleccionar un archivo válido',
      );
    }

    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Solo se permiten archivos PDF, JPG, PNG o WEBP',
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException(
        'El archivo no puede superar los 5 MB',
      );
    }

    const invoice = await this.supplierInvoiceModel
      .findById(invoiceId)
      .exec();

    if (!invoice) {
      throw new NotFoundException(
        'Factura de proveedor no encontrada',
      );
    }

    const extensionByMimeType: Record<string, string> = {
      'application/pdf': '.pdf',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };

    const extension = extensionByMimeType[file.mimetype];

    const storedFileName = `${randomUUID()}${extension}`;

    await fs.mkdir(this.uploadDirectory, {
      recursive: true,
    });

    const filePath = path.join(
      this.uploadDirectory,
      storedFileName,
    );

    await fs.writeFile(filePath, file.buffer, {
      flag: 'wx',
    });

    try {
      invoice.attachment = {
        fileName: path.basename(file.originalname),
        mimeType: file.mimetype,
        fileUrl: `/supplier-invoices/${invoiceId}/attachment`,
        storedFileName,
        fileSize: file.size,
        uploadedAt: new Date(),
      };

      await invoice.save();
    } catch (error) {
      await fs.unlink(filePath).catch(() => undefined);
      throw error;
    }

    return {
      message: 'Soporte adjuntado correctamente',
      attachment: invoice.attachment,
    };
  }

  async getAttachment(invoiceId: string) {
    if (!Types.ObjectId.isValid(invoiceId)) {
      throw new BadRequestException(
        'El id de la factura no es válido',
      );
    }

    const invoice = await this.supplierInvoiceModel
      .findById(invoiceId)
      .exec();

    if (!invoice) {
      throw new NotFoundException(
        'Factura de proveedor no encontrada',
      );
    }

    if (!invoice.attachment) {
      throw new NotFoundException(
        'Esta factura no tiene un soporte adjunto',
      );
    }

    const storedFileName = invoice.attachment.storedFileName;

    if (
      !storedFileName ||
      path.basename(storedFileName) !== storedFileName
    ) {
      throw new NotFoundException(
        'El nombre del archivo almacenado no es válido',
      );
    }

    const filePath = path.join(
      this.uploadDirectory,
      storedFileName,
    );

    try {
      await fs.access(filePath);
    } catch {
      throw new NotFoundException(
        'No se encontró el archivo almacenado',
      );
    }

    return {
      fileName: invoice.attachment.fileName,
      mimeType: invoice.attachment.mimeType,
      fileSize: invoice.attachment.fileSize,
      filePath,
    };
  }
}
