import { Router } from 'express';
import { processAgentMessage, processAgentMessageStream } from '../ai/orchestrator.js';
import { supabase } from '../db/supabase.js';

const router = Router();

// Non-streaming chat endpoint
router.post('/chat', async (req, res, next) => {
  try {
    const { message, session_id } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    // Load session history if session_id provided
    let sessionHistory: any[] = [];
    if (session_id) {
      const { data: session } = await supabase
        .from('agent_sessions')
        .select('messages')
        .eq('id', session_id)
        .single();
      if (session) {
        sessionHistory = session.messages || [];
      }
    }

    const response = await processAgentMessage(message, sessionHistory);

    // Save to session
    const updatedMessages = [
      ...sessionHistory,
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: response.message, timestamp: new Date().toISOString() },
    ];

    if (session_id) {
      await supabase
        .from('agent_sessions')
        .update({ messages: updatedMessages, tool_calls: response.tool_calls })
        .eq('id', session_id);
    } else {
      const { data: newSession } = await supabase
        .from('agent_sessions')
        .insert({
          messages: updatedMessages,
          tool_calls: response.tool_calls,
          campaign_id: response.campaign_plan?.campaign_id || null,
        })
        .select('id')
        .single();

      if (newSession) {
        (response as any).session_id = newSession.id;
      }
    }

    res.json(response);
  } catch (err) {
    next(err);
  }
});

// Streaming chat endpoint (SSE)
router.post('/chat/stream', async (req, res) => {
  const { message, session_id } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    let sessionHistory: any[] = [];
    let currentSessionId = session_id;

    if (session_id) {
      const { data: session } = await supabase
        .from('agent_sessions')
        .select('messages')
        .eq('id', session_id)
        .single();
      if (session) sessionHistory = session.messages || [];
    }

    const stream = processAgentMessageStream(message, sessionHistory);

    let fullContent = '';
    const toolCalls: any[] = [];
    let campaignData: any = null;

    for await (const event of stream) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);

      if (event.type === 'token') fullContent += event.data.content;
      if (event.type === 'stream_end') fullContent = event.data.full_content || fullContent;
      if (event.type === 'tool_end') toolCalls.push(event.data);
      if (event.type === 'campaign_created') campaignData = event.data;
    }

    // Persist session after stream completes
    const updatedMessages = [
      ...sessionHistory,
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: fullContent, tool_calls: toolCalls, campaign: campaignData, timestamp: new Date().toISOString() },
    ];

    if (currentSessionId) {
      await supabase
        .from('agent_sessions')
        .update({ messages: updatedMessages, tool_calls: toolCalls })
        .eq('id', currentSessionId);
    } else {
      const { data: newSession } = await supabase
        .from('agent_sessions')
        .insert({
          messages: updatedMessages,
          tool_calls: toolCalls,
          campaign_id: campaignData?.id || null,
        })
        .select('id')
        .single();
      if (newSession) currentSessionId = newSession.id;
    }

    // Send session_id in the end event so frontend can track it
    res.write(`data: ${JSON.stringify({ type: 'end', data: { session_id: currentSessionId } })}\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: 'error', data: { message: (err as Error).message } })}\n\n`);
    res.end();
  }
});

// List sessions
router.get('/sessions', async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('agent_sessions')
      .select('id, status, created_at, messages')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    const sessions = (data || []).map((s: any) => ({
      id: s.id,
      status: s.status,
      created_at: s.created_at,
      preview: s.messages?.[0]?.content?.substring(0, 80) || 'New conversation',
      message_count: s.messages?.length || 0,
    }));

    res.json(sessions);
  } catch (err) { next(err); }
});

// Get session detail
router.get('/sessions/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('agent_sessions')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Session not found' });
    res.json(data);
  } catch (err) { next(err); }
});

export default router;
