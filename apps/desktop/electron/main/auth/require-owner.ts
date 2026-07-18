import { AuthSession } from './auth-session';

/** Every local-data IPC handler scopes its query by this — shared so the check and its error
 *  message stay identical across projects/goals/tasks-ipc.ts rather than drifting. */
export function requireOwnerId(authSession: AuthSession): string {
  const user = authSession.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}
