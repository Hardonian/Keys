'use client';

import React, { useState } from 'react';
import type { AgentOutput } from '@/types';
import { apiService } from '@/services/api';

interface ApprovalFlowProps {
  output: AgentOutput;
  runId?: string;
  onApproved?: () => void;
  onRejected?: () => void;
  onRevised?: () => void;
}

export function ApprovalFlow({
  output,
  runId,
  onApproved,
  onRejected,
  onRevised,
}: ApprovalFlowProps) {
  const [loading, setLoading] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editedContent, setEditedContent] = useState(output.content);

  const handleApprove = async () => {
    if (!runId) return;

    try {
      setLoading(true);
      await apiService.submitFeedback(runId, 'approved');
      onApproved?.();
    } catch (error) {
      console.error('Error approving:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!runId) return;

    try {
      setLoading(true);
      await apiService.submitFeedback(runId, 'rejected');
      onRejected?.();
    } catch (error) {
      console.error('Error rejecting:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevise = async () => {
    if (!runId) return;

    try {
      setLoading(true);
      await apiService.submitFeedback(runId, 'revised', JSON.stringify(editedContent));
      onRevised?.();
      setShowEditForm(false);
    } catch (error) {
      console.error('Error submitting revision:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderEditableContent = () => {
    if (typeof editedContent === 'string') {
      return (
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm"
          rows={10}
        />
      );
    }

    const content = editedContent as Record<string, unknown>;
    return (
      <div className="space-y-3">
        {output.editableFields.map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium mb-1 capitalize">
              {field.replace('_', ' ')}
            </label>
            {field === 'steps' ? (
              <textarea
                value={JSON.stringify(content[field] || [], null, 2)}
                onChange={(e) => {
                  try {
                    setEditedContent({
                      ...content,
                      [field]: JSON.parse(e.target.value),
                    });
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm"
                rows={8}
              />
            ) : (
              <input
                type="text"
                value={typeof content[field] === 'string' ? content[field] as string : String(content[field] || '')}
                onChange={(e) =>
                  setEditedContent({ ...content, [field]: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  if (!output.requiresApproval) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 pt-4 mt-4">
      {!showEditForm ? (
        <div className="flex gap-2">
          <button
            onClick={handleApprove}
            disabled={loading}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Processing...' : 'Approve'}
          </button>
          <button
            onClick={() => setShowEditForm(true)}
            disabled={loading}
            className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Reject
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Edit Content</h4>
            {renderEditableContent()}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRevise}
              disabled={loading}
              className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : 'Save Revision'}
            </button>
            <button
              onClick={() => {
                setShowEditForm(false);
                setEditedContent(output.content);
              }}
              disabled={loading}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
