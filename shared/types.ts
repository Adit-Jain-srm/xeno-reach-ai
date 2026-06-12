export interface Customer {
  id: string;
  external_id?: string;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  loyalty_tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  segment_tags: string[];
  preferred_channel: 'whatsapp' | 'sms' | 'email' | 'rcs';
  favorite_items: string[];
  first_purchase_at?: string;
  last_purchase_at?: string;
  total_orders: number;
  total_spent: number;
  avg_order_value: number;
  days_since_last_order?: number;
  engagement_score: number;
  created_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  items: OrderItem[];
  total_amount: number;
  store_location: string;
  order_date: string;
  payment_method: string;
  created_at: string;
}

export interface OrderItem {
  name: string;
  category: string;
  quantity: number;
  price: number;
}

export interface Segment {
  id: string;
  name: string;
  description?: string;
  filter_config: FilterConfig;
  natural_language_query?: string;
  generated_sql?: string;
  customer_count: number;
  created_at: string;
  updated_at: string;
}

export interface FilterConfig {
  conditions: FilterCondition[];
  logic: 'AND' | 'OR';
}

export interface FilterCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'between';
  value: unknown;
}

export interface Campaign {
  id: string;
  name: string;
  goal?: string;
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'failed';
  segment_id?: string;
  audience_filter?: FilterConfig;
  audience_count: number;
  channels: ChannelType[];
  message_template?: MessageTemplate;
  ai_reasoning?: string;
  ai_confidence_score?: number;
  created_by: string;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface MessageTemplate {
  subject?: string;
  body: string;
  personalization_fields: string[];
}

export type ChannelType = 'whatsapp' | 'sms' | 'email' | 'rcs';

export type CommunicationStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'clicked' | 'failed' | 'undelivered';

export interface Communication {
  id: string;
  campaign_id: string;
  customer_id: string;
  channel: ChannelType;
  message_content: string;
  personalization_data?: Record<string, string>;
  current_status: CommunicationStatus;
  idempotency_key: string;
  created_at: string;
}

export type CommunicationEventType = 'queued' | 'sent' | 'delivered' | 'failed' | 'opened' | 'read' | 'clicked' | 'undelivered';

export interface CommunicationEvent {
  id: string;
  communication_id: string;
  event_type: CommunicationEventType;
  occurred_at: string;
  metadata: Record<string, unknown>;
  raw_payload?: Record<string, unknown>;
  idempotency_key: string;
}

export interface CampaignStats {
  campaign_id: string;
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  total_opened: number;
  total_read: number;
  total_clicked: number;
  total_undelivered: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  updated_at: string;
}

export interface AgentSession {
  id: string;
  messages: AgentMessage[];
  tool_calls: AgentToolCall[];
  campaign_id?: string;
  status: 'active' | 'completed';
  created_at: string;
}

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: string;
  tool_call_id?: string;
}

export interface AgentToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  duration_ms?: number;
}

// Channel Service Contracts
export interface SendMessageRequest {
  communication_id: string;
  campaign_id: string;
  recipient: {
    customer_id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  channel: ChannelType;
  message: {
    content: string;
    personalization?: Record<string, string>;
  };
  metadata?: Record<string, unknown>;
}

export interface DeliveryReceiptPayload {
  communication_id: string;
  event_type: CommunicationEventType;
  occurred_at: string;
  idempotency_key: string;
  metadata?: Record<string, unknown>;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiError {
  error: string;
  message: string;
  status: number;
  details?: unknown;
}
