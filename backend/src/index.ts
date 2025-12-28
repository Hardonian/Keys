import express from 'express';
import dotenv from 'dotenv';
import { profilesRouter } from './routes/profiles.js';
import { vibeConfigsRouter } from './routes/vibe-configs.js';
import { assemblePromptRouter } from './routes/assemble-prompt.js';
import { orchestrateAgentRouter } from './routes/orchestrate-agent.js';
import { feedbackRouter } from './routes/feedback.js';
import { webhooksRouter } from './routes/webhooks.js';
import { adminRouter } from './routes/admin.js';
import { presetsRouter } from './routes/presets.js';
import { authRouter } from './routes/auth.js';
import { inputFiltersRouter } from './routes/input-filters.js';
import { scaffoldTemplatesRouter } from './routes/scaffold-templates.js';
import { userTemplatesRouter } from './routes/user-templates.js';
import { enhancedUserTemplatesRouter } from './routes/enhanced-user-templates.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { optionalAuthMiddleware, authMiddleware } from './middleware/auth.js';
import { userRateLimiterMiddleware, apiRateLimiter } from './middleware/rateLimit.js';
import {
  securityMiddleware,
  requestIdMiddleware,
  corsMiddleware,
  requestLoggingMiddleware,
} from './middleware/security.js';
import { initSentry } from './integrations/sentry.js';
import { initRedis } from './cache/redis.js';
import { logger } from './utils/logger';
import { createServer } from 'http';
import { WebSocketServer } from './websocket/server.js';

dotenv.config();

// Validate environment variables
import { validateEnv } from './utils/env.js';
validateEnv();

// Initialize Sentry before anything else
initSentry();

// Initialize Redis
initRedis();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Security middleware (must be first)
app.use(securityMiddleware());

// Request ID middleware
app.use(requestIdMiddleware);

// CORS middleware
app.use(corsMiddleware());

// Request logging
app.use(requestLoggingMiddleware);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check (no auth, no rate limit)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Optional auth for public routes
app.use(optionalAuthMiddleware);

// Rate limiting for API routes
app.use('/api', apiRateLimiter);
app.use('/api', userRateLimiterMiddleware);

// Public routes
app.use('/auth', authRouter);

// Protected routes (optional auth)
app.use('/profiles', profilesRouter);
app.use('/vibe-configs', vibeConfigsRouter);
app.use('/assemble-prompt', assemblePromptRouter);
app.use('/orchestrate-agent', orchestrateAgentRouter);
app.use('/feedback', feedbackRouter);
app.use('/presets', presetsRouter);

// Input filters (require auth)
app.use('/input-filters', inputFiltersRouter);

// Scaffold templates (require auth) - Internal/admin use
app.use('/scaffold-templates', scaffoldTemplatesRouter);

// User templates (require auth) - User-facing customization API
app.use('/user-templates', userTemplatesRouter);

// Enhanced user templates (require auth) - Advanced features
app.use('/user-templates', enhancedUserTemplatesRouter);

// Admin routes (require auth)
app.use('/admin', authMiddleware, adminRouter);

// Webhooks with raw body middleware
const webhookMiddleware = express.raw({ type: 'application/json' });
app.use('/webhooks', webhookMiddleware, webhooksRouter);

// Initialize WebSocket server
const wsServer = new WebSocketServer();
wsServer.initialize(server);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

server.listen(PORT, () => {
  logger.info('Backend server started', {
    port: PORT,
    environment: process.env.NODE_ENV,
    webhookEndpoints: [
      'POST /webhooks/code-repo - Code repository webhooks (GitHub/GitLab/Bitbucket)',
      'POST /webhooks/supabase - Supabase webhooks',
    ],
  });
});
