'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { acceptInvite } from '@/app/dashboard/settings/team-actions';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function handleAccept() {
      if (!token) {
        setStatus('error');
        setMessage('No invitation token found.');
        return;
      }

      const result = await acceptInvite(token);
      if (result.error) {
        setStatus('error');
        setMessage(result.error);
      } else {
        setStatus('success');
        setMessage('You have joined the team.');
        window.dispatchEvent(new Event('workspace-changed'));
      }
    }

    handleAccept();
  }, [token]);

  return (
    <div className="mx-auto max-w-md mt-16">
      <Card className="text-center py-8">
        {status === 'loading' && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Accepting invitation...</p>
        )}
        {status === 'success' && (
          <>
            <p className="text-sm text-green-600 dark:text-green-400 mb-4">{message}</p>
            <Button onClick={() => router.push('/dashboard/settings')}>Go to Settings</Button>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="text-sm text-red-600 dark:text-red-400 mb-4">{message}</p>
            <Button variant="secondary" onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
