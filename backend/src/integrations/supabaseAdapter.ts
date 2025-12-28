import { createClient } from '@supabase/supabase-js';

export interface SupabaseSchemaChange {
  type: 'table.created' | 'table.updated' | 'table.deleted' | 'column.added' | 'column.updated' | 'column.deleted' | 'migration.pending';
  table?: string;
  column?: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export class SupabaseAdapter {
  private supabase: ReturnType<typeof createClient>;
  private lastSchemaCheck: Date | null = null;
  private schemaSnapshot: Map<string, any> = new Map();

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Monitor schema changes by comparing current schema to snapshot
   */
  async detectSchemaChanges(): Promise<SupabaseSchemaChange[]> {
    const changes: SupabaseSchemaChange[] = [];
    const now = new Date();

    try {
      // Get current schema information
      const currentSchema = await this.getCurrentSchema();

      if (this.lastSchemaCheck && this.schemaSnapshot.size > 0) {
        // Compare with previous snapshot
        for (const [tableName, currentTable] of Object.entries(currentSchema)) {
          const previousTable = this.schemaSnapshot.get(tableName);

          if (!previousTable) {
            // New table
            changes.push({
              type: 'table.created',
              table: tableName,
              details: currentTable,
              timestamp: now,
            });
          } else {
            // Check for column changes
            const currentColumns = currentTable.columns || [];
            const previousColumns = previousTable.columns || [];

            const currentColumnNames = new Set(currentColumns.map((c: any) => c.name));
            const previousColumnNames = new Set(previousColumns.map((c: any) => c.name));

            // New columns
            for (const col of currentColumns) {
              if (!previousColumnNames.has(col.name)) {
                changes.push({
                  type: 'column.added',
                  table: tableName,
                  column: col.name,
                  details: col,
                  timestamp: now,
                });
              }
            }

            // Removed columns
            for (const col of previousColumns) {
              if (!currentColumnNames.has(col.name)) {
                changes.push({
                  type: 'column.deleted',
                  table: tableName,
                  column: col.name,
                  details: col,
                  timestamp: now,
                });
              }
            }

            // Updated columns (simplified check)
            for (const col of currentColumns) {
              const prevCol = previousColumns.find((c: any) => c.name === col.name);
              if (prevCol && JSON.stringify(col) !== JSON.stringify(prevCol)) {
                changes.push({
                  type: 'column.updated',
                  table: tableName,
                  column: col.name,
                  details: { previous: prevCol, current: col },
                  timestamp: now,
                });
              }
            }
          }
        }

        // Check for deleted tables
        for (const [tableName] of this.schemaSnapshot) {
          if (!currentSchema[tableName]) {
            changes.push({
              type: 'table.deleted',
              table: tableName,
              timestamp: now,
            });
          }
        }
      }

      // Update snapshot
      this.schemaSnapshot.clear();
      for (const [tableName, tableData] of Object.entries(currentSchema)) {
        this.schemaSnapshot.set(tableName, tableData);
      }
      this.lastSchemaCheck = now;

      return changes;
    } catch (error) {
      console.error('Error detecting schema changes:', error);
      return [];
    }
  }

  /**
   * Get current database schema
   */
  private async getCurrentSchema(): Promise<Record<string, any>> {
    try {
      // Query information_schema to get table and column information
      const { data: tables, error } = await this.supabase.rpc('get_schema_info');

      if (error) {
        // Fallback: Use direct SQL query if RPC doesn't exist
        return await this.getSchemaViaQuery();
      }

      return tables || {};
    } catch (error) {
      console.error('Error getting schema:', error);
      return {};
    }
  }

  /**
   * Fallback method to get schema via direct query
   */
  private async getSchemaViaQuery(): Promise<Record<string, any>> {
    // This would require a custom SQL function or direct PostgreSQL connection
    // For now, return empty object - this would be implemented with pg library
    return {};
  }

  /**
   * Check for pending migrations
   */
  async checkPendingMigrations(): Promise<boolean> {
    try {
      // Check if there are unapplied migrations
      // This would typically check a migrations table or file system
      // For now, return false as placeholder
      return false;
    } catch (error) {
      console.error('Error checking migrations:', error);
      return false;
    }
  }

  /**
   * Convert schema change to event type
   */
  schemaChangeToEventType(change: SupabaseSchemaChange): string {
    return `supabase.${change.type}`;
  }

  /**
   * Get table information
   */
  async getTableInfo(tableName: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from(tableName)
        .select('*')
        .limit(0);

      if (error) {
        console.error('Error getting table info:', error);
        return null;
      }

      // Return metadata about the table
      return {
        name: tableName,
        exists: true,
      };
    } catch (error) {
      console.error('Error getting table info:', error);
      return null;
    }
  }
}

export const supabaseAdapter = new SupabaseAdapter();
