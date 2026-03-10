const GITHUB_API = 'https://api.github.com';

interface GitHubRepo {
  full_name: string;
  name: string;
  owner: { login: string };
  private: boolean;
  description: string | null;
}

interface GitHubPR {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  user: { login: string } | null;
  merged_at: string | null;
}

interface GitHubUser {
  login: string;
}

async function ghFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export async function getGitHubUser(token: string): Promise<GitHubUser> {
  return ghFetch<GitHubUser>('/user', token);
}

export async function getRepos(token: string): Promise<GitHubRepo[]> {
  // Fetch repos the user has access to, sorted by most recently pushed
  return ghFetch<GitHubRepo[]>(
    '/user/repos?sort=pushed&direction=desc&per_page=100&type=all',
    token
  );
}

export async function getMergedPRs(token: string, repo: string, limit = 50): Promise<GitHubPR[]> {
  // Fetch closed PRs, then filter to merged only
  const prs = await ghFetch<GitHubPR[]>(
    `/repos/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=${limit}`,
    token
  );

  return prs.filter((pr) => pr.merged_at !== null);
}

export type { GitHubRepo, GitHubPR, GitHubUser };
