# Key Development Checklist

**Template for developing new KEYS**

Use this checklist when developing any new key from the roadmap.

---

## Pre-Development

- [ ] Review `NEW_KEYS_ROADMAP.md` for key context
- [ ] Understand priority level and success criteria
- [ ] Check dependencies (prerequisite keys, tool versions)
- [ ] Review tool documentation and best practices
- [ ] Research existing similar keys for patterns
- [ ] Define key scope and deliverables
- [ ] Estimate development time
- [ ] Set target completion date

---

## Phase 1: Planning (1-2 days)

### Research
- [ ] Review tool-specific documentation
- [ ] Research best practices and patterns
- [ ] Review competitor offerings (if any)
- [ ] Identify common use cases
- [ ] Review user requests/feedback

### Design
- [ ] Design key structure and organization
- [ ] Define asset types (code, templates, notebooks, etc.)
- [ ] Plan testing approach
- [ ] Design documentation structure
- [ ] Plan quickstart guide

### Metadata Planning
- [ ] Define slug (URL-friendly, descriptive)
- [ ] Write title (clear, tool + outcome)
- [ ] Write description (outcome-focused)
- [ ] Select taxonomy:
  - [ ] Tool: `cursor` | `jupyter` | `github` | `stripe` | `supabase` | etc.
  - [ ] Key Type: `prompt` | `notebook` | `workflow` | `template` | `playbook`
  - [ ] Outcome: `automation` | `monetization` | `validation` | `compliance` | etc.
  - [ ] Maturity: `starter` | `operator` | `scale` | `enterprise`
- [ ] Select tags (5-10 relevant tags)
- [ ] Set pricing (based on roadmap)
- [ ] Define version (start with 1.0.0)

---

## Phase 2: Development (varies by complexity)

### Asset Creation
- [ ] Create main assets (code, templates, notebooks, etc.)
- [ ] Ensure production-ready quality
- [ ] Follow tool-specific best practices
- [ ] Include error handling
- [ ] Include logging/monitoring (where applicable)
- [ ] Make assets reusable and customizable

### Testing
- [ ] Write unit tests (where applicable)
- [ ] Write integration tests (where applicable)
- [ ] Test with tool test mode/sandbox
- [ ] Test error scenarios
- [ ] Test edge cases
- [ ] Verify all tests pass

### Documentation
- [ ] Write README.md (comprehensive guide)
- [ ] Write quickstart.md (getting started guide)
- [ ] Include code examples
- [ ] Include configuration examples
- [ ] Document dependencies
- [ ] Document requirements
- [ ] Document limitations
- [ ] Include troubleshooting section

### Metadata Files
- [ ] Create `key.json` or `pack.json` (depending on key type)
- [ ] Fill all required metadata fields
- [ ] Verify metadata schema compliance
- [ ] Include all asset paths
- [ ] Set correct license (SPDX format)

### Preview Content
- [ ] Create HTML preview (if applicable)
- [ ] Create screenshots (if applicable)
- [ ] Create cover image (if applicable)
- [ ] Write preview description

### Changelog
- [ ] Create CHANGELOG.md
- [ ] Document initial version (1.0.0)
- [ ] Include features, fixes, breaking changes

### License
- [ ] Include LICENSE.txt file
- [ ] Use appropriate license (MIT recommended)
- [ ] Include copyright notice

---

## Phase 3: QA (1-2 days)

### Functionality Testing
- [ ] Test all key features
- [ ] Verify tool integration works
- [ ] Test with different configurations
- [ ] Test error handling
- [ ] Verify outputs are correct

### Documentation Review
- [ ] Review README for clarity
- [ ] Review quickstart for accuracy
- [ ] Verify all examples work
- [ ] Check for typos/grammar
- [ ] Verify links work

### Metadata Review
- [ ] Verify metadata is complete
- [ ] Verify taxonomy is correct
- [ ] Verify tags are relevant
- [ ] Verify pricing is correct
- [ ] Verify version is correct

### Code Quality
- [ ] Review code for best practices
- [ ] Check for security issues
- [ ] Verify no hardcoded secrets
- [ ] Check for proper error handling
- [ ] Verify code is well-commented

### Tool-Specific QA

**Stripe Keys:**
- [ ] Test with Stripe test mode
- [ ] Verify webhook signature verification
- [ ] Verify idempotency handling
- [ ] Test error scenarios

**Supabase Keys:**
- [ ] Test with Supabase local/dev
- [ ] Verify RLS policies (where applicable)
- [ ] Test migrations (where applicable)
- [ ] Verify security best practices

**GitHub Keys:**
- [ ] Test with GitHub Actions
- [ ] Verify workflow syntax
- [ ] Test with different repos
- [ ] Verify API usage

**Jupyter Keys:**
- [ ] Test notebook execution
- [ ] Verify all cells run
- [ ] Test with sample data
- [ ] Verify visualizations render

**Cursor Keys:**
- [ ] Test prompt packs
- [ ] Test Composer instructions
- [ ] Verify examples work
- [ ] Test with different projects

---

## Phase 4: Marketplace Integration (1 day)

### Asset Upload
- [ ] Upload all assets to storage
- [ ] Verify asset URLs are correct
- [ ] Test asset downloads
- [ ] Verify file sizes are reasonable

### Marketplace Entry
- [ ] Create marketplace entry
- [ ] Fill all required fields
- [ ] Upload cover image
- [ ] Set preview URL (if applicable)
- [ ] Set download URL
- [ ] Configure metadata

### Discovery Configuration
- [ ] Verify taxonomy is set correctly
- [ ] Verify tags are set correctly
- [ ] Test search functionality
- [ ] Test filter functionality
- [ ] Verify recommendations work

### Pricing Configuration
- [ ] Set price correctly
- [ ] Configure bundle inclusion (if applicable)
- [ ] Verify pricing display
- [ ] Test purchase flow (test mode)

---

## Phase 5: Launch (1 day)

### Pre-Launch
- [ ] Final review of all assets
- [ ] Final review of documentation
- [ ] Final review of metadata
- [ ] Test complete user journey
- [ ] Verify no broken links
- [ ] Verify no console errors

### Launch
- [ ] Mark key as "available" in marketplace
- [ ] Announce new key (if applicable)
- [ ] Update roadmap (mark as complete)
- [ ] Update related documentation
- [ ] Add to bundles (if applicable)
- [ ] Update discovery recommendations (if applicable)

### Post-Launch
- [ ] Monitor initial usage
- [ ] Collect user feedback
- [ ] Track purchase metrics
- [ ] Track rating metrics
- [ ] Address any issues quickly
- [ ] Update roadmap with actual metrics

---

## Success Verification

### Week 1
- [ ] Key is discoverable
- [ ] No critical bugs reported
- [ ] Documentation is clear
- [ ] Initial purchases (if applicable)

### Month 1
- [ ] Purchase rate meets target
- [ ] Rating is 4.5+ stars
- [ ] Active usage within 30 days
- [ ] Positive user feedback
- [ ] Included in bundles (if applicable)

### Ongoing
- [ ] Monitor usage patterns
- [ ] Collect feature requests
- [ ] Plan updates/improvements
- [ ] Update documentation as needed

---

## Key-Specific Checklists

### Stripe Keys Checklist
- [ ] Webhook signature verification implemented
- [ ] Idempotency handling implemented
- [ ] Error handling comprehensive
- [ ] Test mode compatible
- [ ] Webhook event handling correct
- [ ] Payment/subscription logic correct

### Supabase Keys Checklist
- [ ] RLS policies included (where applicable)
- [ ] Migration scripts included (where applicable)
- [ ] Security best practices followed
- [ ] Multi-tenant patterns (where applicable)
- [ ] Auth patterns correct (where applicable)

### GitHub Keys Checklist
- [ ] Workflow syntax valid
- [ ] GitHub Actions compatible
- [ ] API usage correct
- [ ] Error handling implemented
- [ ] Secrets handling correct

### Jupyter Keys Checklist
- [ ] Notebook executes without errors
- [ ] All cells run successfully
- [ ] Visualizations render correctly
- [ ] Sample data included or generated
- [ ] Documentation clear

### Cursor Keys Checklist
- [ ] Prompt packs are clear
- [ ] Composer instructions work
- [ ] Examples are comprehensive
- [ ] Patterns are reusable
- [ ] Documentation is clear

---

## Common Issues to Avoid

- [ ] Don't hardcode secrets or API keys
- [ ] Don't assume tool versions
- [ ] Don't skip error handling
- [ ] Don't forget to test edge cases
- [ ] Don't skip documentation
- [ ] Don't use vague descriptions
- [ ] Don't forget to update roadmap
- [ ] Don't skip QA phase

---

## Template Usage

1. Copy this checklist for each new key
2. Check off items as you complete them
3. Add key-specific items as needed
4. Update roadmap when complete
5. Save completed checklist for reference

---

**Last Updated**: 2024-12-30
