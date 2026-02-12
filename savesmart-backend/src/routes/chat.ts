/**
 * Chat Routes
 *
 * Provides endpoints for context-aware chat messaging with AI agents.
 * Extracts minimal context from requests and forwards to Chat_Agent webhook.
 *
 * Requirements: 3.1, 3.4, 4.3, 4.4, 12.4
 */

import { Router, Request, Response } from 'express';
import { WebhookService, ChatContext } from '../services/webhooks.js';

const router = Router();

// Lazy-load webhook service to avoid initialization issues
let webhookService: WebhookService | null = null;
function getWebhookService(): WebhookService {
  if (!webhookService) {
    webhookService = new WebhookService();
  }
  return webhookService;
}

/**
 * Chat request body interface
 */
interface ChatRequest {
  userId: string;
  message: string;
  context?: {
    pageType?: 'dashboard' | 'recipe' | 'event' | 'fuel' | 'profile';
    dataId?: string;
    dataName?: string;
  };
}

/**
 * POST /api/chat
 *
 * Send a chat message to the AI agent with optional page context.
 * Requirement 3.1: Forward message to Chat_Agent webhook
 * Requirement 3.4: Return response to frontend
 * Requirement 4.3: Extract minimal context from request
 * Requirement 4.4: Include only pageType, dataId, dataName (not full page content)
 * Requirement 12.4: POST /api/chat endpoint
 *
 * Request body:
 * - userId: User ID for context
 * - message: User's chat message
 * - context: Optional minimal page context (pageType, dataId, dataName)
 *
 * Response:
 * - response: AI agent's response
 * - timestamp: ISO timestamp of response
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { userId, message, context } = req.body as ChatRequest;

    // Validate required fields
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        error: 'Validation failed',
        details: { userId: 'userId is required and must be a string' },
      });
    }

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Validation failed',
        details: { message: 'message is required and must be a string' },
      });
    }

    // Extract minimal context (Requirement 4.4)
    const chatContext: ChatContext | undefined = context
      ? {
          pageType: context.pageType,
          dataId: context.dataId,
          dataName: context.dataName,
        }
      : undefined;

    // Forward message to Chat_Agent webhook (Requirement 3.1)
    const agentResponse = await getWebhookService().callChatAgent(message, chatContext);

    // Return response to frontend (Requirement 3.4)
    return res.status(200).json({
      response: agentResponse,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Handle timeout errors
    if (error instanceof Error && error.message.includes('timed out')) {
      return res.status(504).json({
        error: 'AI agent timeout',
        message: 'The chat agent took too long to respond. Please try again.',
      });
    }

    // Handle other errors
    console.error('Chat endpoint error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process chat message',
    });
  }
});

export default router;
