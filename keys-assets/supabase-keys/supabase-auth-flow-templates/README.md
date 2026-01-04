# Supabase Keys: Auth Flow Templates

**Version**: 1.0.0  
**Tool**: Supabase  
**Maturity**: Starter  
**Outcome**: Compliance

---

## What This Key Unlocks

Authentication flow templates for Supabase. This key unlocks:

- **Sign Up Flow**: User registration with email verification
- **Sign In Flow**: User authentication
- **Password Reset Flow**: Password reset with email link
- **Email Verification**: Email confirmation handling
- **Social Auth Integration**: OAuth provider setup

---

## Installation

1. **Copy templates** to your project:
   ```bash
   cp -r frontend/* /path/to/your/frontend/components/auth/
   cp migrations/*.sql /path/to/supabase/migrations/
   ```

2. **Set up Supabase**:
   - Create a Supabase project
   - Configure email templates in Supabase Dashboard
   - Set up OAuth providers (if using social auth)

---

## Usage

### Sign Up

```typescript
import { SignUpForm } from './components/auth/signup';

// Use in your app
<SignUpForm />
```

### Sign In

```typescript
import { SignInForm } from './components/auth/signin';

// Use in your app
<SignInForm />
```

### Password Reset

```typescript
import { PasswordResetForm } from './components/auth/password-reset';

// Use in your app
<PasswordResetForm />
```

### Backend Setup

Run the migration in Supabase SQL Editor:

```sql
-- Copy and paste migrations/001_auth_setup.sql
```

---

## Included Templates

### Frontend Components
- `signup.tsx` - Sign up form component
- `signin.tsx` - Sign in form component
- `password-reset.tsx` - Password reset form component

### Backend Migrations
- `001_auth_setup.sql` - User profiles table and RLS policies

---

## Customization

Customize templates for your needs:

- **Styling**: Add your CSS/styling framework
- **Validation**: Add client-side validation
- **Error Handling**: Customize error messages
- **Redirects**: Update redirect URLs

---

## Requirements

- Supabase project
- React/Next.js frontend
- `@supabase/supabase-js` package

---

## License

MIT
