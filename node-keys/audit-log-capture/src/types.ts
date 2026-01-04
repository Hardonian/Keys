export interface AuditLogEntry {
  id: string;
  userId: string;
  tenantId: string;
  action: string;
  resource: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}
