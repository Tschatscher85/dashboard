import { Request, Response } from 'express';
import * as db from '../db';
import { getBrevoClient } from '../brevoClient';
import { ENV } from '../_core/env';

/**
 * Superchat Webhook Handler
 * Receives incoming messages from WhatsApp, Facebook, Instagram, etc.
 * Documentation: https://docs.superchat.com/webhooks
 */

interface SuperchatWebhookPayload {
  event: string;
  data: {
    id: string;
    conversation_id: string;
    contact: {
      id: string;
      name?: string;
      phone?: string;
      email?: string;
    };
    content: {
      type: 'text' | 'media' | 'email';
      text?: string;
      subject?: string;
      url?: string;
      caption?: string;
    };
    channel: 'whatsapp' | 'facebook' | 'instagram' | 'telegram' | 'email' | 'phone' | 'other';
    created_at: string;
  };
}

/**
 * Handle incoming Superchat webhook
 */
export async function handleSuperchatWebhook(req: Request, res: Response) {
  try {
    const payload: SuperchatWebhookPayload = req.body;

    // Validate webhook signature if available
    // const signature = req.headers['x-superchat-signature'];
    // if (!verifySignature(signature, req.body)) {
    //   return res.status(401).json({ error: 'Invalid signature' });
    // }

    // Only process message.created events
    if (payload.event !== 'message.created') {
      return res.status(200).json({ success: true, message: 'Event ignored' });
    }

    const { data } = payload;

    // Extract message text
    let messageText = '';
    let subject = '';
    
    if (data.content.type === 'text') {
      messageText = data.content.text || '';
    } else if (data.content.type === 'email') {
      subject = data.content.subject || '';
      messageText = data.content.text || '';
    } else if (data.content.type === 'media') {
      messageText = data.content.caption || `[Media: ${data.content.url}]`;
    }

    // Map Superchat channel to our channel enum
    const channelMap: Record<string, any> = {
      whatsapp: 'whatsapp',
      facebook: 'facebook',
      instagram: 'instagram',
      telegram: 'telegram',
      email: 'email',
      phone: 'phone',
    };
    const channel = channelMap[data.channel] || 'other';

    // Create inquiry in database
    await db.createInquiry({
      channel,
      superchatContactId: data.contact.id,
      superchatConversationId: data.conversation_id,
      superchatMessageId: data.id,
      contactName: data.contact.name || null,
      contactPhone: data.contact.phone || null,
      contactEmail: data.contact.email || null,
      subject: subject || null,
      messageText: messageText || null,
      status: 'new',
    });

    // Send email notification to admin
    if (data.contact.email) {
      try {
        const brevo = getBrevoClient();
        const adminEmail = 'info@immo-jaeger.eu'; // TODO: Make this configurable
        
        await brevo.sendInquiryNotification({
          adminEmail,
          inquiryType: 'general',
          contactName: data.contact.name || 'Unbekannt',
          contactEmail: data.contact.email,
          contactPhone: data.contact.phone,
          message: messageText,
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the webhook if email fails
      }
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
    });

  } catch (error) {
    console.error('Superchat webhook error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Verify Superchat webhook signature
 * TODO: Implement signature verification when available
 */
function verifySignature(signature: string | undefined, body: any): boolean {
  // Implement signature verification logic here
  // For now, return true (no verification)
  return true;
}
