import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

/** Body sent by apps/web's Auth.js `jwt` callback after it verifies the OIDC id_token itself. */
export class OidcProvisionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  providerName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  providerUserId!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  displayName!: string;
}
