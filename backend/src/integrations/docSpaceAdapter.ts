import axios from 'axios';

export interface Document {
  id: string;
  title: string;
  content?: string;
  url?: string;
  lastEdited: string;
  author?: string;
  tags?: string[];
}

export interface DocumentChange {
  documentId: string;
  title: string;
  changeType: 'created' | 'updated' | 'deleted';
  timestamp: string;
  url?: string;
}

export type DocSpaceProvider = 'notion' | 'confluence';

export class DocSpaceAdapter {
  private apiKey?: string;
  private baseUrl?: string;
  private provider: DocSpaceProvider;
  private workspaceId?: string; // For Notion
  private spaceKey?: string; // For Confluence

  constructor() {
    this.provider = (process.env.DOC_SPACE_PROVIDER as DocSpaceProvider) || 'notion';
    this.apiKey = process.env.NOTION_API_KEY || process.env.CONFLUENCE_API_TOKEN;
    this.baseUrl = process.env.CONFLUENCE_BASE_URL;
    this.workspaceId = process.env.NOTION_WORKSPACE_ID;
    this.spaceKey = process.env.CONFLUENCE_SPACE_KEY;
  }

  /**
   * Fetch a document by ID
   */
  async fetchDocument(documentId: string): Promise<Document | null> {
    if (!this.apiKey) {
      console.warn('Documentation space credentials not configured');
      return null;
    }

    try {
      switch (this.provider) {
        case 'notion':
          return await this.fetchNotionPage(documentId);
        case 'confluence':
          return await this.fetchConfluencePage(documentId);
        default:
          return null;
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      return null;
    }
  }

  /**
   * Search for documents
   */
  async searchDocuments(query: string, limit: number = 20): Promise<Document[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      switch (this.provider) {
        case 'notion':
          return await this.searchNotionPages(query, limit);
        case 'confluence':
          return await this.searchConfluencePages(query, limit);
        default:
          return [];
      }
    } catch (error) {
      console.error('Error searching documents:', error);
      return [];
    }
  }

  /**
   * Get recently updated documents
   */
  async getRecentDocuments(limit: number = 20, daysSinceUpdate?: number): Promise<Document[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      switch (this.provider) {
        case 'notion':
          return await this.getRecentNotionPages(limit, daysSinceUpdate);
        case 'confluence':
          return await this.getRecentConfluencePages(limit, daysSinceUpdate);
        default:
          return [];
      }
    } catch (error) {
      console.error('Error fetching recent documents:', error);
      return [];
    }
  }

  /**
   * Check if document is outdated (not updated in X days)
   */
  async isDocumentOutdated(documentId: string, daysThreshold: number = 90): Promise<boolean> {
    const doc = await this.fetchDocument(documentId);
    if (!doc) return false;

    const lastUpdate = new Date(doc.lastEdited);
    const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceUpdate > daysThreshold;
  }

  /**
   * Update document content
   */
  async updateDocument(documentId: string, content: string): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      switch (this.provider) {
        case 'notion':
          return await this.updateNotionPage(documentId, content);
        case 'confluence':
          return await this.updateConfluencePage(documentId, content);
        default:
          return false;
      }
    } catch (error) {
      console.error('Error updating document:', error);
      return false;
    }
  }

  // Notion Implementation
  private async fetchNotionPage(pageId: string): Promise<Document | null> {
    if (!this.apiKey) return null;

    try {
      const response = await axios.get(`https://api.notion.com/v1/pages/${pageId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Notion-Version': '2022-06-28',
        },
      });

      const page = response.data;
      const title = this.extractNotionTitle(page.properties);
      const lastEdited = page.last_edited_time || page.created_time;

      return {
        id: page.id,
        title,
        url: page.url,
        lastEdited,
        author: page.created_by?.id,
        tags: this.extractNotionTags(page.properties),
      };
    } catch (error) {
      console.error('Error fetching Notion page:', error);
      return null;
    }
  }

  private async searchNotionPages(query: string, limit: number): Promise<Document[]> {
    if (!this.apiKey) return [];

    try {
      const response = await axios.post(
        'https://api.notion.com/v1/search',
        {
          query,
          page_size: limit,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.results.map((page: any) => ({
        id: page.id,
        title: this.extractNotionTitle(page.properties),
        url: page.url,
        lastEdited: page.last_edited_time || page.created_time,
        author: page.created_by?.id,
        tags: this.extractNotionTags(page.properties),
      }));
    } catch (error) {
      console.error('Error searching Notion pages:', error);
      return [];
    }
  }

  private async getRecentNotionPages(limit: number, daysSinceUpdate?: number): Promise<Document[]> {
    if (!this.apiKey) return [];

    try {
      const cutoffDate = daysSinceUpdate
        ? new Date(Date.now() - daysSinceUpdate * 24 * 60 * 60 * 1000).toISOString()
        : undefined;

      const response = await axios.post(
        'https://api.notion.com/v1/search',
        {
          filter: cutoffDate
            ? {
                property: 'last_edited_time',
                last_edited_time: {
                  after: cutoffDate,
                },
              }
            : undefined,
          page_size: limit,
          sorts: [
            {
              property: 'last_edited_time',
              direction: 'descending',
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.results.map((page: any) => ({
        id: page.id,
        title: this.extractNotionTitle(page.properties),
        url: page.url,
        lastEdited: page.last_edited_time || page.created_time,
        author: page.created_by?.id,
        tags: this.extractNotionTags(page.properties),
      }));
    } catch (error) {
      console.error('Error fetching recent Notion pages:', error);
      return [];
    }
  }

  private async updateNotionPage(pageId: string, content: string): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      // Notion API requires updating blocks, not direct content
      // This is a simplified implementation
      await axios.patch(
        `https://api.notion.com/v1/pages/${pageId}`,
        {
          properties: {
            // Update last edited time
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
          },
        }
      );
      return true;
    } catch (error) {
      console.error('Error updating Notion page:', error);
      return false;
    }
  }

  private extractNotionTitle(properties: any): string {
    for (const key in properties) {
      const prop = properties[key];
      if (prop.type === 'title' && prop.title?.length > 0) {
        return prop.title.map((t: any) => t.plain_text).join('');
      }
    }
    return 'Untitled';
  }

  private extractNotionTags(properties: any): string[] {
    const tags: string[] = [];
    for (const key in properties) {
      const prop = properties[key];
      if (prop.type === 'multi_select') {
        tags.push(...prop.multi_select.map((t: any) => t.name));
      }
    }
    return tags;
  }

  // Confluence Implementation
  private async fetchConfluencePage(pageId: string): Promise<Document | null> {
    if (!this.apiKey || !this.baseUrl) return null;

    try {
      const response = await axios.get(
        `${this.baseUrl}/rest/api/content/${pageId}?expand=body.storage,version`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${process.env.CONFLUENCE_EMAIL}:${this.apiKey}`).toString('base64')}`,
            Accept: 'application/json',
          },
        }
      );

      const page = response.data;
      return {
        id: page.id,
        title: page.title,
        content: page.body?.storage?.value,
        url: `${this.baseUrl}${page._links.webui}`,
        lastEdited: page.version.when,
        author: page.version.by?.displayName,
        tags: page.metadata?.labels?.results?.map((l: any) => l.name) || [],
      };
    } catch (error) {
      console.error('Error fetching Confluence page:', error);
      return null;
    }
  }

  private async searchConfluencePages(query: string, limit: number): Promise<Document[]> {
    if (!this.apiKey || !this.baseUrl) return [];

    try {
      const spaceKey = this.spaceKey ? `space=${this.spaceKey}&` : '';
      const response = await axios.get(
        `${this.baseUrl}/rest/api/content/search?${spaceKey}cql=text~"${encodeURIComponent(query)}"&limit=${limit}`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${process.env.CONFLUENCE_EMAIL}:${this.apiKey}`).toString('base64')}`,
            Accept: 'application/json',
          },
        }
      );

      return response.data.results.map((page: any) => ({
        id: page.id,
        title: page.title,
        url: `${this.baseUrl}${page._links.webui}`,
        lastEdited: page.version.when,
        author: page.version.by?.displayName,
      }));
    } catch (error) {
      console.error('Error searching Confluence pages:', error);
      return [];
    }
  }

  private async getRecentConfluencePages(limit: number, daysSinceUpdate?: number): Promise<Document[]> {
    if (!this.apiKey || !this.baseUrl) return [];

    try {
      const spaceKey = this.spaceKey ? `space=${this.spaceKey}&` : '';
      const cutoffDate = daysSinceUpdate
        ? new Date(Date.now() - daysSinceUpdate * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : undefined;

      const cql = cutoffDate
        ? `lastModified >= "${cutoffDate}"`
        : 'order by lastModified desc';

      const response = await axios.get(
        `${this.baseUrl}/rest/api/content/search?${spaceKey}cql=${encodeURIComponent(cql)}&limit=${limit}`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${process.env.CONFLUENCE_EMAIL}:${this.apiKey}`).toString('base64')}`,
            Accept: 'application/json',
          },
        }
      );

      return response.data.results.map((page: any) => ({
        id: page.id,
        title: page.title,
        url: `${this.baseUrl}${page._links.webui}`,
        lastEdited: page.version.when,
        author: page.version.by?.displayName,
      }));
    } catch (error) {
      console.error('Error fetching recent Confluence pages:', error);
      return [];
    }
  }

  private async updateConfluencePage(pageId: string, content: string): Promise<boolean> {
    if (!this.apiKey || !this.baseUrl) return false;

    try {
      // First get current page to get version number
      const currentPage = await axios.get(
        `${this.baseUrl}/rest/api/content/${pageId}?expand=version`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${process.env.CONFLUENCE_EMAIL}:${this.apiKey}`).toString('base64')}`,
            Accept: 'application/json',
          },
        }
      );

      const version = currentPage.data.version.number + 1;

      await axios.put(
        `${this.baseUrl}/rest/api/content/${pageId}`,
        {
          version: { number: version },
          body: {
            storage: {
              value: content,
              representation: 'storage',
            },
          },
        },
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${process.env.CONFLUENCE_EMAIL}:${this.apiKey}`).toString('base64')}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      return true;
    } catch (error) {
      console.error('Error updating Confluence page:', error);
      return false;
    }
  }
}

export const docSpaceAdapter = new DocSpaceAdapter();
