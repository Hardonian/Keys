/**
 * Template Adaptation Utilities
 * 
 * Adapts templates based on:
 * - Tech stack variations
 * - Framework-specific implementations
 * - Configuration preferences
 */

/**
 * Adapt template content for specific tech stack
 * @param {string} templateContent - Original template content
 * @param {Object} config - Adaptation configuration
 * @param {string} config.framework - Framework (express, fastify, nextjs, etc.)
 * @param {string} config.database - Database (postgresql, mongodb, supabase, etc.)
 * @param {string} config.authMethod - Auth method (jwt, oauth, session)
 * @param {Object} config.variables - Variable substitutions
 * @returns {string} Adapted template content
 */
export function adaptTemplate(templateContent, config = {}) {
  const {
    framework = 'express',
    database = 'postgresql',
    authMethod = 'jwt',
    variables = {},
  } = config;

  let adapted = templateContent;

  // Framework-specific adaptations
  adapted = adaptFramework(adapted, framework);
  
  // Database-specific adaptations
  adapted = adaptDatabase(adapted, database);
  
  // Auth method adaptations
  adapted = adaptAuthMethod(adapted, authMethod);
  
  // Variable substitutions
  adapted = substituteVariables(adapted, variables);

  return adapted;
}

/**
 * Adapt content for specific framework
 */
function adaptFramework(content, framework) {
  const adaptations = {
    express: {
      '{{import_framework}}': "import express from 'express';",
      '{{create_app}}': 'const app = express();',
      '{{use_middleware}}': 'app.use',
      '{{route_method}}': 'app.{{method}}',
      '{{export_app}}': 'export default app;',
    },
    fastify: {
      '{{import_framework}}': "import Fastify from 'fastify';",
      '{{create_app}}': 'const app = Fastify();',
      '{{use_middleware}}': 'app.register',
      '{{route_method}}': 'app.{{method}}',
      '{{export_app}}': 'export default app;',
    },
    nextjs: {
      '{{import_framework}}': "import { NextRequest, NextResponse } from 'next/server';",
      '{{create_app}}': '',
      '{{use_middleware}}': 'export function middleware',
      '{{route_method}}': 'export async function {{method}}',
      '{{export_app}}': '',
    },
  };

  const frameworkAdaptations = adaptations[framework] || adaptations.express;
  
  let adapted = content;
  for (const [placeholder, replacement] of Object.entries(frameworkAdaptations)) {
    adapted = adapted.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), replacement);
  }

  return adapted;
}

/**
 * Adapt content for specific database
 */
function adaptDatabase(content, database) {
  const adaptations = {
    postgresql: {
      '{{db_client}}': 'pg',
      '{{db_import}}': "import { Pool } from 'pg';",
      '{{db_create_client}}': 'const pool = new Pool({ connectionString: process.env.DATABASE_URL });',
      '{{db_query}}': 'await pool.query',
    },
    supabase: {
      '{{db_client}}': 'supabase',
      '{{db_import}}': "import { createClient } from '@supabase/supabase-js';",
      '{{db_create_client}}': "const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);",
      '{{db_query}}': 'await supabase.from',
    },
    mongodb: {
      '{{db_client}}': 'mongodb',
      '{{db_import}}': "import { MongoClient } from 'mongodb';",
      '{{db_create_client}}': "const client = new MongoClient(process.env.MONGODB_URI!);",
      '{{db_query}}': 'await collection',
    },
  };

  const dbAdaptations = adaptations[database] || adaptations.postgresql;
  
  let adapted = content;
  for (const [placeholder, replacement] of Object.entries(dbAdaptations)) {
    adapted = adapted.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), replacement);
  }

  return adapted;
}

/**
 * Adapt content for auth method
 */
function adaptAuthMethod(content, authMethod) {
  const adaptations = {
    jwt: {
      '{{auth_import}}': "import jwt from 'jsonwebtoken';",
      '{{auth_verify}}': 'jwt.verify(token, process.env.JWT_SECRET!)',
      '{{auth_sign}}': 'jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "{{expires}}" })',
    },
    oauth: {
      '{{auth_import}}': "import { OAuth2Client } from 'google-auth-library';",
      '{{auth_verify}}': 'await oauth2Client.verifyIdToken({ idToken: token })',
      '{{auth_sign}}': '// OAuth tokens are issued by provider',
    },
    session: {
      '{{auth_import}}': "import session from 'express-session';",
      '{{auth_verify}}': 'req.session.userId',
      '{{auth_sign}}': 'req.session.userId = userId',
    },
  };

  const authAdaptations = adaptations[authMethod] || adaptations.jwt;
  
  let adapted = content;
  for (const [placeholder, replacement] of Object.entries(authAdaptations)) {
    adapted = adapted.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), replacement);
  }

  return adapted;
}

/**
 * Substitute variables in template
 */
function substituteVariables(content, variables) {
  let substituted = content;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    substituted = substituted.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
  }

  return substituted;
}

/**
 * Generate template with all adaptations applied
 * @param {Object} template - Template object
 * @param {Object} config - Adaptation configuration
 * @returns {Object} Adapted template
 */
export function generateAdaptedTemplate(template, config) {
  const adaptedContent = adaptTemplate(template.content, config);
  
  return {
    ...template,
    content: adaptedContent,
    adapted: true,
    adaptationConfig: config,
  };
}
