const GITLAB_API = 'https://gitlab.com/api/v4';

interface GitLabProject {
  id: number;
  path_with_namespace: string;
  name: string;
  visibility: string;
  description: string | null;
}

interface GitLabMR {
  iid: number;
  title: string;
  description: string | null;
  web_url: string;
  author: { username: string } | null;
  merged_at: string | null;
}

interface GitLabUser {
  username: string;
}

async function glFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${GITLAB_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitLab API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export async function getGitLabUser(token: string): Promise<GitLabUser> {
  return glFetch<GitLabUser>('/user', token);
}

export async function getProjects(token: string): Promise<GitLabProject[]> {
  // Fetch projects the user is a member of, sorted by most recently active
  return glFetch<GitLabProject[]>(
    '/projects?membership=true&order_by=last_activity_at&sort=desc&per_page=100',
    token
  );
}

export async function getMergedMRs(
  token: string,
  projectPath: string,
  limit = 50
): Promise<GitLabMR[]> {
  const encodedPath = encodeURIComponent(projectPath);
  return glFetch<GitLabMR[]>(
    `/projects/${encodedPath}/merge_requests?state=merged&order_by=updated_at&sort=desc&per_page=${limit}`,
    token
  );
}

export type { GitLabProject, GitLabMR, GitLabUser };
