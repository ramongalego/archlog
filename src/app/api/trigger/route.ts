// Trigger.dev v4 runs tasks on the Trigger.dev platform, not via a Next.js route.
// This file exists as a placeholder. Deploy tasks with: npx trigger.dev deploy
//
// If you need to manually invoke a task from your app, import and call it directly:
//   import { weeklyDigestTask } from '@/jobs/weekly-digest';
//   await weeklyDigestTask.trigger();

export async function POST() {
  return new Response(JSON.stringify({ error: 'Use trigger.dev CLI to manage tasks' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}
