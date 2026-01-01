/**
 * Safety Enforcement Service Tests
 * 
 * Tests for security/compliance/quality checking
 */

import { describe, it, expect } from 'vitest';
import { safetyEnforcementService } from '../../src/services/safetyEnforcementService.js';

describe('SafetyEnforcementService', () => {
  describe('checkSecurity', () => {
    it('should detect SQL injection', async () => {
      const output = "SELECT * FROM users WHERE id = '${userId}'";
      const result = await safetyEnforcementService.checkOutput(output);

      expect(result.checks.security.vulnerabilities.length).toBeGreaterThan(0);
      const sqlInjection = result.checks.security.vulnerabilities.find(
        v => v.type === 'sql_injection'
      );
      expect(sqlInjection).toBeDefined();
    });

    it('should detect XSS vulnerabilities', async () => {
      const output = '<script>alert("XSS")</script>';
      const result = await safetyEnforcementService.checkOutput(output);

      const xss = result.checks.security.vulnerabilities.find(
        v => v.type === 'xss'
      );
      expect(xss).toBeDefined();
    });

    it('should detect secret exposure', async () => {
      const output = 'const api_key = "ghp_1234567890abcdefghijklmnopqrstuvwxyz123456"';
      const result = await safetyEnforcementService.checkOutput(output);

      const secret = result.checks.security.vulnerabilities.find(
        v => v.type === 'secret_exposure'
      );
      expect(secret).toBeDefined();
    });

    it('should block critical security issues', async () => {
      const output = "SELECT * FROM users WHERE id = '${userId}'";
      const result = await safetyEnforcementService.checkOutput(output);

      expect(result.blocked).toBe(true);
    });
  });

  describe('checkCompliance', () => {
    it('should detect GDPR violations', async () => {
      const output = 'const email = user.email; // Store email';
      const result = await safetyEnforcementService.checkOutput(output);

      const gdprViolation = result.checks.compliance.violations.find(
        v => v.standard === 'gdpr'
      );
      expect(gdprViolation).toBeDefined();
    });

    it('should detect SOC 2 violations', async () => {
      const output = 'const password = req.body.password; // Store password';
      const result = await safetyEnforcementService.checkOutput(output);

      const soc2Violation = result.checks.compliance.violations.find(
        v => v.standard === 'soc2'
      );
      expect(soc2Violation).toBeDefined();
    });
  });

  describe('checkQuality', () => {
    it('should detect code smells', async () => {
      const output = '// TODO: Fix this later';
      const result = await safetyEnforcementService.checkOutput(output);

      const codeSmell = result.checks.quality.issues.find(
        i => i.type === 'code_smell'
      );
      expect(codeSmell).toBeDefined();
    });

    it('should detect anti-patterns', async () => {
      const output = 'eval(userInput)';
      const result = await safetyEnforcementService.checkOutput(output);

      const antiPattern = result.checks.quality.issues.find(
        i => i.type === 'anti_pattern'
      );
      expect(antiPattern).toBeDefined();
    });
  });

  describe('checkOutput', () => {
    it('should perform all checks', async () => {
      const output = 'const x = 1;';
      const result = await safetyEnforcementService.checkOutput(output);

      expect(result.checks.security).toBeDefined();
      expect(result.checks.compliance).toBeDefined();
      expect(result.checks.quality).toBeDefined();
    });

    it('should pass safe code', async () => {
      const output = 'const x = 1; const y = 2;';
      const result = await safetyEnforcementService.checkOutput(output);

      expect(result.passed).toBe(true);
      expect(result.blocked).toBe(false);
    });
  });
});
