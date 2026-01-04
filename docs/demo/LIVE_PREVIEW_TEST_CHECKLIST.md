# Live Preview Module - Test Checklist

Use this checklist to verify the live preview module works flawlessly for unauthenticated users.

## Pre-Test Setup

- [ ] Clear browser cache or use incognito mode
- [ ] Ensure no authentication cookies exist
- [ ] Open browser console to monitor errors
- [ ] Open network tab to verify no unnecessary API calls

---

## Test Flow 1: Homepage → Marketplace → Key Detail

### Step 1: Homepage
- [ ] Page loads without errors
- [ ] Logo animates smoothly
- [ ] Hero text displays correctly
- [ ] "Browse Keys" button visible
- [ ] "Try Demo" button visible and prominent
- [ ] No console errors

### Step 2: Click "Try Demo" or "Browse Keys"
- [ ] Redirects to `/marketplace`
- [ ] Page loads within 1 second
- [ ] Demo mode banner appears at top
- [ ] 6 demo keys displayed in grid
- [ ] "Recommended for You" section visible (even without auth)
- [ ] No console errors
- [ ] No API errors in network tab

### Step 3: Browse Marketplace
- [ ] All 6 demo keys visible:
  - [ ] Cursor Keys: Authentication Scaffolding
  - [ ] Jupyter Keys: Data Analysis Basics
  - [ ] Runbook Keys: Stripe Webhook Failure Recovery
  - [ ] Node.js Keys: REST API Scaffold
  - [ ] Next.js Keys: Dashboard Scaffold
  - [ ] Runbook Keys: Database Migration Recovery
- [ ] Each key shows:
  - [ ] Title
  - [ ] Description
  - [ ] Key type badge
  - [ ] Category badge
  - [ ] Difficulty badge (if applicable)
  - [ ] Version and license info

### Step 4: Click on a Demo Key
- [ ] Navigates to `/marketplace/[slug]`
- [ ] Key detail page loads
- [ ] All key information displays:
  - [ ] Title
  - [ ] Description
  - [ ] Tags
  - [ ] Category
  - [ ] Difficulty
  - [ ] Maturity
  - [ ] Version
  - [ ] License
  - [ ] Outcome
  - [ ] Price
- [ ] Demo preview banner visible in sidebar
- [ ] "Sign In to Unlock" button visible
- [ ] Related Keys section shows 3 related keys
- [ ] No console errors

### Step 5: Click Related Key
- [ ] Navigates to related key detail page
- [ ] New key loads correctly
- [ ] Related keys update
- [ ] Browser back button works

### Step 6: Navigate Back
- [ ] Browser back button returns to marketplace
- [ ] Marketplace state preserved (filters, scroll position)
- [ ] Demo keys still visible

---

## Test Flow 2: Filtering and Search

### Step 1: Filter by Key Type
- [ ] Select "jupyter" → Shows 1 key ✅
- [ ] Select "node" → Shows 2 keys ✅
- [ ] Select "next" → Shows 1 key ✅
- [ ] Select "runbook" → Shows 2 keys ✅
- [ ] Select "All Types" → Shows all 6 keys ✅

### Step 2: Filter by Category
- [ ] Select "Authentication" → Shows 1 key ✅
- [ ] Select "Data Science" → Shows 1 key ✅
- [ ] Select "Operations" → Shows 2 keys ✅
- [ ] Select "All Categories" → Shows all 6 keys ✅

### Step 3: Search
- [ ] Search "authentication" → Shows 1 key ✅
- [ ] Search "data" → Shows 1 key ✅
- [ ] Search "stripe" → Shows 1 key ✅
- [ ] Search "xyz" → Shows empty state ✅
- [ ] Clear search → Shows all keys ✅

### Step 4: Combined Filters
- [ ] Filter by "node" + search "api" → Shows 1 key ✅
- [ ] Filter by "runbook" + category "Operations" → Shows 2 keys ✅
- [ ] Clear all filters → Shows all keys ✅

---

## Test Flow 3: Empty States

### Step 1: No Results
- [ ] Apply filters that return 0 results
- [ ] Empty state displays:
  - [ ] Icon (🔍)
  - [ ] "No keys found" heading
  - [ ] Helpful message
  - [ ] "Clear filters" button
  - [ ] Signup CTA (if in demo mode)

### Step 2: Clear Filters
- [ ] Click "Clear filters" button
- [ ] All filters reset
- [ ] All demo keys visible again

---

## Test Flow 4: Error Handling

### Step 1: Invalid Key Slug
- [ ] Navigate to `/marketplace/non-existent-key`
- [ ] Error state displays:
  - [ ] Icon (🔍)
  - [ ] "KEY not found" heading
  - [ ] Helpful error message
  - [ ] "Try Again" button
  - [ ] "Browse Marketplace" button

### Step 2: Recovery
- [ ] Click "Browse Marketplace"
- [ ] Returns to marketplace
- [ ] All demo keys visible

---

## Test Flow 5: Recommendations

### Step 1: View Recommendations
- [ ] Load marketplace
- [ ] "Recommended for You" section visible
- [ ] Shows 3 recommendations:
  - [ ] Cursor Keys: Authentication Scaffolding (high confidence)
  - [ ] Jupyter Keys: Data Analysis Basics (high confidence)
  - [ ] Runbook Keys: Stripe Webhook Failure Recovery (medium confidence)

### Step 2: Recommendation Details
- [ ] Each recommendation shows:
  - [ ] Title
  - [ ] Description
  - [ ] Reason (why recommended)
  - [ ] Confidence badge (high/medium/low)

### Step 3: Click Recommendation
- [ ] Click on a recommendation
- [ ] Navigates to key detail page
- [ ] Key loads correctly
- [ ] Analytics tracked (if implemented)

---

## Test Flow 6: Sign Up CTAs

### Step 1: Marketplace Banner
- [ ] Demo mode banner visible
- [ ] "Sign up" link clickable
- [ ] Clicking redirects to `/signup`

### Step 2: Key Detail Banner
- [ ] Demo preview banner visible
- [ ] "Sign up to unlock" link clickable
- [ ] Clicking redirects to `/signup`

### Step 3: Sign In Button
- [ ] "Sign In to Unlock" button visible
- [ ] Clicking redirects to `/signin?returnUrl=/marketplace/[slug]`
- [ ] Return URL encoded correctly

---

## Test Flow 7: Navigation

### Step 1: Browser Navigation
- [ ] Back button works
- [ ] Forward button works
- [ ] Browser history correct

### Step 2: Refresh
- [ ] Refresh on marketplace → Still shows demo keys ✅
- [ ] Refresh on key detail → Still shows demo key ✅
- [ ] State preserved correctly

### Step 3: Direct Navigation
- [ ] Direct URL to `/marketplace` → Loads demo keys ✅
- [ ] Direct URL to `/marketplace/[slug]` → Loads demo key ✅
- [ ] Invalid slug → Shows error state ✅

### Step 4: Multiple Tabs
- [ ] Open marketplace in tab 1
- [ ] Open key detail in tab 2
- [ ] Both tabs work independently
- [ ] No state conflicts

---

## Test Flow 8: Responsive Design

### Mobile (375px)
- [ ] Marketplace layout stacks correctly
- [ ] Key cards full width
- [ ] Filters stack vertically
- [ ] Demo banners readable
- [ ] Key detail page scrollable
- [ ] All buttons accessible

### Tablet (768px)
- [ ] Marketplace shows 2 columns
- [ ] Key cards sized appropriately
- [ ] Filters horizontal
- [ ] Key detail sidebar below content

### Desktop (1920px)
- [ ] Marketplace shows 3 columns
- [ ] Key cards sized appropriately
- [ ] Key detail sidebar on right
- [ ] All spacing correct

---

## Test Flow 9: Performance

### Step 1: Load Times
- [ ] Marketplace loads < 500ms ✅
- [ ] Key detail loads < 300ms ✅
- [ ] No unnecessary API calls ✅
- [ ] Demo data loads instantly ✅

### Step 2: Interactions
- [ ] Filter changes instant ✅
- [ ] Search results instant ✅
- [ ] Navigation smooth ✅
- [ ] No lag or jank ✅

---

## Test Flow 10: Accessibility

### Step 1: Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Focus indicators visible
- [ ] Enter/Space activate buttons
- [ ] Escape closes modals (if any)

### Step 2: Screen Reader
- [ ] Demo mode announced
- [ ] Key information announced
- [ ] Buttons have labels
- [ ] Links have descriptive text

### Step 3: ARIA Labels
- [ ] All buttons have aria-labels
- [ ] All links have aria-labels
- [ ] Form inputs have labels
- [ ] Error states have role="alert"

---

## Edge Cases

### Edge Case 1: Rapid Navigation
- [ ] Quickly click through multiple keys
- [ ] No race conditions
- [ ] Correct key loads each time

### Edge Case 2: Network Failure Simulation
- [ ] Disable network
- [ ] Navigate to marketplace
- [ ] Demo data still loads (client-side)
- [ ] No errors

### Edge Case 3: Slow Network
- [ ] Throttle to "Slow 3G"
- [ ] Marketplace loads demo data quickly
- [ ] No loading spinners for demo data

### Edge Case 4: Special Characters in Search
- [ ] Search with special characters: `!@#$%^&*()`
- [ ] No errors
- [ ] Filters correctly

### Edge Case 5: Very Long Search Query
- [ ] Search with 100+ character string
- [ ] No performance issues
- [ ] Filters correctly

---

## Final Verification

- [ ] All test flows pass
- [ ] No console errors
- [ ] No network errors
- [ ] All features work
- [ ] Performance acceptable
- [ ] Accessibility compliant
- [ ] Responsive design works
- [ ] Error handling robust

---

## Sign-Off

**Tester:** _________________  
**Date:** _________________  
**Status:** ✅ PASS / ❌ FAIL

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## Known Issues

_List any issues found during testing:_

1. 
2. 
3. 

---

**Last Updated:** [Current Date]
