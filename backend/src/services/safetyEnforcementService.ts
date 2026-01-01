/**
 * Safety Enforcement Service
 * 
 * Core defensive moat: Automatic security/compliance/quality checking.
 * Transfers risk from user to Keys by guaranteeing outputs meet standards.
 */

import { logger } from '../utils/logger.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SafetyCheckResult {
  passed: boolean;
  blocked: boolean;
  warnings: SafetyWarning[];
  checks: {
    security: SecurityCheckResult;
    compliance: ComplianceCheckResult;
    quality: QualityCheckResult;
  };
}

export interface SafetyWarning {
  type: 'security' | 'compliance' | 'quality';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  pattern?: string;
  suggestion?: string;
}

export interface SecurityCheckResult {
  passed: boolean;
  vulnerabilities: SecurityVulnerability[];
  score: number; // 0-100
}

export interface SecurityVulnerability {
  type: 'sql_injection' | 'xss' | 'csrf' | 'auth_bypass' | 'secret_exposure' | 'insecure_dependency' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  pattern: string;
  line?: number;
  description: string;
  fix: string;
}

export interface ComplianceCheckResult {
  passed: boolean;
  violations: ComplianceViolation[];
  standards: {
    gdpr: boolean;
    soc2: boolean;
    hipaa: boolean;
  };
}

export interface ComplianceViolation {
  standard: 'gdpr' | 'soc2' | 'hipaa';
  violation: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  fix: string;
}

export interface QualityCheckResult {
  passed: boolean;
  issues: QualityIssue[];
  score: number; // 0-100
}

export interface QualityIssue {
  type: 'code_smell' | 'anti_pattern' | 'best_practice' | 'performance' | 'maintainability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  pattern: string;
  description: string;
  suggestion: string;
}

export class SafetyEnforcementService {
  /**
   * Perform comprehensive safety checks on output
   */
  async checkOutput(
    output: string,
    context?: {
      outputType?: string;
      templateId?: string;
      userId?: string;
    }
  ): Promise<SafetyCheckResult> {
    const securityCheck = await this.checkSecurity(output, context);
    const complianceCheck = await this.checkCompliance(output, context);
    const qualityCheck = await this.checkQuality(output, context);

    const warnings: SafetyWarning[] = [];

    // Collect warnings from all checks
    securityCheck.vulnerabilities.forEach(vuln => {
      warnings.push({
        type: 'security',
        severity: vuln.severity,
        message: vuln.description,
        pattern: vuln.pattern,
        suggestion: vuln.fix,
      });
    });

    complianceCheck.violations.forEach(violation => {
      warnings.push({
        type: 'compliance',
        severity: violation.severity,
        message: violation.description,
        suggestion: violation.fix,
      });
    });

    qualityCheck.issues.forEach(issue => {
      warnings.push({
        type: 'quality',
        severity: issue.severity,
        message: issue.description,
        pattern: issue.pattern,
        suggestion: issue.suggestion,
      });
    });

    // Block if critical security or compliance issues
    const blocked = warnings.some(w => 
      w.severity === 'critical' && 
      (w.type === 'security' || w.type === 'compliance')
    );

    // Pass if no critical issues and all checks passed
    const passed = !blocked && securityCheck.passed && complianceCheck.passed && qualityCheck.passed;

    // Track guarantee metrics if user provided
    if (context?.userId) {
      await this.trackGuaranteeMetrics(context.userId, {
        security: securityCheck,
        compliance: complianceCheck,
        quality: qualityCheck,
        blocked,
        passed,
      });
    }

    return {
      passed,
      blocked,
      warnings,
      checks: {
        security: securityCheck,
        compliance: complianceCheck,
        quality: qualityCheck,
      },
    };
  }

  /**
   * Track guarantee metrics for billing and analytics
   */
  private async trackGuaranteeMetrics(
    userId: string,
    results: {
      security: SecurityCheckResult;
      compliance: ComplianceCheckResult;
      quality: QualityCheckResult;
      blocked: boolean;
      passed: boolean;
    }
  ): Promise<void> {
    try {
      // Get user's tier and guarantee coverage
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_tier, guarantee_coverage, prevented_failures_count')
        .eq('user_id', userId)
        .single();

      if (!profile) return;

      const tier = profile.subscription_tier || 'free';
      const guaranteeCoverage = profile.guarantee_coverage || [];

      // Only track for Pro, Pro+, and Enterprise tiers
      if (!['pro', 'pro+', 'enterprise'].includes(tier)) return;

      // Count prevented failures (blocked outputs)
      if (results.blocked) {
        const preventedCount = (profile.prevented_failures_count || 0) + 1;
        
        await supabase
          .from('user_profiles')
          .update({ prevented_failures_count: preventedCount })
          .eq('user_id', userId);
      }

      // Track guarantee coverage usage
      const guaranteeUsage: Record<string, number> = {};
      
      if (guaranteeCoverage.includes('security')) {
        guaranteeUsage.security_checks = (guaranteeUsage.security_checks || 0) + 1;
        guaranteeUsage.security_vulnerabilities_found = results.security.vulnerabilities.length;
        guaranteeUsage.security_vulnerabilities_blocked = results.security.vulnerabilities.filter(
          v => v.severity === 'critical'
        ).length;
      }

      if (guaranteeCoverage.includes('compliance')) {
        guaranteeUsage.compliance_checks = (guaranteeUsage.compliance_checks || 0) + 1;
        guaranteeUsage.compliance_violations_found = results.compliance.violations.length;
        guaranteeUsage.compliance_violations_blocked = results.compliance.violations.filter(
          v => v.severity === 'critical'
        ).length;
      }

      if (guaranteeCoverage.includes('quality')) {
        guaranteeUsage.quality_checks = (guaranteeUsage.quality_checks || 0) + 1;
        guaranteeUsage.quality_issues_found = results.quality.issues.length;
        guaranteeUsage.quality_score = results.quality.score;
      }

      // Store guarantee metrics (could be in a separate table for analytics)
      // For now, we'll log them for tracking
      logger.info('Guarantee metrics tracked', {
        userId,
        tier,
        guaranteeCoverage,
        preventedFailures: profile.prevented_failures_count,
        guaranteeUsage,
      });
    } catch (error) {
      logger.error('Failed to track guarantee metrics', error instanceof Error ? error : new Error(String(error)), { userId });
    }
  }

  /**
   * Security scanning
   */
  private async checkSecurity(
    output: string,
    context?: Record<string, any>
  ): Promise<SecurityCheckResult> {
    const vulnerabilities: SecurityVulnerability[] = [];

    // SQL Injection patterns
    const sqlInjectionPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b[^;]*;)/gi,
      /(\b(UNION|OR|AND)\s+\d+\s*=\s*\d+)/gi,
      /('|"|`).*(\bor\b|\band\b).*\1/gi,
      /(\$\{[^}]+\})/g, // Template injection
    ];

    sqlInjectionPatterns.forEach(pattern => {
      const matches = output.match(pattern);
      if (matches) {
        matches.forEach(match => {
          vulnerabilities.push({
            type: 'sql_injection',
            severity: 'critical',
            pattern: match,
            description: `Potential SQL injection detected: ${match.substring(0, 50)}`,
            fix: 'Use parameterized queries or prepared statements. Never concatenate user input into SQL queries.',
          });
        });
      }
    });

    // XSS patterns
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=\s*["'][^"']*["']/gi, // Event handlers
      /<iframe[^>]*>/gi,
    ];

    xssPatterns.forEach(pattern => {
      const matches = output.match(pattern);
      if (matches) {
        matches.forEach(match => {
          vulnerabilities.push({
            type: 'xss',
            severity: 'high',
            pattern: match,
            description: `Potential XSS vulnerability detected: ${match.substring(0, 50)}`,
            fix: 'Sanitize user input and use Content Security Policy (CSP). Escape HTML entities.',
          });
        });
      }
    });

    // Secret exposure patterns
    const secretPatterns = [
      /(api[_-]?key|secret|password|token|credential)\s*[=:]\s*["']?([a-zA-Z0-9]{20,})["']?/gi,
      /(BEGIN\s+(RSA\s+)?PRIVATE\s+KEY|-----BEGIN)/gi,
      /(aws[_-]?access[_-]?key[_-]?id|aws[_-]?secret[_-]?access[_-]?key)/gi,
      /(ghp_[a-zA-Z0-9]{36}|gho_[a-zA-Z0-9]{36})/g, // GitHub tokens
    ];

    secretPatterns.forEach(pattern => {
      const matches = output.match(pattern);
      if (matches) {
        matches.forEach(match => {
          vulnerabilities.push({
            type: 'secret_exposure',
            severity: 'critical',
            pattern: match.substring(0, 50) + '...',
            description: 'Potential secret/credential exposure detected',
            fix: 'Never hardcode secrets. Use environment variables or secret management systems.',
          });
        });
      }
    });

    // Auth bypass patterns
    const authBypassPatterns = [
      /(if\s*\(\s*true\s*\)|if\s*\(\s*1\s*==\s*1\s*\))/gi,
      /(bypass|skip|ignore)[_-]?auth/gi,
      /(admin|root)[_-]?mode/gi,
    ];

    authBypassPatterns.forEach(pattern => {
      const matches = output.match(pattern);
      if (matches) {
        matches.forEach(match => {
          vulnerabilities.push({
            type: 'auth_bypass',
            severity: 'critical',
            pattern: match,
            description: `Potential authentication bypass detected: ${match}`,
            fix: 'Always verify authentication and authorization. Never skip security checks.',
          });
        });
      }
    });

    // Calculate security score
    const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
    const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
    const mediumCount = vulnerabilities.filter(v => v.severity === 'medium').length;
    const lowCount = vulnerabilities.filter(v => v.severity === 'low').length;

    const score = Math.max(0, 100 - (criticalCount * 30 + highCount * 15 + mediumCount * 5 + lowCount * 2));

    return {
      passed: vulnerabilities.length === 0,
      vulnerabilities,
      score,
    };
  }

  /**
   * Compliance checking
   */
  private async checkCompliance(
    output: string,
    context?: Record<string, any>
  ): Promise<ComplianceCheckResult> {
    const violations: ComplianceViolation[] = [];

    // GDPR patterns
    const gdprPatterns = [
      {
        pattern: /(personal\s+data|pii|personally\s+identifiable)/gi,
        check: (match: string) => {
          // Check if there's proper handling mentioned
          const hasConsent = output.match(/(consent|opt[_-]?in|permission)/gi);
          const hasEncryption = output.match(/(encrypt|hash|secure)/gi);
          if (!hasConsent && !hasEncryption) {
            return {
              standard: 'gdpr' as const,
              violation: 'Personal data processing without explicit consent or encryption',
              severity: 'high' as const,
              description: 'GDPR requires explicit consent for personal data processing and encryption for storage',
              fix: 'Add explicit consent mechanism and encrypt personal data at rest and in transit.',
            };
          }
          return null;
        },
      },
      {
        pattern: /(log|store|save).*email/gi,
        check: (match: string) => {
          const hasConsent = output.match(/(consent|permission|opt[_-]?in)/gi);
          if (!hasConsent) {
            return {
              standard: 'gdpr' as const,
              violation: 'Email storage without consent',
              severity: 'medium' as const,
              description: 'GDPR requires consent before storing email addresses',
              fix: 'Add explicit consent before storing email addresses.',
            };
          }
          return null;
        },
      },
    ];

    gdprPatterns.forEach(({ pattern, check }) => {
      const matches = output.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const violation = check(match);
          if (violation) {
            violations.push(violation);
          }
        });
      }
    });

    // SOC 2 patterns
    const soc2Patterns = [
      {
        pattern: /(password|credential|secret)/gi,
        check: (match: string) => {
          const hasHashing = output.match(/(hash|bcrypt|argon2|scrypt|pbkdf2)/gi);
          const hasEncryption = output.match(/(encrypt|aes|rsa)/gi);
          if (!hasHashing && !hasEncryption) {
            return {
              standard: 'soc2' as const,
              violation: 'Passwords/secrets stored without hashing or encryption',
              severity: 'critical' as const,
              description: 'SOC 2 requires passwords and secrets to be hashed or encrypted',
              fix: 'Use strong hashing algorithms (bcrypt, argon2) for passwords. Encrypt secrets.',
            };
          }
          return null;
        },
      },
      {
        pattern: /(audit|log)/gi,
        check: (match: string) => {
          const hasAuditLog = output.match(/(audit[_-]?log|log[_-]?audit|audit[_-]?trail)/gi);
          if (!hasAuditLog) {
            return {
              standard: 'soc2' as const,
              violation: 'Missing audit logging for sensitive operations',
              severity: 'medium' as const,
              description: 'SOC 2 requires audit logging for all sensitive operations',
              fix: 'Add audit logging for authentication, authorization, and data access operations.',
            };
          }
          return null;
        },
      },
    ];

    soc2Patterns.forEach(({ pattern, check }) => {
      const matches = output.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const violation = check(match);
          if (violation) {
            violations.push(violation);
          }
        });
      }
    });

    // HIPAA patterns (if healthcare context)
    if (context?.outputType?.includes('health') || output.match(/(patient|health|medical|phi)/gi)) {
      const hipaaPatterns = [
        {
          pattern: /(patient|health|medical)/gi,
          check: (match: string) => {
            const hasEncryption = output.match(/(encrypt|tls|ssl|aes)/gi);
            const hasAccessControl = output.match(/(auth|authorize|permission|role)/gi);
            if (!hasEncryption || !hasAccessControl) {
              return {
                standard: 'hipaa' as const,
                violation: 'PHI handling without encryption and access controls',
                severity: 'critical' as const,
                description: 'HIPAA requires encryption and access controls for PHI',
                fix: 'Encrypt PHI at rest and in transit. Implement role-based access control.',
              };
            }
            return null;
          },
        },
      ];

      hipaaPatterns.forEach(({ pattern, check }) => {
        const matches = output.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const violation = check(match);
            if (violation) {
              violations.push(violation);
            }
          });
        }
      });
    }

    return {
      passed: violations.length === 0,
      violations,
      standards: {
        gdpr: violations.filter(v => v.standard === 'gdpr').length === 0,
        soc2: violations.filter(v => v.standard === 'soc2').length === 0,
        hipaa: violations.filter(v => v.standard === 'hipaa').length === 0,
      },
    };
  }

  /**
   * Quality checking
   */
  private async checkQuality(
    output: string,
    context?: Record<string, any>
  ): Promise<QualityCheckResult> {
    const issues: QualityIssue[] = [];

    // Code smells
    const codeSmellPatterns = [
      {
        pattern: /(function\s+\w+\s*\([^)]*\)\s*\{[^}]{500,}\})/gs, // Long functions
        issue: {
          type: 'code_smell' as const,
          severity: 'medium' as const,
          pattern: 'Long function',
          description: 'Function exceeds recommended length (500+ characters)',
          suggestion: 'Break down into smaller, focused functions. Follow single responsibility principle.',
        },
      },
      {
        pattern: /(if\s*\([^)]+\)\s*\{[^}]*\}\s*else\s*if\s*\([^)]+\)\s*\{[^}]*\}\s*else\s*if)/gi, // Deep nesting
        issue: {
          type: 'code_smell' as const,
          severity: 'low' as const,
          pattern: 'Deep nesting',
          description: 'Deeply nested conditionals reduce readability',
          suggestion: 'Use early returns, guard clauses, or strategy pattern to reduce nesting.',
        },
      },
      {
        pattern: /(TODO|FIXME|HACK|XXX)/gi,
        issue: {
          type: 'code_smell' as const,
          severity: 'low' as const,
          pattern: 'Technical debt markers',
          description: 'Code contains TODO/FIXME comments indicating incomplete work',
          suggestion: 'Address technical debt before production deployment.',
        },
      },
    ];

    codeSmellPatterns.forEach(({ pattern, issue }) => {
      const matches = output.match(pattern);
      if (matches) {
        matches.forEach(() => {
          issues.push(issue);
        });
      }
    });

    // Anti-patterns
    const antiPatterns = [
      {
        pattern: /(eval\s*\(|Function\s*\(|new\s+Function)/gi,
        issue: {
          type: 'anti_pattern' as const,
          severity: 'high' as const,
          pattern: 'eval() usage',
          description: 'Use of eval() is a security and performance anti-pattern',
          suggestion: 'Avoid eval(). Use safer alternatives like JSON.parse() or function factories.',
        },
      },
      {
        pattern: /(var\s+\w+)/g, // var instead of const/let
        issue: {
          type: 'anti_pattern' as const,
          severity: 'low' as const,
          pattern: 'var keyword',
          description: 'Use of var instead of const/let',
          suggestion: 'Use const for immutable values, let for mutable values. Avoid var.',
        },
      },
    ];

    antiPatterns.forEach(({ pattern, issue }) => {
      const matches = output.match(pattern);
      if (matches) {
        matches.forEach(() => {
          issues.push(issue);
        });
      }
    });

    // Best practices
    const bestPracticeChecks = [
      {
        pattern: /(async\s+function|async\s+\()/gi,
        check: (match: string) => {
          const hasErrorHandling = output.match(/(try\s*\{|catch\s*\(|\.catch\s*\()/gi);
          if (!hasErrorHandling) {
            return {
              type: 'best_practice' as const,
              severity: 'medium' as const,
              pattern: 'Missing error handling',
              description: 'Async functions should have error handling',
              suggestion: 'Add try-catch blocks or .catch() handlers for async operations.',
            };
          }
          return null;
        },
      },
    ];

    bestPracticeChecks.forEach(({ pattern, check }) => {
      const matches = output.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const issue = check(match);
          if (issue) {
            issues.push(issue);
          }
        });
      }
    });

    // Calculate quality score
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const highCount = issues.filter(i => i.severity === 'high').length;
    const mediumCount = issues.filter(i => i.severity === 'medium').length;
    const lowCount = issues.filter(i => i.severity === 'low').length;

    const score = Math.max(0, 100 - (criticalCount * 20 + highCount * 10 + mediumCount * 5 + lowCount * 2));

    return {
      passed: issues.length === 0 || (criticalCount === 0 && highCount === 0),
      issues,
      score,
    };
  }
}

export const safetyEnforcementService = new SafetyEnforcementService();
