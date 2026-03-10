-- GitHub integration: connections + suggested decisions

-- Store GitHub OAuth connections per user
create table github_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  access_token_encrypted text not null,
  github_username text not null,
  selected_repo text, -- "owner/repo" format
  last_scan_at timestamptz,
  last_scan_count int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create trigger update_github_connections_updated_at
  before update on github_connections
  for each row execute function update_updated_at();

-- Suggested decisions extracted from GitHub PRs
create type suggestion_status as enum ('pending', 'accepted', 'dismissed');

create table suggested_decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  github_connection_id uuid not null references github_connections(id) on delete cascade,
  pr_url text not null,
  pr_number int not null,
  pr_title text not null,
  pr_author text,
  pr_body text,
  extracted_title text not null,
  extracted_reasoning text not null,
  extracted_alternatives text,
  confidence text not null default 'medium', -- high, medium, low
  status suggestion_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, pr_url) -- prevent duplicate suggestions for same PR
);

create trigger update_suggested_decisions_updated_at
  before update on suggested_decisions
  for each row execute function update_updated_at();

create index idx_suggested_decisions_user_status on suggested_decisions(user_id, status);
create index idx_suggested_decisions_project on suggested_decisions(project_id);

-- RLS policies
alter table github_connections enable row level security;
alter table suggested_decisions enable row level security;

create policy "Users can manage their own GitHub connections"
  on github_connections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their own suggested decisions"
  on suggested_decisions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
