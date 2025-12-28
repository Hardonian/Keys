'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/services/supabaseClient';
import type { PromptAtom } from '@/types';

export function PromptAtomsManager() {
  const [atoms, setAtoms] = useState<PromptAtom[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAtom, setEditingAtom] = useState<PromptAtom | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchAtoms();
  }, []);

  async function fetchAtoms() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('prompt_atoms')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setAtoms(data || []);
    } catch (error) {
      console.error('Error fetching atoms:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleAtomActive(atomId: string, currentActive: boolean) {
    try {
      const { error } = await supabase
        .from('prompt_atoms')
        .update({ active: !currentActive })
        .eq('id', atomId);

      if (error) throw error;
      fetchAtoms();
    } catch (error) {
      console.error('Error toggling atom:', error);
    }
  }

  async function deleteAtom(atomId: string) {
    if (!confirm('Are you sure you want to delete this atom?')) return;

    try {
      const { error } = await supabase
        .from('prompt_atoms')
        .delete()
        .eq('id', atomId);

      if (error) throw error;
      fetchAtoms();
    } catch (error) {
      console.error('Error deleting atom:', error);
    }
  }

  const groupedAtoms = atoms.reduce((acc, atom) => {
    if (!acc[atom.category]) {
      acc[atom.category] = [];
    }
    acc[atom.category].push(atom);
    return acc;
  }, {} as Record<string, PromptAtom[]>);

  if (loading) {
    return <div className="p-4">Loading atoms...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Prompt Atoms Manager</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Create New Atom
        </button>
      </div>

      {Object.entries(groupedAtoms).map(([category, categoryAtoms]) => (
        <div key={category} className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 capitalize">{category}</h3>
          <div className="space-y-3">
            {categoryAtoms.map((atom) => (
              <div
                key={atom.id}
                className="border border-gray-200 rounded p-3 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{atom.name}</span>
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          atom.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {atom.active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Success Rate: {(atom.success_rate * 100).toFixed(1)}%
                      </span>
                      <span className="text-xs text-gray-500">
                        Usage: {atom.usage_count}
                      </span>
                    </div>
                    {atom.system_prompt && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {atom.system_prompt}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {atom.target_roles && atom.target_roles.length > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Roles: {atom.target_roles.join(', ')}
                        </span>
                      )}
                      {atom.target_verticals && atom.target_verticals.length > 0 && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          Verticals: {atom.target_verticals.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => toggleAtomActive(atom.id, atom.active)}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      {atom.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => deleteAtom(atom.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Create New Atom</h3>
            <p className="text-sm text-gray-500 mb-4">
              Atom creation form would go here. This is a placeholder for the full CRUD form.
            </p>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
