interface ReminderDecision {
  id: string;
  title: string;
  outcome_due_date: string;
}

export function buildOutcomeReminderHtml(params: {
  displayName: string | null;
  decisions: ReminderDecision[];
  baseUrl: string;
}): string {
  const greeting = params.displayName ? `Hi ${params.displayName}` : 'Hi there';
  const count = params.decisions.length;
  const plural = count === 1 ? 'decision is' : 'decisions are';

  return `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; padding: 32px;">
  <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 24px; border: 1px solid #e5e7eb;">
    <h2 style="margin: 0 0 16px; font-size: 18px; color: #111;">Time to check in</h2>
    <p style="font-size: 14px; color: #374151; margin: 0 0 16px;">
      ${greeting}, ${count} ${plural} ready for an outcome review.
    </p>

    <ul style="margin: 0; padding: 0 0 0 16px; color: #374151;">
      ${params.decisions
        .map(
          (d) =>
            `<li style="margin-bottom: 8px; font-size: 14px;">
          <a href="${params.baseUrl}/dashboard/decisions/${d.id}" style="color: #111; text-decoration: underline;">${d.title}</a>
        </li>`
        )
        .join('\n      ')}
    </ul>

    <p style="font-size: 14px; color: #374151; margin: 16px 0 0;">
      What happened? Was the call right, or did things go differently?
    </p>
  </div>
</body>
</html>`;
}

export function buildOutcomeReminderText(params: {
  displayName: string | null;
  decisions: ReminderDecision[];
  baseUrl: string;
}): string {
  const greeting = params.displayName ? `Hi ${params.displayName}` : 'Hi there';
  const count = params.decisions.length;
  const plural = count === 1 ? 'decision is' : 'decisions are';

  const lines = [`${greeting}, ${count} ${plural} ready for an outcome review.\n`];

  params.decisions.forEach((d) => {
    lines.push(`  - ${d.title}`);
    lines.push(`    ${params.baseUrl}/dashboard/decisions/${d.id}`);
  });

  lines.push('\nWhat happened? Was the call right, or did things go differently?');

  return lines.join('\n');
}
