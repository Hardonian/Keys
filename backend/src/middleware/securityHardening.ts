import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import crypto from 'crypto';

/**
 * Enhanced security headers middleware
 */
export function securityHeadersMiddleware() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        scriptSrc: [
          "'self'",
          // 'unsafe-inline' needed for Next.js inline scripts (hydration)
          // 'unsafe-eval' needed for Next.js development mode and some React features
          // TODO: Implement nonce-based CSP to remove unsafe-inline/unsafe-eval
          "'unsafe-inline'",
          ...(process.env.NODE_ENV === 'development' ? ["'unsafe-eval'"] : []),
        ],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", process.env.SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_URL || ''],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  });
}

/**
 * Request signing middleware for sensitive operations
 * Note: Stripe webhooks use their own signature verification, so /billing/webhook is excluded
 */
export function requestSigningMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip signature verification for Stripe webhooks (they have their own)
    if (req.path === '/billing/webhook') {
      next();
      return;
    }

    // For sensitive operations (admin actions, billing), verify request signature
    const sensitivePaths = ['/admin', '/billing', '/audit'];
    const isSensitive = sensitivePaths.some((path) => req.path.startsWith(path));

    if (isSensitive && req.method !== 'GET') {
      const signature = req.headers['x-request-signature'] as string;
      const timestamp = req.headers['x-request-timestamp'] as string;
      const signingSecret = process.env.REQUEST_SIGNING_SECRET;

      // In production with signing secret configured, require signature + timestamp
      if (process.env.NODE_ENV === 'production' && signingSecret) {
        if (!signature) {
          res.status(401).json({ error: 'Request signature required' });
          return;
        }

        if (!timestamp) {
          res.status(401).json({ error: 'Request timestamp required' });
          return;
        }

        // Verify timestamp (prevent replay attacks)
        const requestTime = parseInt(timestamp, 10);
        const now = Date.now();
        const maxAge = 5 * 60 * 1000; // 5 minutes

        if (isNaN(requestTime) || Math.abs(now - requestTime) > maxAge) {
          res.status(401).json({ error: 'Request timestamp expired or invalid' });
          return;
        }

        // Verify signature against shared secret
        const bodyString = typeof req.body === 'string'  
          ? req.body 
          : JSON.stringify(req.body || {});
        const expectedSignature = crypto
          .createHmac('sha256', signingSecret)
          .update(`${timestamp}:${bodyString}`)
          .digest('hex');
        
        if (signature !== expectedSignature) {
          res.status(401).json({ error: 'Invalid request signature' });
          return;
        }
      }
      // In development or when secret not configured, allow without signature
    }

    next();
  };
}
