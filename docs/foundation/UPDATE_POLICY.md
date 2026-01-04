# Update Policy

**Version**: 1.0.0  
**Last Updated**: 2024-12-30  
**Status**: Canonical — Living assets system  
**Purpose**: Define KEYS as living assets that compound value over time

---

## Core Principle

**KEYS are living assets, not static downloads.**

**Updates are expected. Old versions remain accessible. Changelogs are mandatory. Breaking changes are rare and explicit.**

---

## Living Assets Philosophy

### Why Keys Are Living Assets

#### Tool Evolution
- **Tools Change**: Cursor, Jupyter, GitHub, Stripe, etc. evolve
- **Keys Must Adapt**: Keys must adapt to tool changes
- **Updates Required**: Updates keep keys current with tools

#### Pattern Refinement
- **Best Practices Evolve**: Best practices improve over time
- **Patterns Improve**: Patterns get better with experience
- **Updates Incorporate**: Updates incorporate new learnings

#### User Feedback
- **Edge Cases Discovered**: Users discover edge cases
- **Issues Found**: Users find issues and bugs
- **Updates Fix**: Updates fix issues and improve patterns

#### Value Compounding
- **Keys Get Better**: Keys improve with each update
- **Value Increases**: Value increases over time
- **Trust Compounds**: Trust compounds faster than features

---

## Update Types

### Patch Updates (x.y.Z)
**Frequency**: As needed  
**Scope**: Bug fixes, minor improvements  
**Breaking Changes**: None  
**User Impact**: Minimal

**Examples**:
- Fix typo in documentation
- Fix bug in workflow
- Improve error messages
- Update dependencies

### Minor Updates (x.Y.z)
**Frequency**: Monthly  
**Scope**: New features, improvements  
**Breaking Changes**: None  
**User Impact**: Low

**Examples**:
- Add new workflow step
- Add new configuration option
- Improve documentation
- Add new examples

### Major Updates (X.y.z)
**Frequency**: Quarterly  
**Scope**: Significant changes, new capabilities  
**Breaking Changes**: Possible (explicit)  
**User Impact**: Medium to High

**Examples**:
- Add new tool support
- Restructure workflow
- Add new outcome support
- Major pattern changes

---

## Update Rules

### Updates Are Expected
- **Default**: Users expect updates
- **Notification**: Users notified of updates
- **Automatic**: Updates available automatically
- **Opt-in**: Users opt into updates

### Old Versions Remain Accessible
- **Version History**: All versions remain accessible
- **Rollback**: Users can rollback to old versions
- **Archive**: Old versions archived but accessible
- **Support**: Old versions supported for reasonable period

### Changelogs Are Mandatory
- **Required**: All updates require changelogs
- **Detailed**: Changelogs detail all changes
- **Clear**: Changelogs clearly explain changes
- **Accessible**: Changelogs accessible to all users

### Breaking Changes Are Rare and Explicit
- **Rare**: Breaking changes are rare
- **Explicit**: Breaking changes explicitly documented
- **Migration**: Migration guides provided
- **Support**: Support provided for migration

---

## Update Process

### Update Creation
1. **Identify Need**: Identify need for update
2. **Create Update**: Create update with changes
3. **Test Update**: Test update thoroughly
4. **Document Changes**: Document all changes in changelog
5. **Review**: Review update for quality
6. **Publish**: Publish update to marketplace

### Update Notification
1. **Notify Users**: Notify users of available updates
2. **Show Changelog**: Show changelog to users
3. **Highlight Breaking**: Highlight breaking changes
4. **Provide Migration**: Provide migration guides if needed

### Update Application
1. **User Opts In**: User opts into update
2. **Backup Current**: Backup current version
3. **Apply Update**: Apply update
4. **Verify**: Verify update works correctly
5. **Rollback If Needed**: Rollback if issues found

---

## Version History

### Version Format
- **Semantic Versioning**: MAJOR.MINOR.PATCH
- **Examples**: 1.0.0, 1.1.0, 2.0.0
- **Pre-release**: 1.0.0-beta, 1.0.0-rc

### Version Tracking
- **All Versions**: All versions tracked
- **Version Metadata**: Version metadata stored
- **Version Access**: All versions accessible
- **Version Support**: Versions supported for reasonable period

---

## Changelog Requirements

### Required Information
- **Version**: Version number
- **Date**: Release date
- **Changes**: List of all changes
- **Breaking**: Breaking changes (if any)
- **Migration**: Migration guides (if needed)

### Change Categories
- **Added**: New features
- **Changed**: Changes to existing features
- **Deprecated**: Features to be removed
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security updates

### Changelog Format
```markdown
## [Version] - YYYY-MM-DD

### Added
- New feature X
- New configuration option Y

### Changed
- Improved feature Z
- Updated documentation

### Fixed
- Fixed bug A
- Fixed typo B

### Breaking Changes
- Feature C removed (see migration guide)
- Feature D changed (see migration guide)
```

---

## Breaking Changes Policy

### When Breaking Changes Are Allowed
- **Tool Changes**: Tool changes require breaking changes
- **Security**: Security requires breaking changes
- **Major Improvements**: Major improvements justify breaking changes
- **User Request**: User requests justify breaking changes

### Breaking Change Requirements
- **Explicit Documentation**: Breaking changes explicitly documented
- **Migration Guides**: Migration guides provided
- **Deprecation Period**: Deprecation period provided
- **Support**: Support provided for migration

### Breaking Change Process
1. **Announce**: Announce breaking change in advance
2. **Deprecate**: Deprecate old behavior
3. **Provide Migration**: Provide migration guide
4. **Support**: Support users during migration
5. **Release**: Release breaking change

---

## Update Support

### Support Period
- **Current Version**: Full support
- **Previous Major**: Full support for 6 months
- **Previous Minor**: Support for 3 months
- **Previous Patch**: Support for 1 month

### Support Scope
- **Bug Fixes**: Bug fixes for supported versions
- **Security**: Security updates for supported versions
- **Documentation**: Documentation updates for supported versions
- **Migration**: Migration support for breaking changes

---

## User Expectations

### What Users Expect
- **Regular Updates**: Regular updates to keys
- **Bug Fixes**: Bug fixes for issues
- **Improvements**: Improvements to patterns
- **Tool Compatibility**: Compatibility with tool updates

### What Users Don't Expect
- **Breaking Changes**: Breaking changes without notice
- **Removed Features**: Removed features without migration
- **Unsupported Versions**: Unsupported versions immediately
- **Poor Documentation**: Poor changelog documentation

---

## Trust Compounding

### How Updates Build Trust
- **Consistency**: Consistent updates build trust
- **Quality**: Quality updates build trust
- **Transparency**: Transparent changelogs build trust
- **Support**: Support during updates builds trust

### Trust vs. Features
- **Features**: Features provide value
- **Trust**: Trust compounds faster than features
- **Updates**: Updates build trust
- **Value**: Trust increases value

---

## Version History

- **1.0.0** (2024-12-30): Initial update policy documentation
