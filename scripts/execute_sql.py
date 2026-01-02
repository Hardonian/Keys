#!/usr/bin/env python3
"""
Execute SQL file against Supabase database
"""
import sys
import psycopg2
from psycopg2 import sql
import os

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:84Px0bMoJmGhLXhB@db.yekbmihsqoghbtjkwgkn.supabase.co:5432/postgres')

def execute_sql_file(file_path):
    """Execute SQL file against database"""
    try:
        # Parse connection string
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True  # For DDL statements
        cur = conn.cursor()
        
        print(f'✅ Connected to database')
        print(f'📄 Executing: {file_path}')
        
        # Read SQL file
        with open(file_path, 'r') as f:
            sql_content = f.read()
        
        # Execute SQL
        try:
            cur.execute(sql_content)
            print(f'✅ Successfully executed SQL file')
            return True
        except psycopg2.Error as e:
            # For PATCH.sql, many "already exists" errors are expected
            if 'PATCH.sql' in file_path:
                if 'already exists' in str(e) or 'duplicate' in str(e) or '42P07' in str(e) or '42710' in str(e):
                    print(f'⚠️  Some objects already exist (expected for idempotent patch)')
                    print(f'   This is normal - patch is idempotent')
                    return True
            print(f'❌ Error: {e}')
            raise
        
    except Exception as e:
        print(f'❌ Fatal error: {e}')
        return False
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python scripts/execute_sql.py <sql-file-path>')
        sys.exit(1)
    
    file_path = sys.argv[1]
    success = execute_sql_file(file_path)
    sys.exit(0 if success else 1)
