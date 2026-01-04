/**
 * Audit Log Widget Component
 * 
 * Server Component that fetches and displays audit logs
 */

'use client';

import { useEffect, useState } from 'react';
import type { AuditLogEntry } from '../types';

/**
 * Audit Log Widget
 * 
 * Displays audit log entries for the current user/tenant
 * 
 * Note: In a real implementation, this would be a Server Component
 * that fetches data server-side. This is a simplified client component.
 */
export function AuditLogWidget() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      try {
        // In a real implementation, this would be a server-side fetch
        // For demonstration, we'll simulate an API call
        const response = await fetch('/api/audit-logs');
        
        if (!response.ok) {
          throw new Error('Failed to fetch audit logs');
        }

        const data = await response.json();
        setLogs(data.logs || []);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
        setError('Unable to load audit logs. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="audit-log-widget">
        <p>Loading audit logs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="audit-log-widget error">
        <p>{error}</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="audit-log-widget">
        <p>No audit logs found.</p>
      </div>
    );
  }

  return (
    <div className="audit-log-widget">
      <h2>Audit Log</h2>
      <ul>
        {logs.map((log) => (
          <li key={log.id}>
            <strong>{log.action}</strong> on {log.resource} at{' '}
            {new Date(log.timestamp).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
