/**
 * Superchat API Client for sending messages
 * Documentation: https://docs.superchat.com/api
 */

interface SuperchatRecipient {
  identifier: string; // Phone number (E164), email, or contact_id
}

interface SuperchatSender {
  identifier: string; // Your Superchat channel ID
}

interface SuperchatTextContent {
  type: 'text';
  text: string;
}

interface SuperchatMediaContent {
  type: 'media';
  url: string;
  caption?: string;
}

interface SuperchatEmailContent {
  type: 'email';
  subject: string;
  html?: string;
  text?: string;
}

type SuperchatContent = SuperchatTextContent | SuperchatMediaContent | SuperchatEmailContent;

interface SendMessageParams {
  to: SuperchatRecipient[];
  from: SuperchatSender;
  content: SuperchatContent;
  inReplyTo?: string; // Optional: Reply to a specific message (email only)
}

interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class SuperchatClient {
  private apiKey: string;
  private baseUrl = 'https://api.superchat.com/v1.0';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.SUPERCHAT_API_KEY || '';
    if (!this.apiKey) {
      console.warn('SUPERCHAT_API_KEY is not set. Superchat features will not work.');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'X-API-KEY': this.apiKey,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Superchat API error (${response.status}): ${errorText}`
      );
    }

    return response.json();
  }

  /**
   * Send a message via Superchat
   */
  async sendMessage(params: SendMessageParams): Promise<SendMessageResponse> {
    try {
      const response = await this.request<{ id: string }>('/messages', {
        method: 'POST',
        body: JSON.stringify(params),
      });

      return {
        success: true,
        messageId: response.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send a text message
   */
  async sendTextMessage(params: {
    to: string; // Phone number, email, or contact_id
    channelId: string; // Your Superchat channel
    text: string;
  }): Promise<SendMessageResponse> {
    return this.sendMessage({
      to: [{ identifier: params.to }],
      from: { identifier: params.channelId },
      content: {
        type: 'text',
        text: params.text,
      },
    });
  }

  /**
   * Send a media message (image, video, document)
   */
  async sendMediaMessage(params: {
    to: string;
    channelId: string;
    mediaUrl: string;
    caption?: string;
  }): Promise<SendMessageResponse> {
    return this.sendMessage({
      to: [{ identifier: params.to }],
      from: { identifier: params.channelId },
      content: {
        type: 'media',
        url: params.mediaUrl,
        caption: params.caption,
      },
    });
  }

  /**
   * Send an email message
   */
  async sendEmailMessage(params: {
    to: string;
    channelId: string;
    subject: string;
    html?: string;
    text?: string;
    inReplyTo?: string;
  }): Promise<SendMessageResponse> {
    return this.sendMessage({
      to: [{ identifier: params.to }],
      from: { identifier: params.channelId },
      content: {
        type: 'email',
        subject: params.subject,
        html: params.html,
        text: params.text,
      },
      inReplyTo: params.inReplyTo,
    });
  }

  /**
   * Get conversation details
   */
  async getConversation(conversationId: string) {
    return this.request(`/conversations/${conversationId}`, {
      method: 'GET',
    });
  }

  /**
   * Get conversation messages
   */
  async getConversationMessages(conversationId: string) {
    return this.request(`/conversations/${conversationId}/messages`, {
      method: 'GET',
    });
  }

  /**
   * Get contact details
   */
  async getContact(contactId: string) {
    return this.request(`/contacts/${contactId}`, {
      method: 'GET',
    });
  }

  /**
   * Update contact with custom attributes
   */
  async updateContact(contactId: string, customAttributes: Record<string, any>) {
    return this.request(`/contacts/${contactId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        custom_attributes: customAttributes,
      }),
    });
  }
}

// Singleton instance
let superchatClient: SuperchatClient | null = null;

export function getSuperchatClient(): SuperchatClient {
  if (!superchatClient) {
    superchatClient = new SuperchatClient();
  }
  return superchatClient;
}
