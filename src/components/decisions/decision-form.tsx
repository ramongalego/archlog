'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dropdown } from '@/components/ui/dropdown';
import { TiptapEditor } from './tiptap-editor';
import { DraftPreview } from '@/components/ai/draft-preview';
import { toast } from 'sonner';
import {
  CONFIDENCE_LABELS,
  CATEGORY_LABELS,
  type ConfidenceLevel,
  type DecisionCategory,
  type DraftSuggestion,
} from '@/types/decisions';
import type { JSONContent } from '@tiptap/react';

interface ProjectOption {
  id: string;
  name: string;
}

interface DecisionFormProps {
  action: (formData: FormData) => Promise<{ id?: string; error?: string }>;
  projectId: string;
  projects?: ProjectOption[];
  redirectTo?: string;
  initialData?: {
    title: string;
    why: JSONContent | null;
    context: string;
    confidence: ConfidenceLevel;
    category: DecisionCategory;
    custom_category: string;
  };
}

const DRAFT_KEY = 'archlog-draft';

export function DecisionForm({
  action,
  projectId,
  projects,
  redirectTo,
  initialData,
}: DecisionFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [why, setWhy] = useState<JSONContent | null>(initialData?.why ?? null);
  const [context, setContext] = useState(initialData?.context ?? '');
  const [confidence, setConfidence] = useState<ConfidenceLevel>(
    initialData?.confidence ?? 'medium'
  );
  const [category, setCategory] = useState<DecisionCategory>(initialData?.category ?? 'product');
  const [customCategory, setCustomCategory] = useState(initialData?.custom_category ?? '');
  const [selectedProjectId, setSelectedProjectId] = useState(projectId);

  const [rawNote, setRawNote] = useState('');
  const [draftSuggestion, setDraftSuggestion] = useState<DraftSuggestion | null>(null);
  const [isDrafting, setIsDrafting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (!initialData) {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          if (draft.title) setTitle(draft.title);
          if (draft.why) setWhy(draft.why);
          if (draft.context) setContext(draft.context);
          if (draft.confidence) setConfidence(draft.confidence);
          if (draft.category) setCategory(draft.category);
        } catch {
          // ignore corrupt draft
        }
      }
    }
  }, [initialData]);

  const saveDraft = useCallback(() => {
    if (!initialData) {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ title, why, context, confidence, category })
      );
    }
  }, [title, why, context, confidence, category, initialData]);

  useEffect(() => {
    const timer = setTimeout(saveDraft, 1000);
    return () => clearTimeout(timer);
  }, [saveDraft]);

  async function handleAIDraft() {
    if (!rawNote.trim()) return;
    setIsDrafting(true);

    try {
      const res = await fetch('/api/ai/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_note: rawNote }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate draft');
      }

      const data = await res.json();
      setDraftSuggestion(data.suggestion);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate draft');
    } finally {
      setIsDrafting(false);
    }
  }

  function handleAcceptDraft(suggestion: DraftSuggestion) {
    setTitle(suggestion.title);
    setContext(suggestion.context);
    setConfidence(suggestion.confidence);
    setCategory(suggestion.category);
    // Set why as plain text paragraph for Tiptap
    setWhy({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: suggestion.why }] }],
    });
    setDraftSuggestion(null);
    setRawNote('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.warning('Title is required.');
      return;
    }
    setSubmitting(true);

    const formData = new FormData();
    formData.set('project_id', selectedProjectId);
    formData.set('title', title.trim());
    formData.set('why', why ? JSON.stringify(why) : '');
    formData.set('context', context);
    formData.set('confidence', confidence);
    formData.set('category', category);
    if (category === 'other') formData.set('custom_category', customCategory);

    const result = await action(formData);

    if (result.error) {
      toast.error(result.error);
      setSubmitting(false);
    } else {
      toast.success(initialData && !redirectTo ? 'Decision updated.' : 'Decision logged.');
      localStorage.removeItem(DRAFT_KEY);
      router.push(redirectTo ?? `/dashboard/decisions/${result.id}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* AI Draft Section */}
      {!initialData && (
        <div className="space-y-3 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 p-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Quick capture (optional)
          </label>
          <textarea
            value={rawNote}
            onChange={(e) => setRawNote(e.target.value)}
            placeholder="Dump your rough thoughts here and let AI help structure them..."
            className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 transition-colors"
            rows={3}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAIDraft}
            disabled={isDrafting || !rawNote.trim()}
          >
            {isDrafting ? 'Structuring...' : 'Help me structure this'}
          </Button>

          {draftSuggestion && (
            <DraftPreview
              suggestion={draftSuggestion}
              onAccept={handleAcceptDraft}
              onDiscard={() => setDraftSuggestion(null)}
            />
          )}
        </div>
      )}

      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          What was decided <span className="text-red-500">*</span>
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="A clear one-line statement of the decision"
          required
        />
      </div>

      {/* Why (Tiptap) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Why
        </label>
        <TiptapEditor
          key={why ? JSON.stringify(why).slice(0, 50) : 'empty'}
          content={why}
          onChange={setWhy}
          placeholder="The reasoning, alternatives considered, trade-offs..."
        />
      </div>

      {/* Context */}
      <div>
        <label
          htmlFor="context"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Context
        </label>
        <textarea
          id="context"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="What situation prompted this decision?"
          className="mt-1 block w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 transition-colors"
          rows={3}
        />
      </div>

      {/* Confidence & Category */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Confidence
          </label>
          <Dropdown
            value={confidence}
            onChange={(val) => setConfidence(val as ConfidenceLevel)}
            options={Object.entries(CONFIDENCE_LABELS).map(([value, label]) => ({ value, label }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category
          </label>
          <Dropdown
            value={category}
            onChange={(val) => setCategory(val as DecisionCategory)}
            options={Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
          />
        </div>
      </div>

      {/* Project (edit mode only) */}
      {initialData && projects && projects.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Project
          </label>
          <Dropdown
            value={selectedProjectId}
            onChange={(val) => setSelectedProjectId(val)}
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
          />
        </div>
      )}

      {category === 'other' && (
        <div>
          <label
            htmlFor="custom_category"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Custom category
          </label>
          <Input
            id="custom_category"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            placeholder="e.g., Legal, Operations"
          />
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting
            ? 'Saving...'
            : initialData && !redirectTo
              ? 'Update Decision'
              : 'Log Decision'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
