-- Add source tracking to suggested_decisions and make GitHub-specific columns nullable

-- Source column: where did this suggestion come from?
alter table suggested_decisions add column source text not null default 'github';

-- Make GitHub-specific columns nullable so other sources can use the table
alter table suggested_decisions alter column github_connection_id drop not null;
alter table suggested_decisions alter column pr_url drop not null;
alter table suggested_decisions alter column pr_number drop not null;
alter table suggested_decisions alter column pr_title drop not null;

-- Drop the unique constraint on (user_id, pr_url) and recreate it as partial
-- so it only applies when pr_url is not null
alter table suggested_decisions drop constraint suggested_decisions_user_id_pr_url_key;
create unique index idx_suggested_decisions_user_pr_url
  on suggested_decisions(user_id, pr_url) where pr_url is not null;

-- Index on source for filtering
create index idx_suggested_decisions_source on suggested_decisions(source);
