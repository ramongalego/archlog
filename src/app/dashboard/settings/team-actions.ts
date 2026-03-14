'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { friendlyError } from '@/lib/supabase/errors';
import { signInviteToken, verifyInviteToken } from '@/lib/team/invite-token';
import { sendEmail } from '@/lib/email/send';
import { buildTeamInviteHtml, buildTeamInviteText } from '@/lib/email/templates/team-invite';
import type { Team, TeamMember, Project } from '@/types/decisions';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://archlog.app';

async function resetWorkspaceIfTeam(teamId: string) {
  const cookieStore = await cookies();
  const active = cookieStore.get('active_workspace')?.value;
  if (active === `team:${teamId}`) {
    cookieStore.set('active_workspace', 'personal', { path: '/', maxAge: 60 * 60 * 24 * 365 });
  }
}

export async function createTeam(name: string): Promise<{ id?: string; error?: string }> {
  if (!name || name.trim().length === 0) return { error: 'Team name is required' };
  if (name.length > 100) return { error: 'Team name must be under 100 characters' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  // Only team-tier users can create teams
  const { data: profile } = await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();

  if (!profile || profile.subscription_tier !== 'team') {
    return { error: 'Upgrade to the Team plan to create a team.' };
  }

  // Create team
  const { data: team, error: teamError } = (await supabase
    .from('teams')
    .insert({ name: name.trim(), owner_id: user.id } as Team)
    .select('id')
    .single()) as { data: { id: string } | null; error: { message: string } | null };

  if (teamError) {
    console.error('createTeam insert failed:', teamError.message);
    return { error: friendlyError(teamError.message) };
  }

  // Add owner as accepted member
  const { error: memberError } = (await supabase.from('team_members').insert({
    team_id: team!.id,
    user_id: user.id,
    email: user.email!,
    role: 'owner',
    status: 'accepted',
    accepted_at: new Date().toISOString(),
  } as TeamMember)) as { error: { message: string } | null };

  if (memberError) {
    console.error('createTeam member insert failed:', memberError.message);
    // Roll back: delete the team to avoid orphaned row without an owner member
    await supabase.from('teams').delete().eq('id', team!.id);
    return { error: friendlyError(memberError.message) };
  }

  // Create default team project (like "My Decisions" for personal users)
  const { error: projectError } = (await supabase.from('projects').insert({
    team_id: team!.id,
    name: 'Team Decisions',
    is_default: true,
  } as Project)) as { error: { message: string } | null };

  if (projectError) {
    console.error('createTeam default project failed:', projectError.message);
    // Non-fatal: team was created, project can be created later
  }

  return { id: team!.id };
}

export async function renameTeam(teamId: string, name: string): Promise<{ error?: string }> {
  if (!name || name.trim().length === 0) return { error: 'Team name is required' };
  if (name.length > 100) return { error: 'Team name must be under 100 characters' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { data: team } = (await supabase
    .from('teams')
    .select('owner_id')
    .eq('id', teamId)
    .single()) as { data: Pick<Team, 'owner_id'> | null };

  if (!team || team.owner_id !== user.id) {
    return { error: 'Only the team owner can rename the team' };
  }

  const { error } = (await supabase
    .from('teams')
    .update({ name: name.trim() } as Partial<Team>)
    .eq('id', teamId)) as { error: { message: string } | null };

  if (error) return { error: friendlyError(error.message) };
  return {};
}

export async function inviteTeamMember(teamId: string, email: string): Promise<{ error?: string }> {
  if (!email || !email.includes('@')) return { error: 'Please enter a valid email address' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  // Verify user is team owner
  const { data: team } = (await supabase
    .from('teams')
    .select('id, name, owner_id')
    .eq('id', teamId)
    .single()) as { data: Pick<Team, 'id' | 'name' | 'owner_id'> | null };

  if (!team) return { error: 'Team not found' };
  if (team.owner_id !== user.id) return { error: 'Only the team owner can invite members' };

  // Enforce 5-member limit (includes owner and pending invites)
  const { count: memberCount } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', teamId);

  if ((memberCount ?? 0) >= 5) {
    return { error: 'Team is at the 5-member limit. Remove a member to invite someone new.' };
  }

  // Check if already invited
  const { data: existing } = (await supabase
    .from('team_members')
    .select('id, status')
    .eq('team_id', teamId)
    .eq('email', email.toLowerCase())
    .maybeSingle()) as { data: Pick<TeamMember, 'id' | 'status'> | null };

  if (existing) {
    return {
      error:
        existing.status === 'accepted'
          ? 'This person is already a team member'
          : 'An invitation has already been sent to this email',
    };
  }

  // Create pending member row
  const { error: insertError } = (await supabase.from('team_members').insert({
    team_id: teamId,
    email: email.toLowerCase(),
    role: 'member',
    status: 'pending',
  } as TeamMember)) as { error: { message: string } | null };

  if (insertError) return { error: friendlyError(insertError.message) };

  // Generate invite token and send email
  const token = await signInviteToken({ team_id: teamId, email: email.toLowerCase() });
  const acceptUrl = `${BASE_URL}/dashboard/team/accept?token=${encodeURIComponent(token)}`;

  // Get inviter display name
  const { data: profile } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', user.id)
    .single();

  try {
    await sendEmail({
      to: email.toLowerCase(),
      subject: `You're invited to join ${team.name} on ArchLog`,
      html: buildTeamInviteHtml({
        teamName: team.name,
        inviterName: profile?.display_name ?? null,
        acceptUrl,
      }),
      text: buildTeamInviteText({
        teamName: team.name,
        inviterName: profile?.display_name ?? null,
        acceptUrl,
      }),
    });
  } catch {
    // Invitation row was already created; email failure is non-fatal
    console.error('Failed to send invite email to', email);
  }

  return {};
}

export async function removeTeamMember(
  teamId: string,
  memberId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  // Verify ownership
  const { data: team } = (await supabase
    .from('teams')
    .select('owner_id')
    .eq('id', teamId)
    .single()) as { data: Pick<Team, 'owner_id'> | null };

  if (!team || team.owner_id !== user.id)
    return { error: 'Only the team owner can remove members' };

  // Don't allow removing self (owner) — use dissolveTeam instead
  const { data: member } = (await supabase
    .from('team_members')
    .select('user_id, role')
    .eq('id', memberId)
    .eq('team_id', teamId)
    .single()) as { data: Pick<TeamMember, 'user_id' | 'role'> | null };

  if (!member) return { error: 'Member not found' };
  if (member.role === 'owner') return { error: 'Cannot remove the team owner' };

  const { error } = (await supabase
    .from('team_members')
    .delete()
    .eq('id', memberId)
    .eq('team_id', teamId)) as { error: { message: string } | null };

  if (error) return { error: friendlyError(error.message) };
  return {};
}

export async function leaveTeam(teamId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  // Verify not the owner
  const { data: team } = (await supabase
    .from('teams')
    .select('owner_id')
    .eq('id', teamId)
    .single()) as { data: Pick<Team, 'owner_id'> | null };

  if (!team) return { error: 'Team not found' };
  if (team.owner_id === user.id)
    return { error: 'The team owner cannot leave. Dissolve the team instead.' };

  const { error } = (await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', user.id)) as { error: { message: string } | null };

  if (error) return { error: friendlyError(error.message) };

  // Reset workspace to personal if the left team was active
  await resetWorkspaceIfTeam(teamId);

  return {};
}

export async function dissolveTeam(teamId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  // Verify ownership
  const { data: team } = (await supabase
    .from('teams')
    .select('owner_id')
    .eq('id', teamId)
    .single()) as { data: Pick<Team, 'owner_id'> | null };

  if (!team || team.owner_id !== user.id)
    return { error: 'Only the team owner can dissolve the team' };

  // Delete team (CASCADE deletes team_members and team projects)
  const { error } = (await supabase.from('teams').delete().eq('id', teamId)) as {
    error: { message: string } | null;
  };

  if (error) return { error: friendlyError(error.message) };

  // Reset workspace to personal if the dissolved team was active
  await resetWorkspaceIfTeam(teamId);

  return {};
}

export async function acceptInvite(token: string): Promise<{ error?: string; teamId?: string }> {
  const payload = await verifyInviteToken(token);
  if (!payload) return { error: 'Invalid or expired invitation link' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Please log in to accept this invitation' };

  // Verify email matches
  if (user.email?.toLowerCase() !== payload.email.toLowerCase()) {
    return { error: 'This invitation was sent to a different email address' };
  }

  // Find the pending invite
  const { data: member } = (await supabase
    .from('team_members')
    .select('id, status')
    .eq('team_id', payload.team_id)
    .eq('email', payload.email.toLowerCase())
    .single()) as { data: Pick<TeamMember, 'id' | 'status'> | null };

  if (!member) return { error: 'Invitation not found. It may have been revoked.' };
  if (member.status === 'accepted')
    return { error: 'You have already accepted this invitation', teamId: payload.team_id };

  // Accept: link user_id and set status
  const { error } = (await supabase
    .from('team_members')
    .update({
      user_id: user.id,
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    } as Partial<TeamMember>)
    .eq('id', member.id)) as { error: { message: string } | null };

  if (error) return { error: friendlyError(error.message) };
  return { teamId: payload.team_id };
}

export async function getPendingInvites(): Promise<{
  invites: { id: string; team_id: string; team_name: string; invited_at: string }[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return { invites: [] };

  const { data: pending } = (await supabase
    .from('team_members')
    .select('id, team_id, invited_at')
    .eq('email', user.email.toLowerCase())
    .eq('status', 'pending')) as {
    data: Pick<TeamMember, 'id' | 'team_id' | 'invited_at'>[] | null;
  };

  if (!pending || pending.length === 0) return { invites: [] };

  const teamIds = pending.map((p) => p.team_id);
  const { data: teams } = (await supabase.from('teams').select('id, name').in('id', teamIds)) as {
    data: Pick<Team, 'id' | 'name'>[] | null;
  };

  const teamMap = new Map<string, string>();
  for (const t of teams ?? []) {
    teamMap.set(t.id, t.name);
  }

  return {
    invites: pending
      .filter((p) => teamMap.has(p.team_id))
      .map((p) => ({
        id: p.id,
        team_id: p.team_id,
        team_name: teamMap.get(p.team_id)!,
        invited_at: p.invited_at ?? new Date().toISOString(),
      })),
  };
}

export async function acceptInviteById(
  memberId: string
): Promise<{ error?: string; teamId?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Please log in to accept this invitation' };

  // Find the pending invite — RLS ensures only matching email rows are visible
  const { data: member } = (await supabase
    .from('team_members')
    .select('id, team_id, email, status')
    .eq('id', memberId)
    .single()) as { data: Pick<TeamMember, 'id' | 'team_id' | 'email' | 'status'> | null };

  if (!member) return { error: 'Invitation not found. It may have been revoked.' };
  if (member.status === 'accepted')
    return { error: 'You have already accepted this invitation', teamId: member.team_id };

  // Defense in depth: verify email matches
  if (user.email?.toLowerCase() !== member.email.toLowerCase()) {
    return { error: 'This invitation was sent to a different email address' };
  }

  const { error } = (await supabase
    .from('team_members')
    .update({
      user_id: user.id,
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    } as Partial<TeamMember>)
    .eq('id', member.id)) as { error: { message: string } | null };

  if (error) return { error: friendlyError(error.message) };
  return { teamId: member.team_id };
}

export type TeamMemberWithName = TeamMember & { display_name: string | null };

export async function getTeamsForUser(): Promise<{
  owned: (Team & { members: TeamMemberWithName[] })[];
  memberships: (Team & { members: TeamMemberWithName[] })[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { owned: [], memberships: [] };

  // Get all teams the user belongs to
  const { data: myMemberships } = (await supabase
    .from('team_members')
    .select('team_id, role')
    .eq('user_id', user.id)
    .eq('status', 'accepted')) as { data: Pick<TeamMember, 'team_id' | 'role'>[] | null };

  if (!myMemberships || myMemberships.length === 0) return { owned: [], memberships: [] };

  const teamIds = myMemberships.map((m) => m.team_id);
  const ownedTeamIds = myMemberships.filter((m) => m.role === 'owner').map((m) => m.team_id);

  // Get team details
  const { data: teams } = (await supabase.from('teams').select('*').in('id', teamIds)) as {
    data: Team[] | null;
  };

  if (!teams) return { owned: [], memberships: [] };

  // Get all members for these teams
  const { data: allMembers } = (await supabase
    .from('team_members')
    .select('*')
    .in('team_id', teamIds)) as { data: TeamMember[] | null };

  // Fetch display names for accepted members (those with user_id)
  const userIds = (allMembers ?? []).filter((m) => m.user_id).map((m) => m.user_id!);

  const displayNameMap = new Map<string, string | null>();
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, display_name')
      .in('id', userIds);

    for (const u of users ?? []) {
      displayNameMap.set(u.id, u.display_name);
    }
  }

  const membersByTeam = new Map<string, TeamMemberWithName[]>();
  for (const m of allMembers ?? []) {
    const list = membersByTeam.get(m.team_id) ?? [];
    list.push({
      ...m,
      display_name: m.user_id ? (displayNameMap.get(m.user_id) ?? null) : null,
    });
    membersByTeam.set(m.team_id, list);
  }

  const owned: (Team & { members: TeamMemberWithName[] })[] = [];
  const memberships: (Team & { members: TeamMemberWithName[] })[] = [];

  for (const team of teams) {
    const teamWithMembers = { ...team, members: membersByTeam.get(team.id) ?? [] };
    if (ownedTeamIds.includes(team.id)) {
      owned.push(teamWithMembers);
    } else {
      memberships.push(teamWithMembers);
    }
  }

  return { owned, memberships };
}
