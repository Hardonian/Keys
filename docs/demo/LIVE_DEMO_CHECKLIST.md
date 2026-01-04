# LIVE DEMO CHECKLIST

## Pre-Demo Setup (5 minutes before)

### Environment
- [ ] Preview/deployment URL is accessible
- [ ] Backend API is responding (`/health` endpoint)
- [ ] Stripe is in test mode (verify test mode banner appears)
- [ ] Test user account exists and is logged in
- [ ] Browser cache cleared (or use incognito)

### Test Data
- [ ] At least 3-5 Keys visible in marketplace
- [ ] Mix of key types (jupyter, node, runbook)
- [ ] At least one Key has preview available
- [ ] Test user has 0-1 entitlements (to show purchase flow)

### Browser Setup
- [ ] Window size appropriate (1920x1080 or similar)
- [ ] Browser console open (to catch any errors)
- [ ] Network tab open (to verify API calls)
- [ ] Zoom level at 100%

---

## PART I — FIRST IMPRESSION (10-SECOND TEST)

**Action:** Land on homepage, read hero + subhead only, do not scroll.

**Pass Criteria:**
- [ ] Can answer "What is this?" → "KEYS - marketplace of keys to unlock tools"
- [ ] Can answer "Who is it for?" → "Developers, founders, data practitioners"
- [ ] Can answer "Why does it matter?" → "Unlocks practical capability in tools you already own"

**If FAIL:**
- [ ] Note exact copy causing confusion
- [ ] Fix hero/subhead immediately

---

## PART II — UNGUIDED EXPLORATION

**Actions:**
1. [ ] Browse marketplace unauthenticated
2. [ ] Open random Key pages (click 2-3 different Keys)
3. [ ] Attempt locked download (should redirect to signin)
4. [ ] Use back/forward browser buttons
5. [ ] Refresh page
6. [ ] Open same Key page in two tabs

**Pass Criteria:**
- [ ] No dead ends (every page has clear navigation)
- [ ] Locked states show clear message: "🔒 KEY locked" with "Unlock KEY" button
- [ ] CTAs always explain next step ("Unlock KEY for $X", "Download KEY", "Browse Marketplace")
- [ ] No jargon leaks (no "entitlement", "pack", "asset" in user-facing text)
- [ ] Navigation works smoothly (back/forward/refresh)
- [ ] Multi-tab doesn't break state

**If FAIL:**
- [ ] Document exact issue
- [ ] Fix navigation or copy immediately

---

## PART III — DISCOVERY IN A LIVE DEMO

**Action:** Sign in, start discovery flow.

**Pass Criteria:**
- [ ] Discovery recommendations appear (if authenticated)
- [ ] Each recommendation shows:
  - [ ] Title
  - [ ] Description
  - [ ] **Reason** (why this Key is recommended)
  - [ ] Confidence level (high/medium/low)
- [ ] Recommendations feel helpful, not forced
- [ ] "Why this Key" is always visible (reason text)
- [ ] Recommendations feel obvious in hindsight

**Narration Test:**
- [ ] Can say "Let's find the right Key for this situation" and recommendations appear
- [ ] Can explain each recommendation without reading code/complex logic
- [ ] No need to say "ignore this, it's just a demo"

**If FAIL:**
- [ ] If narration required to justify recommendation → product failed
- [ ] Fix recommendation logic or UI

---

## PART IV — PURCHASE & ENTITLEMENT REALITY

**Actions:**
1. [ ] Attempt locked download → redirects to signin (if not signed in)
2. [ ] Sign in → return to Key page
3. [ ] Click "Unlock KEY for $X"
4. [ ] Complete Stripe checkout (use test card: 4242 4242 4242 4242)
5. [ ] Return to marketplace
6. [ ] Verify Key shows "✓ KEY unlocked"
7. [ ] Download asset
8. [ ] View Keyring (My Keys page)

**Pass Criteria:**
- [ ] No awkward pauses (loading states visible)
- [ ] Clear loading states ("Preparing download...", "Redirecting to checkout...")
- [ ] Entitlement appears immediately after purchase (no manual refresh)
- [ ] Ownership is visually obvious ("✓ KEY unlocked" badge)
- [ ] Download button becomes available immediately
- [ ] Keyring shows purchased Key
- [ ] Toast notifications appear (success/error)

**Timing:**
- [ ] Purchase → entitlement visible: < 3 seconds
- [ ] Download starts: < 2 seconds

**If FAIL:**
- [ ] Check webhook processing
- [ ] Verify Stripe return URL
- [ ] Check browser console for errors

---

## PART V — POST-PURCHASE CONFIDENCE

**Actions:**
1. [ ] Open account dashboard
2. [ ] Review Keyring (My Keys page)
3. [ ] Re-open purchased Key
4. [ ] View version / update policy

**Pass Criteria:**
- [ ] Ownership is unambiguous ("✓ KEY unlocked" everywhere)
- [ ] Value is visible (can see what was purchased)
- [ ] Update expectations are clear (version info visible)
- [ ] No anxiety about access loss (perpetual access messaging)
- [ ] Can re-download anytime

**If FAIL:**
- [ ] Add clearer ownership indicators
- [ ] Add update policy messaging

---

## PART VI — FAILURE & RECOVERY (DEMO KILLERS)

**Intentionally simulate failures:**

### Test 1: Network Latency
- [ ] Throttle network to "Slow 3G"
- [ ] Navigate marketplace
- [ ] Attempt purchase

**Pass:** Loading states visible, no blank screens, clear messaging

### Test 2: API Failure
- [ ] Temporarily disable backend
- [ ] Attempt to load marketplace
- [ ] Attempt to load Key page

**Pass:** 
- [ ] Error message is calm and helpful
- [ ] "Try Again" button available
- [ ] No stack traces visible
- [ ] No blank screens

### Test 3: Stripe Webhook Delay
- [ ] Complete purchase
- [ ] Simulate webhook delay (don't process immediately)
- [ ] Return to Key page

**Pass:**
- [ ] Shows "Processing purchase..." or similar
- [ ] Eventually updates (within 10 seconds)
- [ ] Clear explanation of what's happening

### Test 4: Asset Missing
- [ ] Attempt download of Key with missing asset

**Pass:**
- [ ] Error message: "Asset temporarily unavailable"
- [ ] Suggests retry or contact support
- [ ] No 500 error

### Test 5: Discovery Returns No Result
- [ ] Use discovery with filters that return 0 results

**Pass:**
- [ ] Shows "No keys found. Try adjusting your filters."
- [ ] Suggests clearing filters
- [ ] No blank state

**If FAIL:**
- [ ] Fix error handling immediately
- [ ] Add user-friendly error messages
- [ ] Ensure no stack traces leak

---

## PART VII — SALES NARRATION ALIGNMENT

**Simulate narrating while clicking:**

**Validate:**
- [ ] On-screen language matches sales story
  - [ ] "KEYS" not "Keys" (capitalized)
  - [ ] "KEY" not "key" (singular, capitalized)
  - [ ] "Keyring" only used in metaphor context
- [ ] KEYS vs KEYRING distinction never blurs
  - [ ] Product is "KEYS"
  - [ ] Collection is "My Keys" or "Keyring"
- [ ] No "magic", "auto-pilot", or hype claims appear
- [ ] UI does not contradict sales proof pack
  - [ ] No "AI tool" language
  - [ ] No "replaces tools" messaging
  - [ ] Clear "unlocks tools" messaging

**Narration Test:**
- [ ] Can say "KEYS is the keyring to modern tools" and UI supports it
- [ ] Can say "You already have the tools, here are the keys" and it's clear
- [ ] No need to work around UI contradictions

**If FAIL:**
- [ ] Fix UI copy to match positioning
- [ ] Remove contradictory language

---

## PART VIII — TIME-TO-VALUE

**Measure:**
- [ ] Landing → understanding: < 10 seconds
- [ ] Discovery → correct Key: < 2 minutes
- [ ] Purchase → usable asset: < 5 minutes

**Pass Criteria:**
- [ ] Each step takes minutes, not explanations
- [ ] No unnecessary friction
- [ ] Clear next steps always visible

**If FAIL:**
- [ ] Identify friction points
- [ ] Simplify flow

---

## PART IX — DEMO-SAFE POLISH

**Check:**
- [ ] Empty states are intentional-looking (not broken)
- [ ] Loading states are smooth (not jarring)
- [ ] Animations are subtle (not distracting)
- [ ] Colors are consistent (no random color choices)
- [ ] Typography is readable (not too small/large)

**If FAIL:**
- [ ] Polish empty states
- [ ] Improve loading animations
- [ ] Fix color/typography inconsistencies

---

## FINAL VERDICT

After completing all parts:

**Ready to demo to strangers: YES / NO**

**If NO, blockers:**
1. [ ] Issue 1: [description]
2. [ ] Issue 2: [description]
3. [ ] Issue 3: [description]

**If YES:**
- [ ] All parts passed
- [ ] No critical issues found
- [ ] Ready for live demo

---

## Post-Demo Notes

**What worked well:**
- [ ] 

**What needs improvement:**
- [ ] 

**Unexpected issues:**
- [ ] 

**Follow-up actions:**
- [ ] 
