'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase/client';

export default function ExtensionAuthPage() {
  const searchParams = useSearchParams();
  const { user, session } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuth = async () => {
      const state = searchParams.get('state');
      const extensionId = searchParams.get('extension_id');

      if (!state || !extensionId) {
        setStatus('error');
        setMessage('Missing required parameters');
        return;
      }

      if (!user || !session) {
        setStatus('error');
        setMessage('Please sign in first');
        return;
      }

      try {
        // Verify state matches
        const storedState = localStorage.getItem('extension_auth_state');
        if (storedState !== state) {
          setStatus('error');
          setMessage('Invalid state parameter');
          return;
        }

        // Send token to extension
        const token = session.access_token;
        const expiresIn = session.expires_in || 3600;

        // Send message to extension
        // Note: This requires the extension to be listening for messages
        // In a real implementation, you'd use chrome.runtime.sendMessage
        // For now, we'll use postMessage to the opener window
        
        if (window.opener) {
          window.opener.postMessage({
            type: 'AUTH_SUCCESS',
            state,
            token,
            expiresIn,
          }, '*');
        }

        // Also try to send via chrome.runtime if available
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage(extensionId, {
            type: 'AUTH_SUCCESS',
            state,
            token,
            expiresIn,
          });
        }

        setStatus('success');
        setMessage('Authentication successful! You can close this window.');
        
        // Close window after 2 seconds
        setTimeout(() => {
          window.close();
        }, 2000);
      } catch (error) {
        console.error('Auth error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Authentication failed');
      }
    };

    handleAuth();
  }, [searchParams, user, session]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4">
      <div className="text-center max-w-md">
        {status === 'loading' && (
          <>
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Authenticating extension...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Success!</h2>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">✕</div>
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Error</h2>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
