import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuditLogService } from './audit-log.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { OidcProvisionController } from './sso/oidc/provision.controller';
import { SamlBridgeService } from './sso/saml/saml-bridge.service';
import { SamlController } from './sso/saml/saml.controller';
import { SamlService } from './sso/saml/saml.service';
import { SsoProvisioningService } from './sso/sso-provisioning.service';
import { SsoStatusController } from './sso/sso-status.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenService } from './token.service';

/**
 * SSO (Phase 10) is wired directly into this module rather than a nested
 * `SsoModule` — `SsoProvisioningService` needs `AuthService`, and a separate
 * module importing `AuthModule` back would cycle. Everything under `sso/` is
 * still one file per concern; see adr/0009.
 */
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
      }),
    }),
  ],
  controllers: [AuthController, SsoStatusController, OidcProvisionController, SamlController],
  providers: [
    AuthService,
    TokenService,
    PasswordService,
    AuditLogService,
    JwtStrategy,
    SsoProvisioningService,
    SamlService,
    SamlBridgeService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
