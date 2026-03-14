'use server';

import { createClient } from '@/lib/supabase/server';
import { friendlyError } from '@/lib/supabase/errors';
import { canCreateProject } from '@/lib/stripe/plans';
import {
  createProjectSchema,
  updateProjectSchema,
  projectIdSchema,
  parseFormData,
} from '@/lib/validation';
import { getActiveWorkspace } from '@/lib/active-workspace';
import type { User, Project } from '@/types/decisions';

export async function createProject(formData: FormData): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const parsed = parseFormData(createProjectSchema, formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, description } = parsed.data;

  const workspace = await getActiveWorkspace();
  let teamId: string | null = null;

  if (workspace.type === 'team') {
    // Only team owner can create team projects
    const { data: team } = await supabase
      .from('teams')
      .select('owner_id')
      .eq('id', workspace.teamId)
      .single();

    if (!team) return { error: 'Team not found' };
    if (team.owner_id !== user.id) {
      return { error: 'Only the team owner can create projects in a team workspace.' };
    }
    teamId = workspace.teamId;
  }

  // Check plan limits
  const { data: profile } = (await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()) as { data: Pick<User, 'subscription_tier'> | null };

  if (!profile) return { error: 'User profile not found' };

  const { count } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_archived', false);

  if (!canCreateProject(profile.subscription_tier, count ?? 0)) {
    return {
      error: 'You have reached the project limit for your plan. Upgrade for unlimited projects.',
    };
  }

  const insertData: Record<string, unknown> = {
    name,
    description: description || null,
  };

  if (teamId) {
    insertData.team_id = teamId;
  } else {
    insertData.user_id = user.id;
  }

  const { data, error } = (await supabase
    .from('projects')
    .insert(insertData as Project)
    .select('id')
    .single()) as { data: { id: string } | null; error: { message: string } | null };

  if (error) return { error: friendlyError(error.message) };
  return { id: data!.id };
}

export async function updateProject(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const parsed = parseFormData(updateProjectSchema, formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { id, name, description } = parsed.data;

  // RLS ensures only the project owner (user or team owner) can update
  const { error } = (await supabase
    .from('projects')
    .update({
      name,
      description: description || null,
    } as Partial<Project>)
    .eq('id', id)) as { error: { message: string } | null };

  if (error) return { error: friendlyError(error.message) };
  return {};
}

export async function archiveProject(projectId: string): Promise<{ error?: string }> {
  const parsed = projectIdSchema.safeParse({ projectId });
  if (!parsed.success) return { error: 'Invalid project ID' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  // Check that we're not archiving the default project
  // RLS ensures only accessible projects are returned
  const { data: project } = (await supabase
    .from('projects')
    .select('is_default, user_id, team_id')
    .eq('id', parsed.data.projectId)
    .single()) as { data: Pick<Project, 'is_default' | 'user_id' | 'team_id'> | null };

  if (!project) return { error: 'Project not found' };
  if (project.is_default) return { error: 'Cannot archive the default project' };

  // Find the default project to move decisions into (personal or team)
  let defaultQuery = supabase.from('projects').select('id').eq('is_default', true);

  if (project.team_id) {
    defaultQuery = defaultQuery.eq('team_id', project.team_id);
  } else {
    defaultQuery = defaultQuery.eq('user_id', user.id);
  }

  const { data: defaultProject } = (await defaultQuery.single()) as {
    data: Pick<Project, 'id'> | null;
  };

  if (!defaultProject) return { error: 'No default project found' };

  // Move all decisions from archived project to default (RLS handles access)
  const { error: moveError } = (await supabase
    .from('decisions')
    .update({ project_id: defaultProject.id })
    .eq('project_id', parsed.data.projectId)) as { error: { message: string } | null };

  if (moveError) return { error: friendlyError(moveError.message) };

  // Archive the project (RLS handles access)
  const { error } = (await supabase
    .from('projects')
    .update({ is_archived: true } as Partial<Project>)
    .eq('id', parsed.data.projectId)) as { error: { message: string } | null };

  if (error) return { error: friendlyError(error.message) };
  return {};
}

export async function setDefaultProject(projectId: string): Promise<{ error?: string }> {
  const parsed = projectIdSchema.safeParse({ projectId });
  if (!parsed.success) return { error: 'Invalid project ID' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  // Verify the project exists and isn't archived (RLS handles access)
  const { data: project } = (await supabase
    .from('projects')
    .select('is_archived, user_id, team_id')
    .eq('id', parsed.data.projectId)
    .single()) as { data: Pick<Project, 'is_archived' | 'user_id' | 'team_id'> | null };

  if (!project) return { error: 'Project not found' };
  if (project.is_archived) return { error: 'Cannot set an archived project as default' };

  // Unset current default within the same ownership scope
  let unsetQuery = supabase
    .from('projects')
    .update({ is_default: false } as Partial<Project>)
    .eq('is_default', true);

  if (project.team_id) {
    unsetQuery = unsetQuery.eq('team_id', project.team_id);
  } else {
    unsetQuery = unsetQuery.eq('user_id', user.id);
  }

  const { error: unsetError } = (await unsetQuery) as { error: { message: string } | null };

  if (unsetError) return { error: friendlyError(unsetError.message) };

  // Set new default (RLS handles access)
  const { error } = (await supabase
    .from('projects')
    .update({ is_default: true } as Partial<Project>)
    .eq('id', parsed.data.projectId)) as { error: { message: string } | null };

  if (error) return { error: friendlyError(error.message) };
  return {};
}

export async function deleteProject(projectId: string): Promise<{ error?: string }> {
  const parsed = projectIdSchema.safeParse({ projectId });
  if (!parsed.success) return { error: 'Invalid project ID' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  // Only allow deleting archived projects (decisions already moved)
  // RLS ensures only accessible projects are returned
  const { data: project } = (await supabase
    .from('projects')
    .select('is_archived, is_default')
    .eq('id', parsed.data.projectId)
    .single()) as { data: Pick<Project, 'is_archived' | 'is_default'> | null };

  if (!project) return { error: 'Project not found' };
  if (project.is_default) return { error: 'Cannot delete the default project' };
  if (!project.is_archived) return { error: 'Archive the project before deleting it' };

  // RLS handles access control
  const { error } = (await supabase.from('projects').delete().eq('id', parsed.data.projectId)) as {
    error: { message: string } | null;
  };

  if (error) return { error: friendlyError(error.message) };
  return {};
}
