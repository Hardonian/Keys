import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface AuditLogEntry {
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export class AuditLogService {
  /**
   * Log an audit event
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await supabase.from('background_events').insert({
        event_type: `audit.${entry.action}`,
        source: 'audit_log',
        event_data: {
          userId: entry.userId,
          action: entry.action,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId,
          details: entry.details,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
        },
        event_timestamp: entry.timestamp.toISOString(),
        user_id: entry.userId,
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
      // Don't throw - audit logging failures shouldn't break the app
    }
  }

  /**
   * Log admin action
   */
  async logAdminAction(
    userId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: Record<string, any>,
    req?: { ip?: string; headers?: Record<string, string> }
  ): Promise<void> {
    await this.log({
      userId,
      action: `admin.${action}`,
      resourceType,
      resourceId,
      details,
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent'],
      timestamp: new Date(),
    });
  }

  /**
   * Log data access
   */
  async logDataAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: 'read' | 'write' | 'delete',
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      userId,
      action: `data_access.${action}`,
      resourceType,
      resourceId,
      details: {
        ...details,
        // Scrub PII from details
        email: details?.email ? '[REDACTED]' : undefined,
        password: undefined,
        token: undefined,
        secret: undefined,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(
    filters?: {
      userId?: string;
      action?: string;
      resourceType?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<AuditLogEntry[]> {
    try {
      let query = supabase
        .from('background_events')
        .select('*')
        .eq('source', 'audit_log')
        .order('event_timestamp', { ascending: false });

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters?.action) {
        query = query.like('event_type', `audit.${filters.action}%`);
      }

      if (filters?.startDate) {
        query = query.gte('event_timestamp', filters.startDate.toISOString());
      }

      if (filters?.endDate) {
        query = query.lte('event_timestamp', filters.endDate.toISOString());
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      } else {
        query = query.limit(1000);
      }

      const { data: events } = await query;

      if (!events) {
        return [];
      }

      return events.map((event) => {
        const eventData = event.event_data as any;
        return {
          userId: event.user_id,
          action: eventData.action || event.event_type,
          resourceType: eventData.resourceType || 'unknown',
          resourceId: eventData.resourceId,
          details: eventData.details,
          ipAddress: eventData.ipAddress,
          userAgent: eventData.userAgent,
          timestamp: new Date(event.event_timestamp),
        };
      });
    } catch (error) {
      console.error('Error getting audit logs:', error);
      return [];
    }
  }
}

export const auditLogService = new AuditLogService();
