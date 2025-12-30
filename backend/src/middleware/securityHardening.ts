import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

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
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Note: 'unsafe-eval' needed for some React features
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
 */
export function requestSigningMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    // For sensitive operations (admin actions, billing), verify request signature
    // This would verify a signature header against a shared secret
    const sensitivePaths = ['/admin', '/billing', '/audit'];
    const isSensitive = sensitivePaths.some((path) => req.path.startsWith(path));

    if (isSensitive && req.method !== 'GET') {
      const signature = req.headers['x-request-signature'] as string;
      const timestamp = req.headers['x-request-timestamp'] as string;

      // Verify timestamp (prevent replay attacks)
      if (timestamp) {
        const requestTime = parseInt(timestamp, 10);
        const now = Date.now();
        const maxAge = 5 * 60 * 1000; // 5 minutes

        if (Math.abs(now - requestTime) > maxAge) {
          res.status(401).json({ error: 'Request timestamp expired' });
          return;
        }
      }

      // In production, verify signature against shared secret
      // For now, we'll just check it exists
      if (!signature && process.env.NODE_ENV === 'production') {
        res.status(401).json({ error: 'Request signature required' });
        return;
      }
    }

    next();
  };
}
