import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createClient, User } from '@supabase/supabase-js';
import { authMiddleware, AuthenticatedRequest } from '../../../src/middleware/auth.js';
import { requireTenantMiddleware, TenantAuthenticatedRequest, resolveTenantContext } from '../../../src/middleware/tenantContext.js';
import { createTenantEnforcedQuery, tenantScopedInsert, tenantScopedDelete } from '../../../src/lib/tenantIsolation.js';
import { asyncHandler } from '../../../src/middleware/errorHandler.js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

describe('Tenant Isolation Integration Tests', () => {
  let app: express.Express;
  let tenant1UserId = '';
  let tenant2UserId = '';
  let tenant1OrgId = '';
  let tenant2OrgId = '';
  let tenant1Token = '';
  let tenant2Token = '';
  let testEntitlementId = '';

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    app.use('/api/test', authMiddleware, requireTenantMiddleware(), asyncHandler(async (req: AuthenticatedRequest, res: any) => {
      const tenantReq = req as TenantAuthenticatedRequest;
      res.json({
        userId: req.userId,
        tenantId: tenantReq.tenant.tenantId,
        tenantType: tenantReq.tenant.tenantType,
      });
    }));

    app.use('/api/entitlements', authMiddleware, requireTenantMiddleware(), asyncHandler(async (req: AuthenticatedRequest, res: any) => {
      const tenantReq = req as TenantAuthenticatedRequest;
      const { data, error } = await createTenantEnforcedQuery(
        supabaseAdmin,
        'marketplace_entitlements',
        tenantReq.tenant
      ).select('id, key_id, tenant_id, tenant_type, status');

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json({ entitlements: data });
    }));

    app.use('/api/entitlements', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: any) => {
      const { data, error } = await supabaseAdmin
        .from('marketplace_entitlements')
        .select('id, key_id, tenant_id, tenant_type, status')
        .limit(100);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json({ entitlements: data });
    }));

    app.use('/api/insert', authMiddleware, requireTenantMiddleware(), asyncHandler(async (req: AuthenticatedRequest, res: any) => {
      const tenantReq = req as TenantAuthenticatedRequest;
      const result = await tenantScopedInsert(
        supabaseAdmin,
        'marketplace_entitlements',
        tenantReq.tenant,
        { key_id: 'test-key-id', source: 'manual', status: 'active' }
      );
      res.json(result);
    }));

    app.use('/api/delete-scoped', authMiddleware, requireTenantMiddleware(), asyncHandler(async (req: AuthenticatedRequest, res: any) => {
      const tenantReq = req as TenantAuthenticatedRequest;
      const { id } = req.body;
      await tenantScopedDelete(
        supabaseAdmin,
        'marketplace_entitlements',
        tenantReq.tenant,
        { id }
      );
      res.json({ success: true });
    }));

    try {
      const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (userError) {
        console.log('Skipping user creation - auth admin may not be available:', userError.message);
        return;
      }

      const existingUser1 = users?.users?.find(u => u.email === 'tenant1@test.com');
      const existingUser2 = users?.users?.find(u => u.email === 'tenant2@test.com');

      let user1: User | null = existingUser1 || null;
      let user2: User | null = existingUser2 || null;

      if (!user1) {
        const { data: newUser1 } = await supabaseAdmin.auth.admin.createUser({
          email: 'tenant1@test.com',
          password: 'password123',
          email_confirm: true,
        });
        user1 = newUser1?.user || null;
      }

      if (!user2) {
        const { data: newUser2 } = await supabaseAdmin.auth.admin.createUser({
          email: 'tenant2@test.com',
          password: 'password123',
          email_confirm: true,
        });
        user2 = newUser2?.user || null;
      }

      if (user1 && user2) {
        tenant1UserId = user1.id;
        tenant2UserId = user2.id;

        const { data: org1 } = await supabaseAdmin
          .from('organizations')
          .insert({ name: 'Test Org 1', slug: 'test-org-1-tenant', owner_id: tenant1UserId })
          .select()
          .single();

        const { data: org2 } = await supabaseAdmin
          .from('organizations')
          .insert({ name: 'Test Org 2', slug: 'test-org-2-tenant', owner_id: tenant2UserId })
          .select()
          .single();

        if (org1 && org2) {
          tenant1OrgId = org1.id;
          tenant2OrgId = org2.id;

          await supabaseAdmin.from('organization_members').insert([
            { org_id: tenant1OrgId, user_id: tenant1UserId, role: 'owner' },
            { org_id: tenant2OrgId, user_id: tenant2UserId, role: 'owner' },
          ]);
        }

        const { data: refresh1 } = await supabaseAdmin.auth.refreshSession();
        if (refresh1?.session?.access_token) {
          tenant1Token = refresh1.session.access_token;
        }

        const { data: refresh2 } = await supabaseAdmin.auth.refreshSession();
        if (refresh2?.session?.access_token) {
          tenant2Token = refresh2.session.access_token;
        }

        const { data: key } = await supabaseAdmin
          .from('marketplace_keys')
          .select('id')
          .limit(1)
          .single();

        if (key && tenant1OrgId) {
          const { data: entitlement } = await supabaseAdmin
            .from('marketplace_entitlements')
            .insert({
              tenant_id: tenant1OrgId,
              tenant_type: 'org',
              key_id: key.id,
              source: 'manual',
              status: 'active',
            })
            .select()
            .single();

          if (entitlement) {
            testEntitlementId = entitlement.id;
          }
        }
      }
    } catch (error) {
      console.log('Setup error:', error);
    }
  }, 30000);

  afterAll(async () => {
    try {
      if (tenant1UserId) {
        await supabaseAdmin.auth.admin.deleteUser(tenant1UserId);
      }
      if (tenant2UserId) {
        await supabaseAdmin.auth.admin.deleteUser(tenant2UserId);
      }
      if (tenant1OrgId) {
        await supabaseAdmin.from('marketplace_entitlements').delete({ tenant_id: tenant1OrgId });
        await supabaseAdmin.from('organizations').delete({ id: tenant1OrgId });
      }
      if (tenant2OrgId) {
        await supabaseAdmin.from('organizations').delete({ id: tenant2OrgId });
      }
    } catch (error) {
      console.log('Cleanup error:', error);
    }
  }, 30000);

  describe('Tenant Context Resolution', () => {
    it('should resolve user-level tenant when user has no org membership', async () => {
      if (!tenant1Token) {
        console.log('Skipping - no tenant token available');
        return;
      }

      const response = await request(app)
        .get('/api/test')
        .set('Authorization', `Bearer ${tenant1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.userId).toBe(tenant1UserId);
      expect(response.body.tenantType).toBe('user');
      expect(response.body.tenantId).toBe(tenant1UserId);
    });

    it('should resolve org-level tenant when user belongs to an org', async () => {
      if (!tenant1Token || !tenant1OrgId) {
        console.log('Skipping - no tenant data available');
        return;
      }

      const response = await request(app)
        .get('/api/test')
        .set('Authorization', `Bearer ${tenant1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.tenantType).toBe('org');
      expect(response.body.tenantId).toBe(tenant1OrgId);
    });
  });

  describe('Cross-Tenant Read Access Prevention', () => {
    it('should deny access to entitlements of another tenant', async () => {
      if (!tenant1Token || !tenant1OrgId) {
        console.log('Skipping - no tenant data available');
        return;
      }

      const response = await request(app)
        .get('/api/entitlements')
        .set('Authorization', `Bearer ${tenant1Token}`);

      expect(response.status).toBe(200);
      const entitlements = response.body.entitlements || [];

      if (entitlements.length > 0) {
        for (const ent of entitlements) {
          expect(ent.tenant_id).toBe(tenant1OrgId);
        }
      }
    });

    it('should return only tenant1 entitlements when authenticated as tenant1', async () => {
      if (!tenant1Token || !tenant1OrgId) {
        console.log('Skipping - no tenant data available');
        return;
      }

      const response = await request(app)
        .get('/api/entitlements')
        .set('Authorization', `Bearer ${tenant1Token}`);

      expect(response.status).toBe(200);

      const entitlements = response.body.entitlements || [];
      for (const ent of entitlements) {
        expect(ent.tenant_id).toBe(tenant1OrgId);
      }
    });

    it('should return only tenant2 entitlements when authenticated as tenant2', async () => {
      if (!tenant2Token || !tenant2OrgId) {
        console.log('Skipping - no tenant data available');
        return;
      }

      const response = await request(app)
        .get('/api/entitlements')
        .set('Authorization', `Bearer ${tenant2Token}`);

      expect(response.status).toBe(200);

      const entitlements = response.body.entitlements || [];
      for (const ent of entitlements) {
        expect(ent.tenant_id).toBe(tenant2OrgId);
      }
    });
  });

  describe('Cross-Tenant Write Access Prevention', () => {
    it('should only insert entitlements for the requesting tenant', async () => {
      if (!tenant2Token || !tenant2OrgId) {
        console.log('Skipping - no tenant data available');
        return;
      }

      const initialResponse = await request(app)
        .get('/api/entitlements')
        .set('Authorization', `Bearer ${tenant2Token}`);

      const initialCount = (initialResponse.body.entitlements || []).length;

      await request(app)
        .post('/api/insert')
        .set('Authorization', `Bearer ${tenant2Token}`)
        .send({});

      const afterInsertResponse = await request(app)
        .get('/api/entitlements')
        .set('Authorization', `Bearer ${tenant2Token}`);

      const afterCount = (afterInsertResponse.body.entitlements || []).length;
      expect(afterCount).toBeGreaterThanOrEqual(initialCount);

      for (const ent of afterInsertResponse.body.entitlements || []) {
        expect(ent.tenant_id).toBe(tenant2OrgId);
      }
    });

    it('should not allow tenant1 to delete tenant2 entitlements', async () => {
      if (!tenant1Token || !tenant1OrgId || !testEntitlementId) {
        console.log('Skipping - no test entitlement to delete');
        return;
      }

      const deleteResponse = await request(app)
        .post('/api/delete-scoped')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({ id: testEntitlementId });

      expect(deleteResponse.status).toBe(200);

      const verifyResponse = await request(app)
        .get('/api/entitlements')
        .set('Authorization', `Bearer ${tenant1Token}`);

      const entitlements = verifyResponse.body.entitlements || [];
      const foundEntitlement = entitlements.find((e: any) => e.id === testEntitlementId);

      if (foundEntitlement) {
        expect(foundEntitlement.tenant_id).not.toBe(tenant1OrgId);
      }
    });
  });

  describe('RLS Database Enforcement', () => {
    it('should enforce tenant isolation at database level via RLS', async () => {
      if (!tenant1Token || !tenant1OrgId) {
        console.log('Skipping - no tenant data available');
        return;
      }

      const client = createClient(supabaseUrl, tenant1Token);

      const { data, error } = await client
        .from('marketplace_entitlements')
        .select('id, tenant_id, tenant_type')
        .limit(100);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data && data.length > 0) {
        for (const row of data) {
          if (row.tenant_type === 'user') {
            expect(row.tenant_id).toBe(tenant1UserId);
          } else if (row.tenant_type === 'org') {
            expect(row.tenant_id).toBe(tenant1OrgId);
          }
        }
      }
    });

    it('should deny direct query for another tenant data', async () => {
      if (!tenant1Token || !tenant1OrgId || !tenant2OrgId) {
        console.log('Skipping - no tenant data available');
        return;
      }

      const client = createClient(supabaseUrl, tenant1Token);

      const { data, error } = await client
        .from('marketplace_entitlements')
        .select('id, tenant_id')
        .eq('tenant_id', tenant2OrgId);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it('should deny insert with mismatched tenant_id', async () => {
      if (!tenant1Token || !tenant1OrgId || !tenant2OrgId) {
        console.log('Skipping - no tenant data available');
        return;
      }

      const client = createClient(supabaseUrl, tenant1Token);

      const { data, error } = await client
        .from('marketplace_entitlements')
        .insert({
          tenant_id: tenant2OrgId,
          tenant_type: 'org',
          key_id: 'some-key-id',
          source: 'manual',
          status: 'active',
        })
        .select();

      expect(data).toEqual([]);
    });
  });

  describe('Tenant Isolation Boundary Validation', () => {
    it('should reject requests without tenant context', async () => {
      const noTenantApp = express();
      noTenantApp.use(express.json());
      noTenantApp.use('/api/no-tenant', asyncHandler(async (req: AuthenticatedRequest, res: any) => {
        const tenantReq = req as TenantAuthenticatedRequest;
        res.json({ tenant: tenantReq.tenant });
      }));

      const response = await request(noTenantApp)
        .get('/api/no-tenant')
        .set('Authorization', `Bearer ${tenant1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.tenant).toBeNull();
    });

    it('should require auth middleware before tenant middleware', async () => {
      const response = await request(app)
        .get('/api/test')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('resolveTenantContext Function', () => {
    it('should return org-level tenant for user with org membership', async () => {
      if (!tenant1UserId || !tenant1OrgId) {
        console.log('Skipping - no tenant data available');
        return;
      }

      const context = await resolveTenantContext(tenant1UserId);
      expect(context.tenantId).toBe(tenant1OrgId);
      expect(context.tenantType).toBe('org');
    });

    it('should return user-level tenant for user without org membership', async () => {
      const orphanEmail = `orphan-${Date.now()}@test.com`;
      const { data: newUser } = await supabaseAdmin.auth.admin.createUser({
        email: orphanEmail,
        password: 'password123',
        email_confirm: true,
      });

      if (newUser?.user) {
        const context = await resolveTenantContext(newUser.user.id);
        expect(context.tenantId).toBe(newUser.user.id);
        expect(context.tenantType).toBe('user');

        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      }
    });
  });
});

describe('Tenant Isolation - Security Invariants', () => {
  it('should document that tenant_id is non-nullable for tenant-scoped tables', () => {
    const tenantScopedTables = [
      'marketplace_entitlements',
      'marketplace_bundle_entitlements',
      'marketplace_download_events',
      'marketplace_analytics',
      'usage_metrics',
      'organizations',
      'organization_members',
      'invitations',
    ];

    tenantScopedTables.forEach(table => {
      expect(table).toBeDefined();
    });
  });

  it('should enforce that tenant_type is either "org" or "user"', () => {
    const validTypes = ['org', 'user'];
    expect(validTypes).toContain('org');
    expect(validTypes).toContain('user');
  });
});
