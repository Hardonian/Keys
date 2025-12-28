import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface Notification {
  id?: string;
  userId: string;
  type: 'suggestion' | 'event' | 'system' | 'alert';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

export interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  slackEnabled: boolean;
  uiEnabled: boolean;
  emailAddress?: string;
  slackWebhookUrl?: string;
}

export class NotificationService {
  /**
   * Send notification to user
   */
  async notify(
    userId: string,
    type: Notification['type'],
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<void> {
    // Store notification in database
    const notification: Notification = {
      userId,
      type,
      title,
      message,
      data,
      read: false,
      createdAt: new Date(),
    };

    await this.storeNotification(notification);

    // Get user preferences
    const preferences = await this.getPreferences(userId);

    // Send via enabled channels
    if (preferences.uiEnabled) {
      await this.sendUINotification(userId, notification);
    }

    if (preferences.emailEnabled && preferences.emailAddress) {
      await this.sendEmailNotification(preferences.emailAddress, notification);
    }

    if (preferences.slackEnabled && preferences.slackWebhookUrl) {
      await this.sendSlackNotification(preferences.slackWebhookUrl, notification);
    }
  }

  /**
   * Store notification in database
   */
  private async storeNotification(notification: Notification): Promise<void> {
    try {
      await supabase.from('notifications').insert({
        user_id: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        read: notification.read,
        created_at: notification.createdAt.toISOString(),
      });
    } catch (error) {
      // If notifications table doesn't exist, log and continue
      console.warn('Could not store notification (table may not exist):', error);
    }
  }

  /**
   * Send UI notification (real-time)
   */
  private async sendUINotification(userId: string, notification: Notification): Promise<void> {
    // In production, this would use WebSocket or SSE
    // For now, just log - frontend will poll for notifications
    console.log(`UI notification for user ${userId}:`, notification.title);
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    emailAddress: string,
    notification: Notification
  ): Promise<void> {
    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    console.log(`Email notification to ${emailAddress}:`, notification.title);
    // TODO: Implement email sending
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(webhookUrl: string, notification: Notification): Promise<void> {
    try {
      await axios.post(webhookUrl, {
        text: notification.title,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${notification.title}*\n${notification.message}`,
            },
          },
          ...(notification.data
            ? [
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: `\`\`\`${JSON.stringify(notification.data, null, 2)}\`\`\``,
                  },
                },
              ]
            : []),
        ],
      });
    } catch (error) {
      console.error('Error sending Slack notification:', error);
    }
  }

  /**
   * Get user notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      // In production, store in user_profiles or separate table
      // For now, return defaults
      return {
        userId,
        emailEnabled: false,
        slackEnabled: !!process.env.SLACK_WEBHOOK_URL,
        uiEnabled: true,
        slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
      };
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return {
        userId,
        emailEnabled: false,
        slackEnabled: false,
        uiEnabled: true,
      };
    }
  }

  /**
   * Notify about new suggestion
   */
  async notifySuggestion(
    userId: string,
    suggestionId: string,
    eventType: string,
    content: string
  ): Promise<void> {
    await this.notify(
      userId,
      'suggestion',
      'New Suggestion Available',
      `A new suggestion was generated based on: ${eventType}`,
      {
        suggestion_id: suggestionId,
        event_type: eventType,
        preview: content.substring(0, 100),
      }
    );
  }

  /**
   * Notify about background event
   */
  async notifyEvent(userId: string, eventType: string, eventData: Record<string, any>): Promise<void> {
    await this.notify(
      userId,
      'event',
      'Background Event Detected',
      `Event: ${eventType}`,
      {
        event_type: eventType,
        event_data: eventData,
      }
    );
  }
}

export const notificationService = new NotificationService();
