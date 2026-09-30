import {
  Injectable,
} from '@nestjs/common';

import {
  ConfigService,
} from '@nestjs/config';

import {
  createTransport,
  Transporter,
} from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly transporter:
    Transporter;

  constructor(
    private readonly configService:
      ConfigService,
  ) {
    this.transporter =
      createTransport({
        host:
          this.configService.get<string>(
            'SMTP_HOST',
          ),

        port:
          this.configService.get<number>(
            'SMTP_PORT',
          ),

        secure:
          this.configService.get<string>(
            'SMTP_SECURE',
          ) === 'true',

        auth: {
          user:
            this.configService.get<string>(
              'SMTP_USER',
            ),

          pass:
            this.configService.get<string>(
              'SMTP_PASSWORD',
            ),
        },
      });
  }

  async sendPasswordResetEmail(
    email: string,
    resetUrl: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from:
        this.configService.get<string>(
          'SMTP_FROM',
        ),

      to: email,

      subject:
        'Recuperación de contraseña - Store System',

      html: `
        <div
          style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 32px;
            color: #333333;
          "
        >
          <h1
            style="
              margin-bottom: 8px;
              font-size: 28px;
            "
          >
            STORE SYSTEM
          </h1>

          <h2
            style="
              margin-bottom: 16px;
              font-size: 22px;
            "
          >
            Recuperación de contraseña
          </h2>

          <p>
            Hemos recibido una solicitud para
            restablecer la contraseña de tu cuenta.
          </p>

          <p>
            Haz clic en el siguiente botón para
            crear una nueva contraseña:
          </p>

          <div
            style="
              margin: 32px 0;
              text-align: center;
            "
          >
            <a
              href="${resetUrl}"
              style="
                display: inline-block;
                padding: 14px 24px;
                background: #222222;
                color: #ffffff;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
              "
            >
              Restablecer contraseña
            </a>
          </div>

          <p>
            Este enlace será válido durante
            15 minutos.
          </p>

          <p>
            Si tú no solicitaste este cambio,
            puedes ignorar este correo.
          </p>

          <p
            style="
              margin-top: 32px;
              color: #666666;
              font-size: 13px;
            "
          >
            Este es un mensaje automático de
            Store System. Por favor, no respondas
            a este correo.
          </p>
        </div>
      `,
    });
  }
}