'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/services/supabaseClient';
import type { UserProfile } from '@/types';

export function ProfileExplorer() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredProfiles = profiles.filter((profile) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      profile.user_id?.toLowerCase().includes(term) ||
      profile.name?.toLowerCase().includes(term) ||
      profile.role?.toLowerCase().includes(term) ||
      profile.vertical?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return <div className="p-4">Loading profiles...</div>;
  }

  return (
    <div className="flex gap-6 h-full">
      {/* Profile List */}
      <div className="w-1/3 border-r border-gray-200 pr-6">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search profiles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {filteredProfiles.map((profile) => (
            <div
              key={profile.id}
              onClick={() => setSelectedProfile(profile)}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedProfile?.id === profile.id
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium">{profile.name || profile.user_id}</div>
              <div className="text-sm text-gray-600">
                {profile.role && <span className="capitalize">{profile.role}</span>}
                {profile.vertical && (
                  <span className="ml-2 capitalize">{profile.vertical}</span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Created: {new Date(profile.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Profile Details */}
      <div className="flex-1">
        {selectedProfile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {selectedProfile.name || selectedProfile.user_id}
              </h2>
              <button
                onClick={() => setSelectedProfile(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Basic Info</h3>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-gray-600">User ID:</span>{' '}
                    <span className="font-mono">{selectedProfile.user_id}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Role:</span>{' '}
                    <span className="capitalize">{selectedProfile.role || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Vertical:</span>{' '}
                    <span className="capitalize">{selectedProfile.vertical || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tone:</span>{' '}
                    <span className="capitalize">{selectedProfile.tone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Preferences</h3>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-gray-600">Risk Tolerance:</span>{' '}
                    <span className="capitalize">
                      {selectedProfile.risk_tolerance || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">KPI Focus:</span>{' '}
                    <span className="capitalize">{selectedProfile.kpi_focus || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Perspective:</span>{' '}
                    <span className="capitalize">
                      {selectedProfile.perspective || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {selectedProfile.stack && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(selectedProfile.stack).map(([key, value]) =>
                    value ? (
                      <span
                        key={key}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded"
                      >
                        {key}
                      </span>
                    ) : null
                  )}
                </div>
              </div>
            )}

            {selectedProfile.company_context && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Company Context</h3>
                <p className="text-sm text-gray-600">{selectedProfile.company_context}</p>
              </div>
            )}

            {selectedProfile.brand_voice && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Brand Voice</h3>
                <p className="text-sm text-gray-600">{selectedProfile.brand_voice}</p>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Metadata</h3>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-gray-600">Created:</span>{' '}
                  {new Date(selectedProfile.created_at).toLocaleString()}
                </div>
                <div>
                  <span className="text-gray-600">Updated:</span>{' '}
                  {new Date(selectedProfile.updated_at).toLocaleString()}
                </div>
                {selectedProfile.preferred_models && (
                  <div>
                    <span className="text-gray-600">Preferred Models:</span>{' '}
                    {selectedProfile.preferred_models.join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 mt-8">
            <p>Select a profile to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
