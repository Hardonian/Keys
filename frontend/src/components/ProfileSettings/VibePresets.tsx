'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/services/supabaseClient';
// VibeConfig imported but not directly used - kept for type reference

interface VibePreset {
  id: string;
  name: string;
  playfulness: number;
  revenue_focus: number;
  investor_perspective: number;
  created_at: string;
}

interface VibePresetsProps {
  userId: string;
  currentVibe: {
    playfulness: number;
    revenue_focus: number;
    investor_perspective: number;
  };
  onLoadPreset: (preset: VibePreset) => void;
}

export function VibePresets({
  userId,
  currentVibe,
  onLoadPreset,
}: VibePresetsProps) {
  const [presets, setPresets] = useState<VibePreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [presetName, setPresetName] = useState('');

  useEffect(() => {
    fetchPresets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function fetchPresets() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vibe_configs')
        .select('id, name, playfulness, revenue_focus, investor_perspective, created_at')
        .eq('user_id', userId)
        .not('name', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPresets((data as VibePreset[]) || []);
    } catch (error) {
      console.error('Error fetching presets:', error);
    } finally {
      setLoading(false);
    }
  }

  async function savePreset() {
    if (!presetName.trim()) return;

    try {
      const { error } = await supabase
        .from('vibe_configs')
        .insert({
          user_id: userId,
          name: presetName.trim(),
          playfulness: currentVibe.playfulness,
          revenue_focus: currentVibe.revenue_focus,
          investor_perspective: currentVibe.investor_perspective,
        })
        .select()
        .single();

      if (error) throw error;
      setPresetName('');
      setShowSaveModal(false);
      fetchPresets();
    } catch (error) {
      console.error('Error saving preset:', error);
      alert('Failed to save preset');
    }
  }

  async function deletePreset(presetId: string) {
    if (!confirm('Are you sure you want to delete this preset?')) return;

    try {
      const { error } = await supabase
        .from('vibe_configs')
        .delete()
        .eq('id', presetId);

      if (error) throw error;
      fetchPresets();
    } catch (error) {
      console.error('Error deleting preset:', error);
      alert('Failed to delete preset');
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading presets...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Vibe Presets</h3>
        <button
          onClick={() => setShowSaveModal(true)}
          className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
        >
          Save Current
        </button>
      </div>

      {presets.length === 0 ? (
        <p className="text-sm text-gray-500">No presets saved yet</p>
      ) : (
        <div className="space-y-2">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex-1">
                <div className="font-medium">{preset.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  P: {preset.playfulness} | R: {preset.revenue_focus} | I:{' '}
                  {preset.investor_perspective}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onLoadPreset(preset)}
                  className="px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Load
                </button>
                <button
                  onClick={() => deletePreset(preset.id)}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Save Preset</h3>
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Preset name (e.g., &apos;Q4 Revenue Push&apos;)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  savePreset();
                } else if (e.key === 'Escape') {
                  setShowSaveModal(false);
                }
              }}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={savePreset}
                disabled={!presetName.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
