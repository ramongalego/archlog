interface DigestDecision {
  id: string;
  title: string;
  category: string;
  created_at: string;
}

interface DigestReview {
  id: string;
  title: string;
  outcome_due_date: string;
}

export function buildWeeklyDigestHtml(params: {
  displayName: string | null;
  recentDecisions: DigestDecision[];
  pendingReviews: DigestReview[];
  randomDecision: { id: string; title: string; outcome_status: string } | null;
  unsubscribeUrl: string;
}): string {
  const greeting = params.displayName ? `Hi ${params.displayName}` : 'Hi there';

  const recentSection =
    params.recentDecisions.length > 0
      ? `
    <h3 style="margin: 24px 0 8px; font-size: 14px; color: #111;">Decisions this week</h3>
    <ul style="margin: 0; padding: 0 0 0 16px; color: #374151;">
      ${params.recentDecisions.map((d) => `<li style="margin-bottom: 4px; font-size: 14px;">${d.title}</li>`).join('\n      ')}
    </ul>`
      : '<p style="font-size: 14px; color: #6b7280;">No new decisions this week.</p>';

  const reviewSection =
    params.pendingReviews.length > 0
      ? `
    <h3 style="margin: 24px 0 8px; font-size: 14px; color: #111;">Outcomes due for review</h3>
    <ul style="margin: 0; padding: 0 0 0 16px; color: #374151;">
      ${params.pendingReviews.map((d) => `<li style="margin-bottom: 4px; font-size: 14px;">${d.title}</li>`).join('\n      ')}
    </ul>`
      : '';

  const randomSection = params.randomDecision
    ? `
    <h3 style="margin: 24px 0 8px; font-size: 14px; color: #111;">From the archive</h3>
    <p style="font-size: 14px; color: #374151;">"${params.randomDecision.title}" - ${params.randomDecision.outcome_status}</p>`
    : '';

  return `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; padding: 32px;">
  <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 24px; border: 1px solid #e5e7eb;">
    <h2 style="margin: 0 0 16px; font-size: 18px; color: #111;">Your weekly digest</h2>
    <p style="font-size: 14px; color: #374151; margin: 0 0 16px;">${greeting}, here is your week in decisions.</p>

    ${recentSection}
    ${reviewSection}
    ${randomSection}

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
    <p style="font-size: 12px; color: #9ca3af; margin: 0;">
      <a href="${params.unsubscribeUrl}" style="color: #9ca3af;">Unsubscribe</a> from weekly digests.
    </p>
  </div>
</body>
</html>`;
}

export function buildWeeklyDigestText(params: {
  displayName: string | null;
  recentDecisions: DigestDecision[];
  pendingReviews: DigestReview[];
  randomDecision: { id: string; title: string; outcome_status: string } | null;
}): string {
  const greeting = params.displayName ? `Hi ${params.displayName}` : 'Hi there';
  const lines = [`${greeting}, here is your week in decisions.\n`];

  if (params.recentDecisions.length > 0) {
    lines.push('Decisions this week:');
    params.recentDecisions.forEach((d) => lines.push(`  - ${d.title}`));
    lines.push('');
  } else {
    lines.push('No new decisions this week.\n');
  }

  if (params.pendingReviews.length > 0) {
    lines.push('Outcomes due for review:');
    params.pendingReviews.forEach((d) => lines.push(`  - ${d.title}`));
    lines.push('');
  }

  if (params.randomDecision) {
    lines.push(
      `From the archive: "${params.randomDecision.title}" - ${params.randomDecision.outcome_status}`
    );
  }

  return lines.join('\n');
}
