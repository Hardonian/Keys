import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { profilesRouter } from './routes/profiles.js';
import { vibeConfigsRouter } from './routes/vibe-configs.js';
import { assemblePromptRouter } from './routes/assemble-prompt.js';
import { orchestrateAgentRouter } from './routes/orchestrate-agent.js';
import { feedbackRouter } from './routes/feedback.js';
import { webhooksRouter } from './routes/webhooks.js';
import { adminRouter } from './routes/admin.js';
import { presetsRouter } from './routes/presets.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { optionalAuthMiddleware } from './middleware/auth.js';
import { userRateLimit } from './middleware/rateLimit.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
// Standard JSON parsing for most routes
app.use(express.json());

// For webhooks, we need raw body for signature verification
// This must be registered before the webhooks router
const webhookMiddleware = express.raw({ type: 'application/json' });

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Optional auth for public routes
app.use(optionalAuthMiddleware);

// Rate limiting for API routes
app.use('/api', userRateLimit);

// Routes
app.use('/profiles', profilesRouter);
app.use('/vibe-configs', vibeConfigsRouter);
app.use('/assemble-prompt', assemblePromptRouter);
app.use('/orchestrate-agent', orchestrateAgentRouter);
app.use('/feedback', feedbackRouter);
app.use('/admin', adminRouter);
app.use('/presets', presetsRouter);
// Webhooks with raw body middleware
app.use('/webhooks', webhookMiddleware, webhooksRouter);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Webhook endpoints:`);
  console.log(`  POST /webhooks/shopify - Shopify webhooks`);
  console.log(`  POST /webhooks/supabase - Supabase webhooks`);
});
