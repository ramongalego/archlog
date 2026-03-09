'use server';

import { createClient } from '@/lib/supabase/server';
import { friendlyError } from '@/lib/supabase/errors';
import { canCreateProject } from '@/lib/stripe/plans';
import type { User, Project } from '@/types/decisions';

export async function createProject(formData: FormData): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;

  if (!name?.trim()) return { error: 'Project name is required' };

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
      error:
        'You have reached the project limit for your plan. Upgrade to Pro for unlimited projects.',
    };
  }

  const { data, error } = (await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: name.trim(),
      description: description?.trim() || null,
    } as Project)
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

  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;

  if (!id) return { error: 'Project ID is required' };
  if (!name?.trim()) return { error: 'Project name is required' };

  const { error } = (await supabase
    .from('projects')
    .update({
      name: name.trim(),
      description: description?.trim() || null,
    } as Partial<Project>)
    .eq('id', id)
    .eq('user_id', user.id)) as { error: { message: string } | null };

  if (error) return { error: friendlyError(error.message) };
  return {};
}

export async function archiveProject(projectId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  // Check that we're not archiving the default project
  const { data: project } = (await supabase
    .from('projects')
    .select('is_default')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()) as { data: Pick<Project, 'is_default'> | null };

  if (!project) return { error: 'Project not found' };
  if (project.is_default) return { error: 'Cannot archive the default project' };

  // Find the default project to move decisions into
  const { data: defaultProject } = (await supabase
    .from('projects')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_default', true)
    .single()) as { data: Pick<Project, 'id'> | null };

  if (!defaultProject) return { error: 'No default project found' };

  // Move all decisions from archived project to default
  const { error: moveError } = (await supabase
    .from('decisions')
    .update({ project_id: defaultProject.id } as Partial<Project>)
    .eq('project_id', projectId)
    .eq('user_id', user.id)) as { error: { message: string } | null };

  if (moveError) return { error: friendlyError(moveError.message) };

  // Archive the project
  const { error } = (await supabase
    .from('projects')
    .update({ is_archived: true } as Partial<Project>)
    .eq('id', projectId)
    .eq('user_id', user.id)) as { error: { message: string } | null };

  if (error) return { error: friendlyError(error.message) };
  return {};
}

export async function setDefaultProject(projectId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  // Verify the project exists, belongs to user, and isn't archived
  const { data: project } = (await supabase
    .from('projects')
    .select('is_archived')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()) as { data: Pick<Project, 'is_archived'> | null };

  if (!project) return { error: 'Project not found' };
  if (project.is_archived) return { error: 'Cannot set an archived project as default' };

  // Unset current default
  const { error: unsetError } = (await supabase
    .from('projects')
    .update({ is_default: false } as Partial<Project>)
    .eq('user_id', user.id)
    .eq('is_default', true)) as { error: { message: string } | null };

  if (unsetError) return { error: friendlyError(unsetError.message) };

  // Set new default
  const { error } = (await supabase
    .from('projects')
    .update({ is_default: true } as Partial<Project>)
    .eq('id', projectId)
    .eq('user_id', user.id)) as { error: { message: string } | null };

  if (error) return { error: friendlyError(error.message) };
  return {};
}

export async function deleteProject(projectId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  // Only allow deleting archived projects (decisions already moved)
  const { data: project } = (await supabase
    .from('projects')
    .select('is_archived, is_default')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()) as { data: Pick<Project, 'is_archived' | 'is_default'> | null };

  if (!project) return { error: 'Project not found' };
  if (project.is_default) return { error: 'Cannot delete the default project' };
  if (!project.is_archived) return { error: 'Archive the project before deleting it' };

  const { error } = (await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', user.id)) as { error: { message: string } | null };

  if (error) return { error: friendlyError(error.message) };
  return {};
}
