import {
  Module,
} from '@nestjs/common';

import {
  MongooseModule,
} from '@nestjs/mongoose';

import {
  CreditNotesController,
} from './credit-notes.controller.js';

import {
  CreditNotesService,
} from './credit-notes.service.js';

import {
  CreditNote,
  CreditNoteSchema,
} from './schemas/credit-note.schema.js';

import {
  CreditNoteItem,
  CreditNoteItemSchema,
} from './schemas/credit-note-item.schema.js';

import {
  Invoice,
  InvoiceSchema,
} from '../invoicing/schemas/invoice.schema.js';

import {
  InvoiceItem,
  InvoiceItemSchema,
} from '../invoicing/schemas/invoice-item.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: CreditNote.name,
        schema: CreditNoteSchema,
      },
      {
        name: CreditNoteItem.name,
        schema: CreditNoteItemSchema,
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
    CreditNotesController,
  ],
  providers: [
    CreditNotesService,
  ],
  exports: [
    CreditNotesService,
  ],
})
export class CreditNotesModule {}