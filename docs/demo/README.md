# KEYS Live Demo Documentation

This directory contains all documentation related to live demos and reality-mode testing of KEYS.

## Quick Start

Before your first live demo:

1. **Read:** [`REALITY_ENV.md`](./REALITY_ENV.md) - Set up your environment
2. **Run:** [`LIVE_DEMO_CHECKLIST.md`](./LIVE_DEMO_CHECKLIST.md) - Complete checklist
3. **Review:** [`REALITY_AUDIT_REPORT.md`](./REALITY_AUDIT_REPORT.md) - See what was tested

## Files

- **`REALITY_ENV.md`** - Environment setup and verification checklist
- **`LIVE_DEMO_CHECKLIST.md`** - Step-by-step demo checklist (use before every demo)
- **`REALITY_AUDIT_REPORT.md`** - Complete audit report with fixes applied

## Key Principles

1. **No alert() dialogs** - All errors use toast notifications
2. **No blank screens** - All error states have recovery options
3. **Immediate feedback** - Purchase completions handled automatically
4. **Consistent terminology** - KEYS (product), KEY (singular), Keyring (metaphor)
5. **Clear positioning** - "KEYS is not an AI tool" - it's the keyring to modern tools

## Demo Flow

1. **First Impression** (10 seconds) - Homepage hero/subhead
2. **Unguided Exploration** - Browse marketplace, click around
3. **Discovery** - See recommendations (if authenticated)
4. **Purchase** - Unlock a KEY, complete Stripe checkout
5. **Post-Purchase** - Verify entitlement, download asset
6. **Failure Modes** - Test error handling gracefully

## Status

✅ **READY TO DEMO TO STRANGERS: YES**

All critical issues have been fixed. The product passes reality-mode testing.
