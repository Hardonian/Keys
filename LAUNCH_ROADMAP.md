# Launch Roadmap: Fix, Don't Wander

**Last Updated:** $(date)  
**Focus:** Risk reduction and trust building, not feature expansion

---

## Phase 1: Clarify (Messaging & UX) — WEEK 1

**Why:** Reduce cognitive load, clarify value proposition

**Goal:** User can explain product in one sentence after landing page

**Risk Reduced:** Confusion → Clarity

### Tasks

1. ✅ **Rewrite hero copy** (concrete, not abstract)
   - Status: COMPLETE
   - Changed: "AI cofounder" → "Stop rewriting prompts"
   - Changed: Abstract features → Concrete outcomes

2. ✅ **Add read-only mode indicator**
   - Status: COMPLETE
   - Added: `ReadOnlyBanner` component
   - Added: `CannotDoStatement` component
   - Location: Chat interface

3. ⏳ **Simplify profile** (remove vibe config from first run)
   - Status: PENDING
   - Action: Make profile optional, hide vibe config behind "Advanced"
   - Impact: Faster onboarding, less confusion

4. ⏳ **Hide templates** (behind advanced toggle)
   - Status: PENDING
   - Action: Move templates to separate page, add "Browse Templates" button in chat
   - Impact: Less cognitive load

5. ⏳ **Add "What we don't do" screen**
   - Status: PARTIAL (added to chat interface)
   - Action: Add to onboarding flow
   - Impact: Clear boundaries

### Success Metrics

- ✅ Landing page explains value in one sentence
- ⏳ First run requires no explanation
- ⏳ User can explain product after landing page

---

## Phase 2: Reinforce (Trust & Safety) — WEEK 2

**Why:** Build trust, reduce security concerns

**Goal:** Security reviewer leaves calmer, not more curious

**Risk Reduced:** Trust gap → Trust

### Tasks

1. ✅ **Add security banner** (read-only mode)
   - Status: COMPLETE
   - Added: `ReadOnlyBanner` component

2. ✅ **Document threat model**
   - Status: COMPLETE
   - Created: `SECURITY_AND_TRUST_MODEL.md`
   - Includes: Data read/written, permissions, third-party sharing

3. ⏳ **Add explicit output explanations**
   - Status: PENDING
   - Action: Show what prompt was used, what context was included
   - Impact: Transparency builds trust

4. ✅ **Add "Cannot do" statement**
   - Status: COMPLETE
   - Added: `CannotDoStatement` component

5. ⏳ **Add data handling transparency**
   - Status: PARTIAL (documented, not in UI)
   - Action: Add "Data & Privacy" page
   - Impact: Users understand data handling

### Success Metrics

- ✅ Security documentation exists
- ⏳ Security reviewer can understand threat model in 5 minutes
- ⏳ Users understand what data is read/written

---

## Phase 3: Optimize (Speed & Simplicity) — WEEK 3

**Why:** Reduce time-to-value, increase conversion

**Goal:** First structured output in < 60 seconds

**Risk Reduced:** Friction → Speed

### Tasks

1. ⏳ **Remove profile requirement for first run**
   - Status: PENDING
   - Action: Make profile optional, use defaults
   - Impact: Faster onboarding

2. ⏳ **Add default vibe config** (no setup)
   - Status: PENDING
   - Action: Use defaults (playfulness: 50, revenue focus: 60)
   - Impact: No configuration needed

3. ⏳ **Optimize first output speed** (< 30 seconds)
   - Status: PENDING
   - Action: Optimize prompt assembly, cache defaults
   - Impact: Faster time-to-value

4. ⏳ **Add example outputs on landing page**
   - Status: PENDING
   - Action: Show example RFC, spec, plan
   - Impact: Users see value immediately

5. ⏳ **Simplify onboarding** (skip optional steps)
   - Status: PENDING
   - Action: Make profile optional, skip vibe config
   - Impact: Faster conversion

### Success Metrics

- ⏳ First structured output in < 60 seconds
- ⏳ 50%+ users complete first run without setup
- ⏳ Example outputs visible on landing page

---

## Phase 4: Expand (Only After Traction) — MONTH 2+

**Why:** Only after proving core value

**Goal:** 100+ active users, 10+ paying customers

**Risk Reduced:** Premature expansion → Focused growth

### Tasks (Deferred Until Traction)

1. ⏸️ **Team template sharing**
   - Deferred: Until 100+ active users
   - Why: Need to prove individual value first

2. ⏸️ **GitHub integration** (read-only)
   - Deferred: Until 10+ paying customers request it
   - Why: Not core value prop

3. ⏸️ **Linear/Notion integration**
   - Deferred: Until clear demand
   - Why: Nice-to-have, not must-have

4. ⏸️ **Advanced features**
   - Deferred: Until core value proven
   - Why: Focus on core first

### Success Metrics

- ⏸️ 100+ active users
- ⏸️ 10+ paying customers
- ⏸️ 5%+ conversion rate (free → paid)

---

## Launch Readiness Checklist

### Before Launch (Mandatory)

- [x] Value proposition rewritten (concrete, not abstract)
- [x] Read-only mode indicator added
- [x] Security documentation created
- [x] "Cannot do" statement added
- [ ] Profile simplified (vibe config optional)
- [ ] Templates hidden (behind advanced)
- [ ] Example outputs on landing page
- [ ] Onboarding simplified (skip optional steps)
- [ ] Output explanations added (show prompt used)
- [ ] Data handling transparency (UI)

### Launch Day

- [ ] Product Hunt launch
- [ ] Hacker News post
- [ ] LinkedIn post
- [ ] Twitter/X thread
- [ ] Monitor metrics
- [ ] Respond to feedback

### Post-Launch (First Week)

- [ ] Review error logs daily
- [ ] Monitor usage patterns
- [ ] Gather user feedback
- [ ] Address critical issues immediately
- [ ] Plan improvements based on real usage

---

## Success Criteria

### Phase 1 Complete When:
- ✅ Landing page explains value in one sentence
- ⏳ User can explain product after landing page
- ⏳ First run requires no explanation

### Phase 2 Complete When:
- ✅ Security documentation exists
- ⏳ Security reviewer understands threat model in 5 minutes
- ⏳ Users understand what data is read/written

### Phase 3 Complete When:
- ⏳ First structured output in < 60 seconds
- ⏳ 50%+ users complete first run without setup
- ⏳ Example outputs visible on landing page

### Launch Ready When:
- ✅ All Phase 1-2 tasks complete
- ⏳ All Phase 3 tasks complete
- ⏳ Launch checklist complete

---

## Risks & Mitigations

### Risk: Users Don't Understand Value

**Mitigation:**
- Concrete value prop (not abstract)
- Example outputs on landing page
- Clear ROI calculation

### Risk: Security Concerns Block Adoption

**Mitigation:**
- Explicit threat model
- Read-only mode indicator
- "Cannot do" statement
- Data handling transparency

### Risk: Too Complex to Use

**Mitigation:**
- Simplify profile (optional)
- Hide advanced features
- Default configurations
- Skip optional steps

### Risk: No Traction

**Mitigation:**
- Clear ICP definition
- Focused messaging
- Example outputs
- Free tier with limits

---

## Next Steps

1. **Complete Phase 1 tasks** (simplify profile, hide templates)
2. **Complete Phase 2 tasks** (output explanations, data transparency)
3. **Complete Phase 3 tasks** (optimize speed, add examples)
4. **Launch** (Product Hunt, Hacker News, etc.)
5. **Monitor & Iterate** (based on real usage)

---

*This roadmap is updated as progress is made. Last review: $(date)*
