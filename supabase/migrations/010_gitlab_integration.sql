-- GitLab integration: connections table
create table gitlab_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  access_token_encrypted text not null,
  gitlab_username text not null,
  selected_project text,  -- GitLab uses "projects" not "repos"
  last_scan_at timestamptz,
  last_scan_count int,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- RLS
alter table gitlab_connections enable row level security;

create policy "Users can manage their own GitLab connection"
  on gitlab_connections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
