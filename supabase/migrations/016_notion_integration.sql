-- Notion integration: connections table
create table notion_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  access_token_encrypted text not null,
  notion_workspace_name text not null,
  last_scan_at timestamptz,
  last_scan_count int,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create trigger update_notion_connections_updated_at
  before update on notion_connections
  for each row execute function update_updated_at();

-- RLS
alter table notion_connections enable row level security;

create policy "Users can manage their own Notion connection"
  on notion_connections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
