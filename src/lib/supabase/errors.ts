export function friendlyError(message: string): string {
  if (message.includes('projects_user_id_name_key'))
    return 'A project with that name already exists.';
  if (message.includes('unique constraint')) return 'That name is already taken.';
  if (message.includes('row-level security')) return 'You do not have permission to do that.';
  if (message.includes('violates foreign key'))
    return 'This item is referenced elsewhere and cannot be changed.';
  if (message.includes('not found')) return 'Could not find that item. It may have been deleted.';
  return 'Something went wrong. Please try again.';
}
