import type { TriggerConfig } from '@trigger.dev/sdk/v3';

export const config: TriggerConfig = {
  project: 'archlog',
  dirs: ['src/jobs'],
  maxDuration: 300,
};
