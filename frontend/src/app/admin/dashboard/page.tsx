'use client';

import React from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';

export default function AdminDashboard() {
  // This would fetch admin stats
  return (
    <div className="container-responsive py-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
            Total Users
          </h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">-</p>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
            Active Sessions
          </h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">-</p>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
            Agent Runs (24h)
          </h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">-</p>
        </div>
      </div>
    </div>
  );
}
