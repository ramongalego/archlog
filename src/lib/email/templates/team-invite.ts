export function buildTeamInviteHtml(params: {
  teamName: string;
  inviterName: string | null;
  acceptUrl: string;
}): string {
  const inviter = params.inviterName ?? 'A teammate';

  return `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; padding: 32px;">
  <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 24px; border: 1px solid #e5e7eb;">
    <h2 style="margin: 0 0 16px; font-size: 18px; color: #111;">You're invited to a team</h2>
    <p style="font-size: 14px; color: #374151; margin: 0 0 16px;">
      ${inviter} invited you to join <strong>${params.teamName}</strong> on ArchLog.
    </p>
    <a href="${params.acceptUrl}" style="display: inline-block; background: #111; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">
      Accept invitation
    </a>
    <p style="font-size: 12px; color: #9ca3af; margin: 16px 0 0;">
      This invitation expires in 7 days. If you don't have an ArchLog account, you'll be able to sign up first.
    </p>
  </div>
</body>
</html>`;
}

export function buildTeamInviteText(params: {
  teamName: string;
  inviterName: string | null;
  acceptUrl: string;
}): string {
  const inviter = params.inviterName ?? 'A teammate';

  return [
    `${inviter} invited you to join "${params.teamName}" on ArchLog.`,
    '',
    `Accept the invitation: ${params.acceptUrl}`,
    '',
    'This invitation expires in 7 days.',
  ].join('\n');
}
