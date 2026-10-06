import {
  Module,
} from '@nestjs/common';

import {
  MongooseModule,
} from '@nestjs/mongoose';

import {
  DebitNote,
  DebitNoteSchema,
} from './schemas/debit-note.schema.js';

import {
  DebitNoteItem,
  DebitNoteItemSchema,
} from './schemas/debit-note-item.schema.js';

import {
  Invoice,
  InvoiceSchema,
} from '../invoicing/schemas/invoice.schema.js';

import {
  InvoiceItem,
  InvoiceItemSchema,
} from '../invoicing/schemas/invoice-item.schema.js';

import {
  DebitNotesService,
} from './debit-notes.service.js';

import {
  DebitNotesController,
} from './debit-notes.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: DebitNote.name,
        schema: DebitNoteSchema,
      },
      {
        name: DebitNoteItem.name,
        schema: DebitNoteItemSchema,
      },
      {
        name: Invoice.name,
        schema: InvoiceSchema,
      },
      {
        name: InvoiceItem.name,
        schema: InvoiceItemSchema,
      },
    ]),
  ],
  controllers: [
    DebitNotesController,
  ],
  providers: [
    DebitNotesService,
  ],
  exports: [
    DebitNotesService,
  ],
})
export class DebitNotesModule {}