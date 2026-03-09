'use client';

import { useState, useOptimistic, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import {
  createProject,
  updateProject,
  archiveProject,
  deleteProject,
  setDefaultProject,
} from './actions';

interface ProjectItem {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  is_archived: boolean;
  decision_count: number;
}

export function ProjectActions({ projects }: { projects: ProjectItem[] }) {
  const router = useRouter();
  const [optimisticProjects, addOptimistic] = useOptimistic(
    projects,
    (
      state: ProjectItem[],
      action:
        | { type: 'create'; project: ProjectItem }
        | { type: 'archive'; id: string }
        | { type: 'set_default'; id: string }
    ) => {
      if (action.type === 'create') return [...state, action.project];
      if (action.type === 'archive') return state.filter((p) => p.id !== action.id);
      if (action.type === 'set_default') {
        return state.map((p) => ({ ...p, is_default: p.id === action.id }));
      }
      return state;
    }
  );
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    setCreating(true);

    const formData = new FormData();
    formData.set('name', newName.trim());
    formData.set('description', newDescription.trim());

    const optimisticProject: ProjectItem = {
      id: `temp-${Date.now()}`,
      name: newName.trim(),
      description: newDescription.trim() || null,
      is_default: false,
      is_archived: false,
      decision_count: 0,
    };
    addOptimistic({ type: 'create', project: optimisticProject });
    setNewName('');
    setNewDescription('');

    const result = await createProject(formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Project created.');
      router.refresh();
    }

    setCreating(false);
  }

  async function handleRename(projectId: string) {
    if (!editName.trim()) return;

    const formData = new FormData();
    formData.set('id', projectId);
    formData.set('name', editName.trim());
    formData.set('description', editDescription.trim());

    const result = await updateProject(formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Project updated.');
      setEditingId(null);
      router.refresh();
    }
  }

  function handleArchive(projectId: string) {
    setArchivingId(null);
    startTransition(async () => {
      addOptimistic({ type: 'archive', id: projectId });
      const result = await archiveProject(projectId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Project archived. Decisions moved to default project.');
        router.refresh();
      }
    });
  }

  function handleSetDefault(projectId: string) {
    startTransition(async () => {
      addOptimistic({ type: 'set_default', id: projectId });
      const result = await setDefaultProject(projectId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Default project updated.');
        router.refresh();
      }
    });
  }

  function handleDelete(projectId: string) {
    setDeletingId(null);
    startTransition(async () => {
      addOptimistic({ type: 'archive', id: projectId });
      const result = await deleteProject(projectId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Project deleted.');
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Create new project */}
      <Card>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">New project</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Project name"
          />
          <Input
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description (optional)"
          />
          <Button type="submit" size="sm" disabled={creating || !newName.trim()}>
            {creating ? 'Creating...' : 'Create project'}
          </Button>
        </form>
      </Card>

      {/* Project list */}
      <div className="space-y-2">
        {optimisticProjects.map((p) => (
          <Card key={p.id} className={p.id.startsWith('temp-') ? 'opacity-60' : ''}>
            {editingId === p.id ? (
              <div className="space-y-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Project name"
                />
                <Input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Description (optional)"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleRename(p.id)}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.name}</p>
                    {p.is_default && (
                      <Badge className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                        Default
                      </Badge>
                    )}
                    {p.is_archived && (
                      <Badge className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400">
                        Archived
                      </Badge>
                    )}
                  </div>
                  {p.description && (
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {p.description}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                    {p.decision_count} {p.decision_count === 1 ? 'decision' : 'decisions'}
                  </p>
                </div>

                {!p.is_archived ? (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(p.id);
                        setEditName(p.name);
                        setEditDescription(p.description ?? '');
                      }}
                    >
                      Rename
                    </Button>
                    {!p.is_default && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => handleSetDefault(p.id)}>
                          Set as default
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setArchivingId(p.id)}>
                          Archive
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setDeletingId(p.id)}>
                    Delete
                  </Button>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
      <ConfirmModal
        open={archivingId !== null}
        title="Archive this project?"
        description="Its decisions will be moved to the default project. You can't undo this."
        confirmLabel="Archive"
        variant="danger"
        onConfirm={() => archivingId && handleArchive(archivingId)}
        onCancel={() => setArchivingId(null)}
      />
      <ConfirmModal
        open={deletingId !== null}
        title="Delete this project?"
        description="This will permanently remove the project. Its decisions were already moved when it was archived."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => deletingId && handleDelete(deletingId)}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
