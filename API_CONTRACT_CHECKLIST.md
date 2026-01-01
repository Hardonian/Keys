# API Contract Checklist

**Purpose**: Validate frontend↔backend API shape, auth requirements, and error behaviors.

**Last Updated**: 2024-12-19

---

## Authentication Requirements

### All Protected Routes Require Auth

✅ **Verified**: All user-facing routes use `authMiddleware`:
- `/profiles/*` - ✅ `authMiddleware` applied
- `/vibe-configs/*` - ✅ `authMiddleware` applied
- `/assemble-prompt` - ✅ `authMiddleware` applied
- `/orchestrate-agent` - ✅ `authMiddleware` applied
- `/user-templates/*` - ✅ `authMiddleware` applied
- `/billing/*` (except webhook) - ✅ `authMiddleware` applied
- `/input-filters/*` - ✅ `authMiddleware` applied
- `/export/*` - ✅ `authMiddleware` applied
- `/admin/*` - ✅ `authMiddleware` applied
- `/ide/*` - ✅ `authMiddleware` applied
- `/cicd/*` - ✅ `authMiddleware` applied
- `/metrics/*` - ✅ `authMiddleware` applied
- `/apm/*` - ✅ `authMiddleware` applied
- `/audit/*` - ✅ `authMiddleware` applied

### Auth Header Format

✅ **Standard**: `Authorization: Bearer <jwt_token>`
- Frontend: `frontend/src/services/api.ts:28` - Adds token from Supabase session
- Backend: `backend/src/middleware/auth.ts:27-40` - Extracts and validates token

### Auth Error Response

✅ **Standard Format**:
```json
{
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Missing or invalid authorization header"
  },
  "requestId": "req_..."
}
```
- Status Code: `401`
- Consistent across all routes

---

## Error Response Format

### Standard Error Structure

✅ **All errors return**:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly message",
    "context": { ... }  // Optional, only in dev mode
  },
  "requestId": "req_..."
}
```

### Error Codes

✅ **Defined in** `backend/src/types/errors.ts`:
- `VALIDATION_ERROR` (400) - Invalid input
- `AUTHENTICATION_ERROR` (401) - Auth required
- `AUTHORIZATION_ERROR` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `RATE_LIMIT_ERROR` (429) - Rate limit exceeded
- `EXTERNAL_API_ERROR` (502) - External service error
- `INTERNAL_ERROR` (500) - Server error
- `DATABASE_ERROR` (500) - Database error
- `SUBSCRIPTION_REQUIRED` (403) - Active subscription needed
- `PREMIUM_REQUIRED` (403) - Premium features needed

### No Hard-500 Guarantee

✅ **Verified**:
- All routes wrapped in `asyncHandler` (catches async errors)
- Global error handler (`backend/src/middleware/errorHandler.ts`) returns structured JSON
- 404 handler returns JSON (`notFoundHandler`)
- Validation errors return 400 with details
- Unknown routes return 404 JSON (not HTML)

---

## API Endpoint Contracts

### Auth Routes (`/auth`)

#### POST `/auth/signup`
- **Auth**: None (public)
- **Rate Limit**: `authRateLimiter`
- **Request Body**:
  ```typescript
  {
    email: string;      // email format
    password: string;   // min 8 chars
    name?: string;     // optional
  }
  ```
- **Response** (201):
  ```typescript
  {
    user: {
      id: string;
      email: string;
    };
    session: Session;  // Supabase session
  }
  ```
- **Errors**: `AUTHENTICATION_ERROR` (400) if signup fails

#### POST `/auth/signin`
- **Auth**: None (public)
- **Rate Limit**: `authRateLimiter`
- **Request Body**:
  ```typescript
  {
    email: string;
    password: string;
  }
  ```
- **Response** (200):
  ```typescript
  {
    user: {
      id: string;
      email: string;
    };
    session: Session;
  }
  ```
- **Errors**: `AUTHENTICATION_ERROR` (401) if invalid credentials

#### POST `/auth/signout`
- **Auth**: Optional (token in header)
- **Response** (200): `{ message: "Signed out successfully" }`

#### GET `/auth/me`
- **Auth**: Required (token in header)
- **Response** (200):
  ```typescript
  {
    user: {
      id: string;
      email: string;
      metadata: Record<string, any>;
    };
  }
  ```
- **Errors**: `AUTHENTICATION_ERROR` (401) if no token or invalid

---

### Profile Routes (`/profiles`)

#### GET `/profiles/:userId`
- **Auth**: Required
- **Ownership**: Users can only access own profile (unless admin)
- **Response** (200): `UserProfile` object
- **Errors**: 
  - `AUTHORIZATION_ERROR` (403) if accessing other user's profile
  - `NOT_FOUND` (404) if profile doesn't exist

#### POST `/profiles`
- **Auth**: Required
- **Request Body**: `createProfileSchema` (Zod validated)
- **Response** (201): Created `UserProfile`
- **Note**: `user_id` from body ignored, uses authenticated user ID

#### PATCH `/profiles/:userId`
- **Auth**: Required
- **Ownership**: Users can only update own profile (unless admin)
- **Request Body**: `updateProfileSchema` (Zod validated)
- **Response** (200): Updated `UserProfile`
- **Errors**: `AUTHORIZATION_ERROR` (403) if updating other user's profile

#### GET `/profiles` (List)
- **Auth**: Required (admin only)
- **Query Params**: `page`, `limit` (pagination)
- **Response** (200): Paginated response
- **Errors**: `AUTHORIZATION_ERROR` (403) if not admin

---

### Vibe Config Routes (`/vibe-configs`)

#### GET `/vibe-configs/:userId`
- **Auth**: Required
- **Ownership**: Users can only access own config (unless admin)
- **Response** (200): `VibeConfig` object (creates default if not found)
- **Errors**: `AUTHORIZATION_ERROR` (403) if accessing other user's config

#### POST `/vibe-configs`
- **Auth**: Required
- **Request Body**: `createVibeConfigSchema` (Zod validated)
- **Response** (201): Created `VibeConfig`
- **Note**: `user_id` from body ignored, uses authenticated user ID

#### PATCH `/vibe-configs/:userId`
- **Auth**: Required
- **Ownership**: Users can only update own config (unless admin)
- **Request Body**: `updateVibeConfigSchema` (Zod validated)
- **Response** (200): Updated `VibeConfig`
- **Errors**: `AUTHORIZATION_ERROR` (403) if updating other user's config

---

### Prompt Assembly (`/assemble-prompt`)

#### POST `/assemble-prompt`
- **Auth**: Required
- **Usage Check**: Checks `runs` limit (0 usage, just checking)
- **Request Body**:
  ```typescript
  {
    taskDescription: string;        // min 1 char
    vibeConfig?: {
      playfulness?: number;         // 0-100
      revenue_focus?: number;        // 0-100
      investor_perspective?: number; // 0-100
    };
    inputFilter?: {
      model?: string;
      provider?: 'openai' | 'anthropic' | 'google' | 'meta' | 'custom';
      style?: 'concise' | 'detailed' | 'technical' | 'conversational' | 'structured' | 'prompt_engineering' | 'chain_of_thought' | 'few_shot';
      outputFormat?: 'markdown' | 'json' | 'code' | 'plain_text' | 'structured_prompt' | 'provider_native';
      tone?: 'playful' | 'serious' | 'technical' | 'casual' | 'balanced';
      maxTokens?: number;
      temperature?: number;         // 0-2
      useProviderGuidelines?: boolean;
      usePromptEngineering?: boolean;
    };
  }
  ```
- **Response** (200): `PromptAssemblyResult`
  ```typescript
  {
    systemPrompt: string;
    userPrompt: string;
    selectedAtomIds?: string[];
    context?: Record<string, any>;
  }
  ```
- **Errors**: 
  - `VALIDATION_ERROR` (400) if invalid input
  - `RATE_LIMIT_ERROR` (429) if usage limit exceeded

---

### Agent Orchestration (`/orchestrate-agent`)

#### POST `/orchestrate-agent`
- **Auth**: Required
- **Entitlements**: `entitlementsMiddleware({ checkUsageLimit: true })`
- **Usage Check**: Checks `runs` limit (1 usage)
- **Request Body**:
  ```typescript
  {
    assembledPrompt: {
      systemPrompt: string;         // min 1 char
      userPrompt?: string;
      selectedAtomIds?: string[];  // UUIDs
      context?: Record<string, any>;
    };
    taskIntent?: string;
    naturalLanguageInput: string;   // min 1, max 10000 chars
  }
  ```
- **Response** (200): `AgentOutput`
  ```typescript
  {
    outputType: 'content_generation' | 'agent_scaffold' | 'workflow_recommendation' | 'code_snippet' | 'data_insight';
    content: string | Record<string, any>;
    requiresApproval: boolean;
    editableFields?: string[];
    generatedAt: string;            // ISO timestamp
    modelUsed: string;
    tokensUsed: number;
    costUsd: number;
    warnings?: Array<{
      type: string;
      message: string;
      suggestion?: string;
    }>;
  }
  ```
- **Errors**: 
  - `VALIDATION_ERROR` (400) if invalid input or safety check fails
  - `RATE_LIMIT_ERROR` (429) if usage limit exceeded
  - `SUBSCRIPTION_REQUIRED` (403) if subscription required but inactive

---

### Template Routes (`/user-templates`)

#### GET `/user-templates/milestone/:milestone`
- **Auth**: Required
- **Response** (200):
  ```typescript
  {
    milestone: string;
    templates: TemplatePreview[];
    count: number;
  }
  ```

#### GET `/user-templates/:templateId/preview`
- **Auth**: Required
- **Response** (200): `TemplatePreview`
  ```typescript
  {
    templateId: string;
    milestone: string;
    name: string;
    description: string;
    basePrompt: string;
    customizedPrompt?: string;
    hasCustomization: boolean;
    customVariables?: Record<string, any>;
    customInstructions?: string;
  }
  ```

#### POST `/user-templates/:templateId/customize`
- **Auth**: Required
- **Request Body**:
  ```typescript
  {
    customVariables?: Record<string, any>;
    customInstructions?: string;
  }
  ```
- **Response** (200):
  ```typescript
  {
    customization: Customization;
    preview: TemplatePreview;
  }
  ```

#### PATCH `/user-templates/:templateId/customize`
- **Auth**: Required
- **Request Body**:
  ```typescript
  {
    customVariables?: Record<string, any>;
    customInstructions?: string;
    enabled?: boolean;
  }
  ```
- **Response** (200): Same as POST

#### DELETE `/user-templates/:templateId/customize`
- **Auth**: Required
- **Response** (200):
  ```typescript
  {
    message: string;
    preview: TemplatePreview;
  }
  ```

#### POST `/user-templates/:templateId/generate`
- **Auth**: Required
- **Request Body**:
  ```typescript
  {
    taskDescription: string;        // min 1 char
    inputFilter?: {
      style?: string;
      outputFormat?: string;
      tone?: string;
    };
  }
  ```
- **Response** (200):
  ```typescript
  {
    prompt: string;
    isCustomized: boolean;
    templateId: string;
    message: string;
  }
  ```

---

### Billing Routes (`/billing`)

#### POST `/billing/checkout`
- **Auth**: Required
- **Request Body**:
  ```typescript
  {
    priceId: string;               // Stripe price ID
    successUrl: string;             // URL format
    cancelUrl: string;              // URL format
  }
  ```
- **Response** (200):
  ```typescript
  {
    sessionId: string;
    url: string;                    // Stripe checkout URL
  }
  ```
- **Errors**: 
  - `503` if Stripe not configured
  - `VALIDATION_ERROR` (400) if invalid input

#### GET `/billing/portal`
- **Auth**: Required
- **Query Params**: `returnUrl?: string`
- **Response** (200):
  ```typescript
  {
    url: string;                    // Stripe portal URL
  }
  ```
- **Errors**: `503` if Stripe not configured

#### POST `/billing/webhook`
- **Auth**: None (webhook signature verification)
- **Middleware**: `express.raw()` for signature verification
- **Request Body**: Raw Buffer (Stripe webhook event)
- **Headers**: `stripe-signature` (required)
- **Response** (200): `{ received: true }`
- **Errors**: 
  - `400` if invalid signature
  - `500` if webhook secret not configured
  - `503` if Stripe not configured

---

## Frontend API Client Contract

### Base Configuration

✅ **File**: `frontend/src/services/api.ts`
- Base URL: `process.env.NEXT_PUBLIC_API_BASE_URL` (default: `http://localhost:3001`)
- Headers: `Content-Type: application/json`
- Auth: Token added via request interceptor from Supabase session

### Request Interceptor

✅ **Adds Auth Token**:
```typescript
api.interceptors.request.use(async (config) => {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});
```

### Response Interceptor

✅ **Error Handling**:
- 403 + `SUBSCRIPTION_REQUIRED` → Shows upgrade toast + redirect
- 403 + `PREMIUM_REQUIRED` → Shows upgrade toast
- 429 → Shows rate limit toast
- Other errors → Shows error toast with message
- Network errors → Shows "Network error" toast
- All errors tracked to Sentry (if configured)

---

## Validation Contracts

### Zod Schemas

✅ **All request bodies validated**:
- `createProfileSchema` - Profile creation
- `updateProfileSchema` - Profile updates
- `createVibeConfigSchema` - Vibe config creation
- `updateVibeConfigSchema` - Vibe config updates
- `assemblePromptSchema` - Prompt assembly
- `orchestrateAgentSchema` - Agent orchestration
- `createCheckoutSessionSchema` - Stripe checkout
- Custom schemas for each route

### Validation Errors

✅ **Format**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "context": {
      "field": "email",
      "message": "Invalid email format"
    }
  },
  "requestId": "req_..."
}
```
- Status Code: `400`

---

## Rate Limiting

### Rate Limit Configuration

✅ **File**: `backend/src/middleware/rateLimit.ts`
- API routes: `apiRateLimiter` (configurable window/max requests)
- Auth routes: `authRateLimiter` (stricter limits)
- User-specific: `userRateLimiterMiddleware` (per-user limits)

### Rate Limit Response

✅ **Format**:
```json
{
  "error": {
    "code": "RATE_LIMIT_ERROR",
    "message": "Rate limit exceeded",
    "context": {
      "retryAfter": 60
    }
  },
  "requestId": "req_..."
}
```
- Status Code: `429`
- Header: `Retry-After: <seconds>`

---

## CORS Configuration

✅ **File**: `backend/src/middleware/security.ts:corsMiddleware()`
- Origins: `process.env.CORS_ORIGINS` (comma-separated)
- Default: `http://localhost:3000,http://localhost:3001`
- Credentials: Allowed
- Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS
- Headers: Content-Type, Authorization, X-Request-ID

---

## Request ID Tracking

✅ **All requests include**:
- Header: `X-Request-ID` (auto-generated if not provided)
- Response: `requestId` field in all responses
- Logging: Request ID included in all log entries

---

## Summary

✅ **Auth**: All protected routes require `Authorization: Bearer <token>`
✅ **Errors**: Structured JSON format, no hard-500s
✅ **Validation**: Zod schemas for all request bodies
✅ **Ownership**: Users can only access own resources (unless admin)
✅ **Rate Limiting**: Configured and enforced
✅ **CORS**: Properly configured
✅ **Request Tracking**: Request IDs in all responses

**Contract Parity**: ✅ Frontend API client matches backend endpoints
**Error Consistency**: ✅ All errors follow standard format
**Auth Enforcement**: ✅ All user endpoints require auth
