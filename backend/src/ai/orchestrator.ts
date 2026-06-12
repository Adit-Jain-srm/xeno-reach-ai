import { AzureOpenAI } from 'openai';
import { SYSTEM_PROMPT, SELF_AUDIT_PROMPT } from './prompts.js';
import { AGENT_TOOLS } from './tools.js';
import { executeToolCall } from './tool-executor.js';
import { supabase } from '../db/supabase.js';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const openai = new AzureOpenAI({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2025-01-01-preview',
});

const MODEL_STRATEGY = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';
const MODEL_EXECUTION = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';
const MAX_SELF_CORRECTION_LOOPS = 3;
const CONFIDENCE_THRESHOLD = 70;

export interface AgentResponse {
  message: string;
  tool_calls: Array<{ name: string; arguments: any; result: any; duration_ms: number }>;
  campaign_plan?: CampaignPlan;
  confidence_score?: number;
  self_correction_applied?: boolean;
}

export interface CampaignPlan {
  campaign_id?: string;
  name: string;
  goal: string;
  audience_count: number;
  channels: string[];
  message_preview: string;
  confidence_score: number;
  audience_breakdown?: any;
}

export async function processAgentMessage(
  userMessage: string,
  sessionHistory: ChatCompletionMessageParam[] = []
): Promise<AgentResponse> {
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...sessionHistory,
    { role: 'user', content: userMessage },
  ];

  const toolCalls: AgentResponse['tool_calls'] = [];
  let finalResponse = '';
  let campaignPlan: CampaignPlan | undefined;
  let selfCorrectionApplied = false;

  // Run agent loop (tool calls until final response)
  let iterations = 0;
  const maxIterations = 10;

  while (iterations < maxIterations) {
    iterations++;

    const completion = await openai.chat.completions.create({
      model: MODEL_STRATEGY,
      messages,
      tools: AGENT_TOOLS,
      tool_choice: 'auto',
    });

    const choice = completion.choices[0];
    const assistantMessage = choice.message;
    messages.push(assistantMessage);

    // If no tool calls, we have the final response
    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
      finalResponse = assistantMessage.content || '';
      break;
    }

    // Execute tool calls
    for (const toolCall of assistantMessage.tool_calls) {
      const startTime = Date.now();
      const args = JSON.parse(toolCall.function.arguments);
      const result = await executeToolCall(toolCall.function.name, args);
      const duration = Date.now() - startTime;

      toolCalls.push({
        name: toolCall.function.name,
        arguments: args,
        result,
        duration_ms: duration,
      });

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });

      // Check if a campaign was created
      if (toolCall.function.name === 'create_campaign' && result?.id) {
        campaignPlan = {
          campaign_id: result.id,
          name: result.name || args.name,
          goal: result.goal || args.goal,
          audience_count: result.audience_count || 0,
          channels: args.channels || [],
          message_preview: args.message_template || '',
          confidence_score: 0,
        };
      }
    }
  }

  // Self-correction loop for campaign plans
  let confidenceScore: number | undefined;
  if (campaignPlan) {
    const auditResult = await selfAudit(campaignPlan, userMessage);
    confidenceScore = auditResult.score;
    campaignPlan.confidence_score = auditResult.score;

    if (auditResult.score < CONFIDENCE_THRESHOLD) {
      // Try to improve
      let correctionAttempts = 0;
      while (auditResult.score < CONFIDENCE_THRESHOLD && correctionAttempts < MAX_SELF_CORRECTION_LOOPS) {
        correctionAttempts++;
        selfCorrectionApplied = true;

        // Ask agent to improve based on audit feedback
        messages.push({
          role: 'user',
          content: `Your campaign plan scored ${auditResult.score}/100. Issues: ${auditResult.issues.join('; ')}. Suggestions: ${auditResult.suggestions.join('; ')}. Please improve the plan.`,
        });

        const refinement = await openai.chat.completions.create({
          model: MODEL_STRATEGY,
          messages,
          tools: AGENT_TOOLS,
          tool_choice: 'auto',
        });

        const refinedChoice = refinement.choices[0].message;
        messages.push(refinedChoice);

        if (refinedChoice.tool_calls) {
          for (const toolCall of refinedChoice.tool_calls) {
            const args = JSON.parse(toolCall.function.arguments);
            const result = await executeToolCall(toolCall.function.name, args);

            toolCalls.push({
              name: toolCall.function.name,
              arguments: args,
              result,
              duration_ms: 0,
            });

            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(result),
            });

            if (toolCall.function.name === 'create_campaign' && result?.id) {
              campaignPlan = {
                campaign_id: result.id,
                name: result.name || args.name,
                goal: result.goal || args.goal,
                audience_count: result.audience_count || 0,
                channels: args.channels || [],
                message_preview: args.message_template || '',
                confidence_score: 0,
              };
            }
          }
        }

        if (refinedChoice.content) {
          finalResponse = refinedChoice.content;
        }

        // Re-audit
        if (campaignPlan) {
          const reaudit = await selfAudit(campaignPlan, userMessage);
          confidenceScore = reaudit.score;
          campaignPlan.confidence_score = reaudit.score;
          if (reaudit.score >= CONFIDENCE_THRESHOLD) break;
        }
      }
    }
  }

  return {
    message: finalResponse,
    tool_calls: toolCalls,
    campaign_plan: campaignPlan,
    confidence_score: confidenceScore,
    self_correction_applied: selfCorrectionApplied,
  };
}

async function selfAudit(plan: CampaignPlan, originalGoal: string): Promise<{ score: number; issues: string[]; suggestions: string[] }> {
  try {
    const auditInput = `
Campaign Goal: ${originalGoal}
Campaign Name: ${plan.name}
Audience Size: ${plan.audience_count}
Channels: ${plan.channels.join(', ')}
Message: ${plan.message_preview}
`;

    const response = await openai.chat.completions.create({
      model: MODEL_EXECUTION,
      messages: [
        { role: 'system', content: SELF_AUDIT_PROMPT },
        { role: 'user', content: auditInput },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content || '{}';
    const audit = JSON.parse(content);
    return {
      score: audit.score || 75,
      issues: audit.issues || [],
      suggestions: audit.suggestions || [],
    };
  } catch (err) {
    console.error('[Self-Audit Error]', (err as Error).message);
    return { score: 75, issues: [], suggestions: [] };
  }
}

// Context-aware streaming version with real token-by-token SSE
export async function* processAgentMessageStream(
  userMessage: string,
  sessionHistory: ChatCompletionMessageParam[] = []
): AsyncGenerator<{ type: string; data: any }> {
  // Build context-aware system prompt by injecting recent data
  const contextPrompt = await buildContextualPrompt();

  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: contextPrompt },
    ...sessionHistory,
    { role: 'user', content: userMessage },
  ];

  yield { type: 'status', data: { step: 'Understanding your goal...' } };

  let iterations = 0;
  const maxIterations = 10;
  const toolCalls: any[] = [];

  while (iterations < maxIterations) {
    iterations++;

    // First check if model wants to call tools (non-streaming for tool calls)
    const completion = await openai.chat.completions.create({
      model: MODEL_STRATEGY,
      messages,
      tools: AGENT_TOOLS,
      tool_choice: 'auto',
    });

    const choice = completion.choices[0];
    const assistantMessage = choice.message;

    // If tool calls, execute them and yield progress
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      messages.push(assistantMessage);

      for (const toolCall of assistantMessage.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments);

        yield { type: 'tool_start', data: { name: toolCall.function.name, arguments: args } };

        const startTime = Date.now();
        const result = await executeToolCall(toolCall.function.name, args);
        const duration = Date.now() - startTime;

        toolCalls.push({ name: toolCall.function.name, arguments: args, result, duration_ms: duration });

        yield { type: 'tool_end', data: { name: toolCall.function.name, result, duration_ms: duration } };

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });

        if (toolCall.function.name === 'create_campaign' && result?.id) {
          yield { type: 'campaign_created', data: result };
        }
      }

      yield { type: 'status', data: { step: 'Synthesizing results...' } };
      continue;
    }

    // No tool calls — stream the final response token by token
    yield { type: 'stream_start', data: {} };

    const stream = await openai.chat.completions.create({
      model: MODEL_STRATEGY,
      messages,
      stream: true,
    });

    let fullContent = '';
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullContent += delta;
        yield { type: 'token', data: { content: delta } };
      }
    }

    yield { type: 'stream_end', data: { full_content: fullContent } };
    break;
  }

  yield { type: 'done', data: { tool_calls: toolCalls, iterations } };
}

// Build context-aware system prompt with live data summaries
async function buildContextualPrompt(): Promise<string> {
  let context = SYSTEM_PROMPT;

  try {
    // Inject recent campaign performance as context
    const { data: recentCampaigns } = await supabase
      .from('campaigns')
      .select('name, status, channels, audience_count, ai_confidence_score, campaign_stats(delivery_rate, open_rate, click_rate)')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentCampaigns && recentCampaigns.length > 0) {
      const campaignSummary = recentCampaigns.map((c: any) => {
        const stats = c.campaign_stats?.[0];
        return `- "${c.name}" (${c.status}): ${c.channels?.join('+')} to ${c.audience_count} customers` +
          (stats ? ` → ${stats.delivery_rate}% delivered, ${stats.open_rate}% opened, ${stats.click_rate}% clicked` : '');
      }).join('\n');

      context += `\n\n## Recent Campaign Performance (use this to inform recommendations)\n${campaignSummary}`;
    }

    // Inject customer base summary
    const { count: totalCustomers } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true });

    const { data: tierDist } = await supabase
      .from('customers')
      .select('loyalty_tier');

    if (tierDist) {
      const tiers: Record<string, number> = {};
      for (const c of tierDist) {
        tiers[c.loyalty_tier] = (tiers[c.loyalty_tier] || 0) + 1;
      }
      const tierSummary = Object.entries(tiers).map(([t, n]) => `${t}: ${n}`).join(', ');
      context += `\n\n## Customer Base Context\nTotal: ${totalCustomers} customers\nLoyalty distribution: ${tierSummary}`;
    }
  } catch (err) {
    // Context enrichment is best-effort — don't fail the request
    console.warn('[Context] Failed to enrich prompt:', (err as Error).message);
  }

  return context;
}
