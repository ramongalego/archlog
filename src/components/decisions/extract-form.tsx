'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { extractFromText } from '@/app/dashboard/decisions/extract/actions';

interface ExtractFormProps {
  projectId: string;
}

export function ExtractForm({ projectId }: ExtractFormProps) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [extracting, setExtracting] = useState(false);

  async function handleExtract() {
    if (!text.trim()) {
      toast.warning('Paste some text first.');
      return;
    }

    setExtracting(true);
    try {
      const result = await extractFromText(text, projectId);

      if (result.error) {
        toast.error(result.error);
      } else if (result.found === 0) {
        toast.info('No decisions found in this text.', {
          description: 'Try pasting text with more context about choices that were made.',
        });
      } else {
        toast.success(
          `${result.found} decision${result.found !== 1 ? 's' : ''} found — review them now`
        );
        router.push('/dashboard/suggestions');
      }
    } catch {
      toast.error('Extraction failed. Please try again.');
    } finally {
      setExtracting(false);
    }
  }

  const charCount = text.length;
  const charLimit = 5000;

  return (
    <div className="space-y-4">
      <div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, charLimit))}
          placeholder="Paste your text here..."
          className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 transition-colors"
          rows={16}
        />
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 text-right">
          {charCount.toLocaleString()} / {charLimit.toLocaleString()}
        </p>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleExtract} disabled={extracting || !text.trim()}>
          {extracting ? 'Extracting...' : 'Find decisions'}
        </Button>
        <Button variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
