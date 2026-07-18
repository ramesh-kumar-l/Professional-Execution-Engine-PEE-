import * as Joi from 'joi';

/**
 * Fails loudly at boot instead of confusingly mid-request — e.g. a missing
 * DATABASE_URL used to surface as a Prisma connection error on the first
 * request that happened to touch the database, not at startup.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3001),
  DATABASE_URL: Joi.string().uri({ scheme: ['postgresql', 'postgres'] }).required(),

  JWT_ACCESS_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_TTL: Joi.string().default('15m'),
  JWT_REFRESH_TTL: Joi.string().default('7d'),

  AI_PROVIDER: Joi.string().valid('anthropic', 'openai').default('anthropic'),
  ANTHROPIC_API_KEY: Joi.string().when('AI_PROVIDER', { is: 'anthropic', then: Joi.required(), otherwise: Joi.optional() }),
  ANTHROPIC_MODEL: Joi.string().default('claude-sonnet-5'),
  OPENAI_API_KEY: Joi.string().when('AI_PROVIDER', { is: 'openai', then: Joi.required(), otherwise: Joi.optional() }),
  OPENAI_MODEL: Joi.string().default('gpt-4o-mini'),

  // SSO (Phase 10) is additive and feature-flagged off by default — every var below is
  // optional, but if SSO_SAML_ENTRY_POINT is set, the rest of the SAML config must be too,
  // since a partially-configured SAML provider is worse than a cleanly-disabled one.
  SSO_INTERNAL_SECRET: Joi.string().optional(),
  SSO_OIDC_ISSUER_URL: Joi.string().uri().optional(),
  SSO_OIDC_CLIENT_ID: Joi.string().optional(),
  SSO_OIDC_CLIENT_SECRET: Joi.string().optional(),
  SSO_SAML_ENTRY_POINT: Joi.string().uri().optional(),
  SSO_SAML_ISSUER: Joi.string().when('SSO_SAML_ENTRY_POINT', { is: Joi.exist(), then: Joi.required(), otherwise: Joi.optional() }),
  SSO_SAML_IDP_CERT: Joi.string().when('SSO_SAML_ENTRY_POINT', { is: Joi.exist(), then: Joi.required(), otherwise: Joi.optional() }),
  SSO_SAML_CALLBACK_URL: Joi.string().uri().when('SSO_SAML_ENTRY_POINT', { is: Joi.exist(), then: Joi.required(), otherwise: Joi.optional() }),
  SSO_SAML_CLIENT_ID: Joi.string().optional(),
  SSO_SAML_BRIDGE_SECRET: Joi.string().when('SSO_SAML_ENTRY_POINT', { is: Joi.exist(), then: Joi.required(), otherwise: Joi.optional() }),
  SSO_SAML_ALLOWED_REDIRECT_ORIGIN: Joi.string().optional(),
}).unknown(true);
