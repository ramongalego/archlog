-- Add extracted_category to suggested_decisions so AI can suggest a category
alter table suggested_decisions
  add column extracted_category text not null default 'technical';
