'use client';

import { useState, useOptimistic, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { UpgradeModal } from '@/components/ui/upgrade-modal';
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
  team_id: string | null;
  decision_count: number;
  team_name?: string;
}

export function ProjectActions({
  personalProjects,
  teamProjects,
  tier,
}: {
  personalProjects: ProjectItem[];
  teamProjects: ProjectItem[];
  tier: string;
}) {
  const router = useRouter();
  const [optimisticPersonal, addOptimisticPersonal] = useOptimistic(
    personalProjects,
    (
      state: ProjectItem[],
      action:
        | { type: 'create'; project: ProjectItem }
        | { type: 'archive'; id: string }
        | { type: 'delete'; id: string }
        | { type: 'set_default'; id: string }
    ) => {
      if (action.type === 'create') return [...state, action.project];
      if (action.type === 'archive')
        return state.map((p) => (p.id === action.id ? { ...p, is_archived: true } : p));
      if (action.type === 'delete') return state.filter((p) => p.id !== action.id);
      if (action.type === 'set_default') {
        return state.map((p) => ({ ...p, is_default: p.id === action.id }));
      }
      return state;
    }
  );
  const [optimisticTeam, addOptimisticTeam] = useOptimistic(
    teamProjects,
    (
      state: ProjectItem[],
      action:
        | { type: 'create'; project: ProjectItem }
        | { type: 'archive'; id: string }
        | { type: 'delete'; id: string }
        | { type: 'set_default'; id: string }
    ) => {
      if (action.type === 'create') return [...state, action.project];
      if (action.type === 'archive')
        return state.map((p) => (p.id === action.id ? { ...p, is_archived: true } : p));
      if (action.type === 'delete') return state.filter((p) => p.id !== action.id);
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
  const [showUpgrade, setShowUpgrade] = useState(false);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    setCreating(true);

    const formData = new FormData();
    formData.set('name', newName.trim());
    formData.set('description', newDescription.trim());

    const workspaceCookie = document.cookie.match(/(?:^| )active_workspace=([^;]*)/)?.[1] ?? 'personal';
    const isTeamWorkspace = workspaceCookie.startsWith('team%3A') || workspaceCookie.startsWith('team:');

    const optimisticProject: ProjectItem = {
      id: `temp-${Date.now()}`,
      name: newName.trim(),
      description: newDescription.trim() || null,
      is_default: false,
      is_archived: false,
      team_id: isTeamWorkspace ? 'pending' : null,
      decision_count: 0,
    };
    setNewName('');
    setNewDescription('');

    startTransition(async () => {
      if (isTeamWorkspace) {
        addOptimisticTeam({ type: 'create', project: optimisticProject });
      } else {
        addOptimisticPersonal({ type: 'create', project: optimisticProject });
      }
      const result = await createProject(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Project created.');
        window.dispatchEvent(new Event('project-changed'));
        router.refresh();
      }

      setCreating(false);
    });
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

  function handleArchive(projectId: string, isTeam: boolean) {
    setArchivingId(null);
    startTransition(async () => {
      if (isTeam) {
        addOptimisticTeam({ type: 'archive', id: projectId });
      } else {
        addOptimisticPersonal({ type: 'archive', id: projectId });
      }
      const result = await archiveProject(projectId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.info('Project archived. Decisions moved to default project.');
        window.dispatchEvent(new Event('project-changed'));
        router.refresh();
      }
    });
  }

  function handleSetDefault(projectId: string, isTeam: boolean) {
    startTransition(async () => {
      if (isTeam) {
        addOptimisticTeam({ type: 'set_default', id: projectId });
      } else {
        addOptimisticPersonal({ type: 'set_default', id: projectId });
      }
      const result = await setDefaultProject(projectId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Default project updated.');
        router.refresh();
      }
    });
  }

  function handleDelete(projectId: string, isTeam: boolean) {
    setDeletingId(null);
    startTransition(async () => {
      if (isTeam) {
        addOptimisticTeam({ type: 'delete', id: projectId });
      } else {
        addOptimisticPersonal({ type: 'delete', id: projectId });
      }
      const result = await deleteProject(projectId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.info('Project deleted.');
        window.dispatchEvent(new Event('project-changed'));
        router.refresh();
      }
    });
  }

  // Which list does the project being acted on belong to?
  const archivingProject = archivingId
    ? [...optimisticPersonal, ...optimisticTeam].find((p) => p.id === archivingId)
    : null;
  const deletingProject = deletingId
    ? [...optimisticPersonal, ...optimisticTeam].find((p) => p.id === deletingId)
    : null;

  return (
    <div className="space-y-8">
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

      {/* Personal projects */}
      <section>
        <div className="flex items-end justify-between mb-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Personal projects
          </h2>
          {tier === 'free' && (
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-xs text-red-500 dark:text-red-400">
                {optimisticPersonal.filter((p) => !p.is_archived).length}/1 Projects
              </span>
              <button
                type="button"
                onClick={() => setShowUpgrade(true)}
                className="cursor-pointer text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 underline underline-offset-2 transition-colors"
              >
                Upgrade for unlimited
              </button>
            </div>
          )}
        </div>
        <div className="space-y-3">
          {optimisticPersonal.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500">No personal projects yet.</p>
          )}
          {optimisticPersonal.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              editingId={editingId}
              editName={editName}
              editDescription={editDescription}
              setEditingId={setEditingId}
              setEditName={setEditName}
              setEditDescription={setEditDescription}
              onRename={handleRename}
              onSetDefault={(id) => handleSetDefault(id, false)}
              onArchive={(id) => setArchivingId(id)}
              onDelete={(id) => setDeletingId(id)}
            />
          ))}
        </div>
      </section>

      {/* Team projects */}
      {optimisticTeam.length > 0 && (
        <section>
          <h2 className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
            Team projects
          </h2>
          <div className="space-y-3">
            {optimisticTeam.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                editingId={editingId}
                editName={editName}
                editDescription={editDescription}
                setEditingId={setEditingId}
                setEditName={setEditName}
                setEditDescription={setEditDescription}
                onRename={handleRename}
                onSetDefault={(id) => handleSetDefault(id, true)}
                onArchive={(id) => setArchivingId(id)}
                onDelete={(id) => setDeletingId(id)}
              />
            ))}
          </div>
        </section>
      )}

      <ConfirmModal
        open={archivingId !== null}
        title="Archive this project?"
        description="Its decisions will be moved to the default project. You can't undo this."
        confirmLabel="Archive"
        variant="danger"
        onConfirm={() =>
          archivingId && handleArchive(archivingId, archivingProject?.team_id !== null)
        }
        onCancel={() => setArchivingId(null)}
      />
      <ConfirmModal
        open={deletingId !== null}
        title="Delete this project?"
        description="This will permanently remove the project. Its decisions were already moved when it was archived."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => deletingId && handleDelete(deletingId, deletingProject?.team_id !== null)}
        onCancel={() => setDeletingId(null)}
      />
      <UpgradeModal
        open={showUpgrade}
        currentTier="free"
        onUpgrade={() => {}}
        onClose={() => setShowUpgrade(false)}
      />
    </div>
  );
}

function ProjectCard({
  project: p,
  editingId,
  editName,
  editDescription,
  setEditingId,
  setEditName,
  setEditDescription,
  onRename,
  onSetDefault,
  onArchive,
  onDelete,
}: {
  project: ProjectItem;
  editingId: string | null;
  editName: string;
  editDescription: string;
  setEditingId: (id: string | null) => void;
  setEditName: (name: string) => void;
  setEditDescription: (desc: string) => void;
  onRename: (id: string) => void;
  onSetDefault: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className={p.id.startsWith('temp-') ? 'opacity-60' : ''}>
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
            <Button size="sm" onClick={() => onRename(p.id)}>
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
              {p.team_name && (
                <Badge className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                  {p.team_name}
                </Badge>
              )}
            </div>
            {p.description && (
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{p.description}</p>
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
                  <Button size="sm" variant="ghost" onClick={() => onSetDefault(p.id)}>
                    Set as default
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onArchive(p.id)}>
                    Archive
                  </Button>
                </>
              )}
            </div>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => onDelete(p.id)}>
              Delete
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
