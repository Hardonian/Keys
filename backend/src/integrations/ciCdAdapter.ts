import axios from 'axios';

export interface Build {
  id: string;
  number?: number;
  status: 'success' | 'failure' | 'pending' | 'running' | 'cancelled' | 'error';
  branch: string;
  commit: string;
  workflow?: string;
  pipeline?: string;
  startedAt: string;
  completedAt?: string;
  duration?: number; // seconds
  logsUrl?: string;
  author?: string;
  message?: string;
}

export interface BuildLog {
  content: string;
  lines: number;
  errors?: string[];
  warnings?: string[];
}

export type CiCdProvider = 'github_actions' | 'circleci' | 'gitlab_ci' | 'jenkins' | 'custom';

export class CiCdAdapter {
  private apiKey?: string;
  private baseUrl?: string;
  private provider: CiCdProvider;
  private repoUrl?: string;
  private org?: string; // For CircleCI

  constructor() {
    this.provider = (process.env.CI_CD_PROVIDER as CiCdProvider) || 'github_actions';
    this.apiKey = process.env.CIRCLECI_TOKEN || process.env.GITLAB_TOKEN || process.env.GITHUB_TOKEN;
    this.baseUrl = process.env.CI_CD_BASE_URL;
    this.repoUrl = process.env.GITHUB_REPO_URL || process.env.CODE_REPO_URL;
    this.org = process.env.CIRCLECI_ORG;
  }

  /**
   * Get recent builds
   */
  async getRecentBuilds(limit: number = 20, branch?: string): Promise<Build[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      switch (this.provider) {
        case 'github_actions':
          return await this.getGitHubActionsBuilds(limit, branch);
        case 'circleci':
          return await this.getCircleCIBuilds(limit, branch);
        case 'gitlab_ci':
          return await this.getGitLabCIBuilds(limit, branch);
        case 'jenkins':
          return await this.getJenkinsBuilds(limit, branch);
        case 'custom':
          return await this.getCustomBuilds(limit, branch);
        default:
          return [];
      }
    } catch (_error) {
      console.error('Error fetching recent builds:', error);
      return [];
    }
  }

  /**
   * Get build by ID
   */
  async getBuild(buildId: string): Promise<Build | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      switch (this.provider) {
        case 'github_actions':
          return await this.getGitHubActionsBuild(buildId);
        case 'circleci':
          return await this.getCircleCIBuild(buildId);
        case 'gitlab_ci':
          return await this.getGitLabCIBuild(buildId);
        case 'jenkins':
          return await this.getJenkinsBuild(buildId);
        case 'custom':
          return await this.getCustomBuild(buildId);
        default:
          return null;
      }
    } catch (_error) {
      console.error('Error fetching build:', error);
      return null;
    }
  }

  /**
   * Get build logs
   */
  async getBuildLogs(buildId: string): Promise<BuildLog | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      switch (this.provider) {
        case 'github_actions':
          return await this.getGitHubActionsLogs(buildId);
        case 'circleci':
          return await this.getCircleCILogs(buildId);
        case 'gitlab_ci':
          return await this.getGitLabCILogs(buildId);
        case 'jenkins':
          return await this.getJenkinsLogs(buildId);
        case 'custom':
          return await this.getCustomLogs(buildId);
        default:
          return null;
      }
    } catch (_error) {
      console.error('Error fetching build logs:', error);
      return null;
    }
  }

  /**
   * Retry a failed build
   */
  async retryBuild(buildId: string): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      switch (this.provider) {
        case 'github_actions':
          return await this.retryGitHubActionsBuild(buildId);
        case 'circleci':
          return await this.retryCircleCIBuild(buildId);
        case 'gitlab_ci':
          return await this.retryGitLabCIBuild(buildId);
        case 'jenkins':
          return await this.retryJenkinsBuild(buildId);
        case 'custom':
          return await this.retryCustomBuild(buildId);
        default:
          return false;
      }
    } catch (_error) {
      console.error('Error retrying build:', error);
      return false;
    }
  }

  /**
   * Cancel a running build
   */
  async cancelBuild(buildId: string): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      switch (this.provider) {
        case 'github_actions':
          return await this.cancelGitHubActionsBuild(buildId);
        case 'circleci':
          return await this.cancelCircleCIBuild(buildId);
        case 'gitlab_ci':
          return await this.cancelGitLabCIBuild(buildId);
        case 'jenkins':
          return await this.cancelJenkinsBuild(buildId);
        case 'custom':
          return await this.cancelCustomBuild(buildId);
        default:
          return false;
      }
    } catch (_error) {
      console.error('Error cancelling build:', error);
      return false;
    }
  }

  // GitHub Actions Implementation
  private async getGitHubActionsBuilds(limit: number, branch?: string): Promise<Build[]> {
    if (!this.apiKey || !this.repoUrl) return [];

    const url = branch
      ? `https://api.github.com/repos/${this.repoUrl}/actions/runs?branch=${branch}&per_page=${limit}`
      : `https://api.github.com/repos/${this.repoUrl}/actions/runs?per_page=${limit}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    return response.data.workflow_runs.map((run: { id: number; status: string; conclusion: string; created_at: string; updated_at: string; html_url: string }) => ({
      id: run.id.toString(),
      number: run.run_number,
      status: run.conclusion === 'success' ? 'success' :
             run.conclusion === 'failure' ? 'failure' :
             run.conclusion === 'cancelled' ? 'cancelled' :
             run.status === 'in_progress' ? 'running' :
             run.status === 'completed' ? 'error' : 'pending',
      branch: run.head_branch,
      commit: run.head_sha,
      workflow: run.name,
      startedAt: run.created_at,
      completedAt: run.updated_at,
      duration: run.updated_at && run.created_at
        ? (new Date(run.updated_at).getTime() - new Date(run.created_at).getTime()) / 1000
        : undefined,
      logsUrl: run.html_url,
      author: run.actor?.login,
      message: run.head_commit?.message,
    }));
  }

  private async getGitHubActionsBuild(buildId: string): Promise<Build | null> {
    if (!this.apiKey || !this.repoUrl) return null;

    const response = await axios.get(
      `https://api.github.com/repos/${this.repoUrl}/actions/runs/${buildId}`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    const run = response.data;
    return {
      id: run.id.toString(),
      number: run.run_number,
      status: run.conclusion === 'success' ? 'success' :
             run.conclusion === 'failure' ? 'failure' :
             run.conclusion === 'cancelled' ? 'cancelled' :
             run.status === 'in_progress' ? 'running' :
             run.status === 'completed' ? 'error' : 'pending',
      branch: run.head_branch,
      commit: run.head_sha,
      workflow: run.name,
      startedAt: run.created_at,
      completedAt: run.updated_at,
      duration: run.updated_at && run.created_at
        ? (new Date(run.updated_at).getTime() - new Date(run.created_at).getTime()) / 1000
        : undefined,
      logsUrl: run.html_url,
      author: run.actor?.login,
      message: run.head_commit?.message,
    };
  }

  private async getGitHubActionsLogs(buildId: string): Promise<BuildLog | null> {
    if (!this.apiKey || !this.repoUrl) return null;

    try {
      // Get jobs for the run
      const jobsResponse = await axios.get(
        `https://api.github.com/repos/${this.repoUrl}/actions/runs/${buildId}/jobs`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      const jobs = jobsResponse.data.jobs || [];
      const logs: string[] = [];
      const errors: string[] = [];
      const warnings: string[] = [];

      for (const job of jobs) {
        if (job.conclusion === 'failure') {
          // Extract error patterns from job logs
          // Note: GitHub API doesn't provide direct log access, would need to use logs API
          errors.push(`Job ${job.name} failed`);
        }
      }

      return {
        content: logs.join('\n'),
        lines: logs.length,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (_error) {
      console.error('Error fetching GitHub Actions logs:', error);
      return null;
    }
  }

  private async retryGitHubActionsBuild(buildId: string): Promise<boolean> {
    if (!this.apiKey || !this.repoUrl) return false;

    try {
      await axios.post(
        `https://api.github.com/repos/${this.repoUrl}/actions/runs/${buildId}/rerun`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );
      return true;
    } catch (_error) {
      console.error('Error retrying GitHub Actions build:', error);
      return false;
    }
  }

  private async cancelGitHubActionsBuild(buildId: string): Promise<boolean> {
    if (!this.apiKey || !this.repoUrl) return false;

    try {
      await axios.post(
        `https://api.github.com/repos/${this.repoUrl}/actions/runs/${buildId}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );
      return true;
    } catch (_error) {
      console.error('Error cancelling GitHub Actions build:', error);
      return false;
    }
  }

  // CircleCI Implementation
  private async getCircleCIBuilds(limit: number, branch?: string): Promise<Build[]> {
    if (!this.apiKey || !this.org || !this.repoUrl) return [];

    const projectSlug = `github/${this.org}/${this.repoUrl.split('/')[1]}`;
    const url = branch
      ? `https://circleci.com/api/v2/project/${projectSlug}/pipeline?branch=${branch}`
      : `https://circleci.com/api/v2/project/${projectSlug}/pipeline`;

    const response = await axios.get(url, {
      headers: {
        'Circle-Token': this.apiKey,
      },
      params: {
        'page-size': limit,
      },
    });

    return response.data.items.map((pipeline: { id: string; state: string; created_at: string; stopped_at: string }) => ({
      id: pipeline.id,
      status: pipeline.state === 'success' ? 'success' :
             pipeline.state === 'failed' ? 'failure' :
             pipeline.state === 'running' ? 'running' :
             pipeline.state === 'canceled' ? 'cancelled' : 'pending',
      branch: pipeline.vcs.branch,
      commit: pipeline.vcs.revision,
      startedAt: pipeline.created_at,
      completedAt: pipeline.stopped_at,
    }));
  }

  private async getCircleCIBuild(_buildId: string): Promise<Build | null> {
    // CircleCI uses pipeline IDs, would need to fetch pipeline details
    return null;
  }

  private async getCircleCILogs(_buildId: string): Promise<BuildLog | null> {
    return null; // Would need CircleCI logs API
  }

  private async retryCircleCIBuild(_buildId: string): Promise<boolean> {
    return false; // Would need CircleCI retry API
  }

  private async cancelCircleCIBuild(_buildId: string): Promise<boolean> {
    return false; // Would need CircleCI cancel API
  }

  // GitLab CI Implementation
  private async getGitLabCIBuilds(limit: number, branch?: string): Promise<Build[]> {
    if (!this.apiKey || !this.repoUrl) return [];

    const projectId = encodeURIComponent(this.repoUrl);
    const url = branch
      ? `https://gitlab.com/api/v4/projects/${projectId}/pipelines?ref=${branch}&per_page=${limit}`
      : `https://gitlab.com/api/v4/projects/${projectId}/pipelines?per_page=${limit}`;

    const response = await axios.get(url, {
      headers: {
        'PRIVATE-TOKEN': this.apiKey,
      },
    });

    return response.data.map((pipeline: { id: number; status: string; ref: string; sha: string; created_at: string; updated_at: string }) => ({
      id: pipeline.id.toString(),
      status: pipeline.status === 'success' ? 'success' :
             pipeline.status === 'failed' ? 'failure' :
             pipeline.status === 'running' ? 'running' :
             pipeline.status === 'canceled' ? 'cancelled' : 'pending',
      branch: pipeline.ref,
      commit: pipeline.sha,
      startedAt: pipeline.created_at,
      completedAt: pipeline.updated_at,
      logsUrl: pipeline.web_url,
    }));
  }

  private async getGitLabCIBuild(buildId: string): Promise<Build | null> {
    if (!this.apiKey || !this.repoUrl) return null;

    const projectId = encodeURIComponent(this.repoUrl);
    const response = await axios.get(
      `https://gitlab.com/api/v4/projects/${projectId}/pipelines/${buildId}`,
      {
        headers: {
          'PRIVATE-TOKEN': this.apiKey,
        },
      }
    );

    const pipeline = response.data;
    return {
      id: pipeline.id.toString(),
      status: pipeline.status === 'success' ? 'success' :
             pipeline.status === 'failed' ? 'failure' :
             pipeline.status === 'running' ? 'running' :
             pipeline.status === 'canceled' ? 'cancelled' : 'pending',
      branch: pipeline.ref,
      commit: pipeline.sha,
      startedAt: pipeline.created_at,
      completedAt: pipeline.updated_at,
      logsUrl: pipeline.web_url,
    };
  }

  private async getGitLabCILogs(_buildId: string): Promise<BuildLog | null> {
    return null; // Would need GitLab job logs API
  }

  private async retryGitLabCIBuild(buildId: string): Promise<boolean> {
    if (!this.apiKey || !this.repoUrl) return false;

    try {
      const projectId = encodeURIComponent(this.repoUrl);
      await axios.post(
        `https://gitlab.com/api/v4/projects/${projectId}/pipelines/${buildId}/retry`,
        {},
        {
          headers: {
            'PRIVATE-TOKEN': this.apiKey,
          },
        }
      );
      return true;
    } catch (_error) {
      return false;
    }
  }

  private async cancelGitLabCIBuild(buildId: string): Promise<boolean> {
    if (!this.apiKey || !this.repoUrl) return false;

    try {
      const projectId = encodeURIComponent(this.repoUrl);
      await axios.post(
        `https://gitlab.com/api/v4/projects/${projectId}/pipelines/${buildId}/cancel`,
        {},
        {
          headers: {
            'PRIVATE-TOKEN': this.apiKey,
          },
        }
      );
      return true;
    } catch (_error) {
      return false;
    }
  }

  // Jenkins Implementation (stub)
  private async getJenkinsBuilds(_limit: number, _branch?: string): Promise<Build[]> {
    return [];
  }

  private async getJenkinsBuild(_buildId: string): Promise<Build | null> {
    return null;
  }

  private async getJenkinsLogs(_buildId: string): Promise<BuildLog | null> {
    return null;
  }

  private async retryJenkinsBuild(_buildId: string): Promise<boolean> {
    return false;
  }

  private async cancelJenkinsBuild(_buildId: string): Promise<boolean> {
    return false;
  }

  // Custom Implementation
  private async getCustomBuilds(limit: number, branch?: string): Promise<Build[]> {
    if (!this.baseUrl) return [];

    try {
      const response = await axios.get(`${this.baseUrl}/builds`, {
        params: { limit, branch },
        headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
      });

      return response.data.builds || [];
    } catch (_error) {
      return [];
    }
  }

  private async getCustomBuild(buildId: string): Promise<Build | null> {
    if (!this.baseUrl) return null;

    try {
      const response = await axios.get(`${this.baseUrl}/builds/${buildId}`, {
        headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
      });

      return response.data;
    } catch (_error) {
      return null;
    }
  }

  private async getCustomLogs(buildId: string): Promise<BuildLog | null> {
    if (!this.baseUrl) return null;

    try {
      const response = await axios.get(`${this.baseUrl}/builds/${buildId}/logs`, {
        headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
      });

      return response.data;
    } catch (_error) {
      return null;
    }
  }

  private async retryCustomBuild(buildId: string): Promise<boolean> {
    if (!this.baseUrl) return false;

    try {
      await axios.post(`${this.baseUrl}/builds/${buildId}/retry`, {}, {
        headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
      });
      return true;
    } catch (_error) {
      return false;
    }
  }

  private async cancelCustomBuild(buildId: string): Promise<boolean> {
    if (!this.baseUrl) return false;

    try {
      await axios.post(`${this.baseUrl}/builds/${buildId}/cancel`, {}, {
        headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
      });
      return true;
    } catch (_error) {
      return false;
    }
  }
}

export const ciCdAdapter = new CiCdAdapter();
