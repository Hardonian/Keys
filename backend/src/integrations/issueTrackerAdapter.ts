import axios from 'axios';

export interface Issue {
  id: string;
  key?: string; // For Jira
  number?: number; // For GitHub/Linear
  title: string;
  body?: string;
  state: 'open' | 'closed' | 'in_progress' | 'done';
  author: string;
  assignees?: string[];
  labels?: string[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
  url?: string;
}

export interface IssueComment {
  id: string;
  body: string;
  author: string;
  created_at: string;
}

export type IssueTrackerProvider = 'github' | 'jira' | 'linear';

export class IssueTrackerAdapter {
  private apiKey?: string;
  private baseUrl?: string;
  private provider: IssueTrackerProvider;
  private workspace?: string; // For Linear
  private project?: string; // For Jira

  constructor() {
    this.provider = (process.env.ISSUE_TRACKER_PROVIDER as IssueTrackerProvider) || 'github';
    this.apiKey = process.env.ISSUE_TRACKER_API_KEY || process.env.GITHUB_TOKEN;
    this.baseUrl = process.env.ISSUE_TRACKER_BASE_URL;
    this.workspace = process.env.LINEAR_WORKSPACE;
    this.project = process.env.JIRA_PROJECT;
  }

  /**
   * Fetch an issue by ID/number/key
   */
  async fetchIssue(issueId: string | number): Promise<Issue | null> {
    if (!this.apiKey) {
      console.warn('Issue tracker credentials not configured');
      return null;
    }

    try {
      switch (this.provider) {
        case 'github':
          return await this.fetchGitHubIssue(issueId as number);
        case 'jira':
          return await this.fetchJiraIssue(issueId as string);
        case 'linear':
          return await this.fetchLinearIssue(issueId as string);
        default:
          return null;
      }
    } catch (error) {
      console.error('Error fetching issue:', error);
      return null;
    }
  }

  /**
   * Get recent issues
   */
  async getRecentIssues(limit: number = 20, state?: 'open' | 'closed'): Promise<Issue[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      switch (this.provider) {
        case 'github':
          return await this.getGitHubIssues(limit, state);
        case 'jira':
          return await this.getJiraIssues(limit, state);
        case 'linear':
          return await this.getLinearIssues(limit, state);
        default:
          return [];
      }
    } catch (error) {
      console.error('Error fetching recent issues:', error);
      return [];
    }
  }

  /**
   * Check if issue is stale (no activity for X days)
   */
  async isIssueStale(issueId: string | number, daysThreshold: number = 7): Promise<boolean> {
    const issue = await this.fetchIssue(issueId);
    if (!issue || issue.state === 'closed' || issue.state === 'done') {
      return false;
    }

    const lastUpdate = new Date(issue.updated_at);
    const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceUpdate > daysThreshold;
  }

  /**
   * Get comments for an issue
   */
  async getIssueComments(issueId: string | number): Promise<IssueComment[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      switch (this.provider) {
        case 'github':
          return await this.getGitHubIssueComments(issueId as number);
        case 'jira':
          return await this.getJiraIssueComments(issueId as string);
        case 'linear':
          return await this.getLinearIssueComments(issueId as string);
        default:
          return [];
      }
    } catch (error) {
      console.error('Error fetching issue comments:', error);
      return [];
    }
  }

  // GitHub Implementation
  private async fetchGitHubIssue(issueNumber: number): Promise<Issue | null> {
    const repoUrl = process.env.GITHUB_REPO_URL || process.env.CODE_REPO_URL;
    if (!repoUrl) return null;

    const url = `https://api.github.com/repos/${repoUrl}/issues/${issueNumber}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    const issue = response.data;
    return {
      id: issue.id.toString(),
      number: issue.number,
      title: issue.title,
      body: issue.body,
      state: issue.state === 'closed' ? 'closed' : 'open',
      author: issue.user?.login || '',
      assignees: issue.assignees?.map((a: any) => a.login) || [],
      labels: issue.labels?.map((l: any) => l.name) || [],
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      url: issue.html_url,
    };
  }

  private async getGitHubIssues(limit: number, state?: 'open' | 'closed'): Promise<Issue[]> {
    const repoUrl = process.env.GITHUB_REPO_URL || process.env.CODE_REPO_URL;
    if (!repoUrl) return [];

    const stateParam = state || 'all';
    const url = `https://api.github.com/repos/${repoUrl}/issues?state=${stateParam}&per_page=${limit}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    return response.data
      .filter((issue: any) => !issue.pull_request) // Exclude PRs
      .map((issue: any) => ({
        id: issue.id.toString(),
        number: issue.number,
        title: issue.title,
        body: issue.body,
        state: issue.state === 'closed' ? 'closed' : 'open',
        author: issue.user?.login || '',
        assignees: issue.assignees?.map((a: any) => a.login) || [],
        labels: issue.labels?.map((l: any) => l.name) || [],
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        url: issue.html_url,
      }));
  }

  private async getGitHubIssueComments(issueNumber: number): Promise<IssueComment[]> {
    const repoUrl = process.env.GITHUB_REPO_URL || process.env.CODE_REPO_URL;
    if (!repoUrl) return [];

    const url = `https://api.github.com/repos/${repoUrl}/issues/${issueNumber}/comments`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    return response.data.map((comment: any) => ({
      id: comment.id.toString(),
      body: comment.body,
      author: comment.user?.login || '',
      created_at: comment.created_at,
    }));
  }

  // Jira Implementation
  private async fetchJiraIssue(issueKey: string): Promise<Issue | null> {
    if (!this.baseUrl || !this.apiKey) return null;

    const url = `${this.baseUrl}/rest/api/3/issue/${issueKey}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.JIRA_EMAIL}:${this.apiKey}`).toString('base64')}`,
        Accept: 'application/json',
      },
    });

    const issue = response.data;
    return {
      id: issue.id,
      key: issue.key,
      title: issue.fields.summary,
      body: issue.fields.description,
      state: issue.fields.status.statusCategory.key === 'done' ? 'done' :
             issue.fields.status.statusCategory.key === 'indeterminate' ? 'in_progress' : 'open',
      author: issue.fields.creator?.displayName || '',
      assignees: issue.fields.assignee ? [issue.fields.assignee.displayName] : [],
      labels: issue.fields.labels || [],
      priority: this.mapJiraPriority(issue.fields.priority?.name),
      created_at: issue.fields.created,
      updated_at: issue.fields.updated,
      url: `${this.baseUrl}/browse/${issue.key}`,
    };
  }

  private async getJiraIssues(limit: number, state?: 'open' | 'closed'): Promise<Issue[]> {
    if (!this.baseUrl || !this.apiKey || !this.project) return [];

    const jql = state === 'closed' 
      ? `project = ${this.project} AND status = Done ORDER BY updated DESC`
      : `project = ${this.project} AND status != Done ORDER BY updated DESC`;

    const url = `${this.baseUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=${limit}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.JIRA_EMAIL}:${this.apiKey}`).toString('base64')}`,
        Accept: 'application/json',
      },
    });

    return response.data.issues.map((issue: any) => ({
      id: issue.id,
      key: issue.key,
      title: issue.fields.summary,
      body: issue.fields.description,
      state: issue.fields.status.statusCategory.key === 'done' ? 'done' :
             issue.fields.status.statusCategory.key === 'indeterminate' ? 'in_progress' : 'open',
      author: issue.fields.creator?.displayName || '',
      assignees: issue.fields.assignee ? [issue.fields.assignee.displayName] : [],
      labels: issue.fields.labels || [],
      priority: this.mapJiraPriority(issue.fields.priority?.name),
      created_at: issue.fields.created,
      updated_at: issue.fields.updated,
      url: `${this.baseUrl}/browse/${issue.key}`,
    }));
  }

  private async getJiraIssueComments(issueKey: string): Promise<IssueComment[]> {
    if (!this.baseUrl || !this.apiKey) return [];

    const url = `${this.baseUrl}/rest/api/3/issue/${issueKey}/comment`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.JIRA_EMAIL}:${this.apiKey}`).toString('base64')}`,
        Accept: 'application/json',
      },
    });

    return response.data.comments.map((comment: any) => ({
      id: comment.id,
      body: comment.body,
      author: comment.author.displayName,
      created_at: comment.created,
    }));
  }

  private mapJiraPriority(priority?: string): 'low' | 'medium' | 'high' | 'critical' | undefined {
    if (!priority) return undefined;
    const lower = priority.toLowerCase();
    if (lower.includes('critical') || lower.includes('highest')) return 'critical';
    if (lower.includes('high')) return 'high';
    if (lower.includes('medium')) return 'medium';
    return 'low';
  }

  // Linear Implementation
  private async fetchLinearIssue(issueId: string): Promise<Issue | null> {
    if (!this.apiKey || !this.workspace) return null;

    const query = `
      query GetIssue($id: String!) {
        issue(id: $id) {
          id
          identifier
          title
          description
          state {
            name
            type
          }
          creator {
            name
          }
          assignee {
            name
          }
          labels {
            nodes {
              name
            }
          }
          priority
          createdAt
          updatedAt
          url
        }
      }
    `;

    const response = await axios.post(
      'https://api.linear.app/graphql',
      { query, variables: { id: issueId } },
      {
        headers: {
          Authorization: this.apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    const issue = response.data.data?.issue;
    if (!issue) return null;

    return {
      id: issue.id,
      number: parseInt(issue.identifier.split('-')[1]),
      title: issue.title,
      body: issue.description,
      state: issue.state.type === 'completed' ? 'done' :
             issue.state.type === 'started' ? 'in_progress' : 'open',
      author: issue.creator?.name || '',
      assignees: issue.assignee ? [issue.assignee.name] : [],
      labels: issue.labels?.nodes?.map((l: any) => l.name) || [],
      priority: this.mapLinearPriority(issue.priority),
      created_at: issue.createdAt,
      updated_at: issue.updatedAt,
      url: issue.url,
    };
  }

  private async getLinearIssues(limit: number, state?: 'open' | 'closed'): Promise<Issue[]> {
    if (!this.apiKey || !this.workspace) return [];

    const stateFilter = state === 'closed' 
      ? '{ state: { type: { eq: completed } } }'
      : '{ state: { type: { neq: completed } } }';

    const query = `
      query GetIssues($filter: IssueFilter, $first: Int!) {
        issues(filter: $filter, first: $first, orderBy: updatedAt) {
          nodes {
            id
            identifier
            title
            description
            state {
              name
              type
            }
            creator {
              name
            }
            assignee {
              name
            }
            labels {
              nodes {
                name
              }
            }
            priority
            createdAt
            updatedAt
            url
          }
        }
      }
    `;

    const response = await axios.post(
      'https://api.linear.app/graphql',
      { 
        query, 
        variables: { 
          filter: JSON.parse(stateFilter),
          first: limit,
        },
      },
      {
        headers: {
          Authorization: this.apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    const issues = response.data.data?.issues?.nodes || [];
    return issues.map((issue: any) => ({
      id: issue.id,
      number: parseInt(issue.identifier.split('-')[1]),
      title: issue.title,
      body: issue.description,
      state: issue.state.type === 'completed' ? 'done' :
             issue.state.type === 'started' ? 'in_progress' : 'open',
      author: issue.creator?.name || '',
      assignees: issue.assignee ? [issue.assignee.name] : [],
      labels: issue.labels?.nodes?.map((l: any) => l.name) || [],
      priority: this.mapLinearPriority(issue.priority),
      created_at: issue.createdAt,
      updated_at: issue.updatedAt,
      url: issue.url,
    }));
  }

  private async getLinearIssueComments(issueId: string): Promise<IssueComment[]> {
    if (!this.apiKey) return [];

    const query = `
      query GetIssueComments($issueId: String!) {
        issue(id: $issueId) {
          comments {
            nodes {
              id
              body
              user {
                name
              }
              createdAt
            }
          }
        }
      }
    `;

    const response = await axios.post(
      'https://api.linear.app/graphql',
      { query, variables: { issueId } },
      {
        headers: {
          Authorization: this.apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    const comments = response.data.data?.issue?.comments?.nodes || [];
    return comments.map((comment: any) => ({
      id: comment.id,
      body: comment.body,
      author: comment.user?.name || '',
      created_at: comment.createdAt,
    }));
  }

  private mapLinearPriority(priority?: number): 'low' | 'medium' | 'high' | 'critical' | undefined {
    if (priority === undefined || priority === null) return undefined;
    if (priority >= 4) return 'critical';
    if (priority >= 3) return 'high';
    if (priority >= 2) return 'medium';
    return 'low';
  }
}

export const issueTrackerAdapter = new IssueTrackerAdapter();
