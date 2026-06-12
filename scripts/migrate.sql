-- ============================================================
-- ReachAI Database Schema
-- Event-sourced communication tracking with trigger-based stats
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==================== CORE ENTITIES ====================

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  city TEXT,
  loyalty_tier TEXT DEFAULT 'bronze' CHECK (loyalty_tier IN ('bronze','silver','gold','platinum')),
  segment_tags TEXT[] DEFAULT '{}',
  preferred_channel TEXT DEFAULT 'whatsapp' CHECK (preferred_channel IN ('whatsapp','sms','email','rcs')),
  favorite_items JSONB DEFAULT '[]',
  first_purchase_at TIMESTAMPTZ,
  last_purchase_at TIMESTAMPTZ,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC(10,2) DEFAULT 0,
  avg_order_value NUMERIC(10,2) DEFAULT 0,
  engagement_score NUMERIC(4,3) DEFAULT 0.500,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]',
  total_amount NUMERIC(10,2) NOT NULL,
  store_location TEXT,
  order_date TIMESTAMPTZ NOT NULL,
  payment_method TEXT DEFAULT 'upi',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== SEGMENTS ====================

CREATE TABLE IF NOT EXISTS segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  filter_config JSONB NOT NULL DEFAULT '{}',
  natural_language_query TEXT,
  generated_sql TEXT,
  customer_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== CAMPAIGNS ====================

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  goal TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','scheduled','running','paused','completed','failed')),
  segment_id UUID REFERENCES segments(id) ON DELETE SET NULL,
  audience_filter JSONB,
  audience_count INTEGER DEFAULT 0,
  channels TEXT[] DEFAULT '{}',
  message_template JSONB,
  ai_reasoning TEXT,
  ai_confidence_score NUMERIC(4,2),
  created_by TEXT DEFAULT 'ai_agent',
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== COMMUNICATIONS ====================

CREATE TABLE IF NOT EXISTS communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp','sms','email','rcs')),
  message_content TEXT NOT NULL,
  personalization_data JSONB DEFAULT '{}',
  current_status TEXT DEFAULT 'queued' CHECK (current_status IN ('queued','sent','delivered','read','clicked','failed','undelivered')),
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Append-only event log (event sourcing pattern)
CREATE TABLE IF NOT EXISTS communication_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  communication_id UUID NOT NULL REFERENCES communications(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('queued','sent','delivered','failed','opened','read','clicked','undelivered')),
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  raw_payload JSONB,
  idempotency_key TEXT UNIQUE
);

-- ==================== CAMPAIGN STATS (Trigger-Maintained) ====================

CREATE TABLE IF NOT EXISTS campaign_stats (
  campaign_id UUID PRIMARY KEY REFERENCES campaigns(id) ON DELETE CASCADE,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_read INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_undelivered INTEGER DEFAULT 0,
  delivery_rate NUMERIC(5,2) DEFAULT 0,
  open_rate NUMERIC(5,2) DEFAULT 0,
  click_rate NUMERIC(5,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== AI AGENT ====================

CREATE TABLE IF NOT EXISTS agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  messages JSONB DEFAULT '[]',
  tool_calls JSONB DEFAULT '[]',
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== INDEXES ====================

CREATE INDEX IF NOT EXISTS idx_customers_loyalty ON customers(loyalty_tier);
CREATE INDEX IF NOT EXISTS idx_customers_last_purchase ON customers(last_purchase_at);
CREATE INDEX IF NOT EXISTS idx_customers_city ON customers(city);
CREATE INDEX IF NOT EXISTS idx_customers_engagement ON customers(engagement_score);
CREATE INDEX IF NOT EXISTS idx_customers_preferred_channel ON customers(preferred_channel);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_amount ON orders(total_amount);

CREATE INDEX IF NOT EXISTS idx_communications_campaign ON communications(campaign_id);
CREATE INDEX IF NOT EXISTS idx_communications_customer ON communications(customer_id);
CREATE INDEX IF NOT EXISTS idx_communications_status ON communications(current_status);

CREATE INDEX IF NOT EXISTS idx_comm_events_comm_id ON communication_events(communication_id);
CREATE INDEX IF NOT EXISTS idx_comm_events_type ON communication_events(event_type);
CREATE INDEX IF NOT EXISTS idx_comm_events_idempotency ON communication_events(idempotency_key);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_segments_name ON segments(name);

-- ==================== TRIGGER FUNCTIONS ====================

-- Update communication status when a new event is inserted
CREATE OR REPLACE FUNCTION update_communication_status()
RETURNS TRIGGER AS $$
DECLARE
  status_map JSONB := '{"queued":"queued","sent":"sent","delivered":"delivered","opened":"delivered","read":"read","clicked":"clicked","failed":"failed","undelivered":"undelivered"}';
  new_status TEXT;
BEGIN
  -- Map event_type to communication status
  CASE NEW.event_type
    WHEN 'queued' THEN new_status := 'queued';
    WHEN 'sent' THEN new_status := 'sent';
    WHEN 'delivered' THEN new_status := 'delivered';
    WHEN 'opened' THEN new_status := 'delivered';
    WHEN 'read' THEN new_status := 'read';
    WHEN 'clicked' THEN new_status := 'clicked';
    WHEN 'failed' THEN new_status := 'failed';
    WHEN 'undelivered' THEN new_status := 'undelivered';
    ELSE new_status := 'queued';
  END CASE;

  UPDATE communications
  SET current_status = new_status
  WHERE id = NEW.communication_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update campaign stats when a new event is inserted
CREATE OR REPLACE FUNCTION update_campaign_stats()
RETURNS TRIGGER AS $$
DECLARE
  camp_id UUID;
BEGIN
  SELECT campaign_id INTO camp_id
  FROM communications
  WHERE id = NEW.communication_id;

  IF camp_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Ensure stats row exists
  INSERT INTO campaign_stats (campaign_id)
  VALUES (camp_id)
  ON CONFLICT (campaign_id) DO NOTHING;

  -- Increment the appropriate counter
  CASE NEW.event_type
    WHEN 'sent' THEN
      UPDATE campaign_stats SET total_sent = total_sent + 1, updated_at = NOW() WHERE campaign_id = camp_id;
    WHEN 'delivered' THEN
      UPDATE campaign_stats SET total_delivered = total_delivered + 1, updated_at = NOW() WHERE campaign_id = camp_id;
    WHEN 'failed' THEN
      UPDATE campaign_stats SET total_failed = total_failed + 1, updated_at = NOW() WHERE campaign_id = camp_id;
    WHEN 'opened' THEN
      UPDATE campaign_stats SET total_opened = total_opened + 1, updated_at = NOW() WHERE campaign_id = camp_id;
    WHEN 'read' THEN
      UPDATE campaign_stats SET total_read = total_read + 1, updated_at = NOW() WHERE campaign_id = camp_id;
    WHEN 'clicked' THEN
      UPDATE campaign_stats SET total_clicked = total_clicked + 1, updated_at = NOW() WHERE campaign_id = camp_id;
    WHEN 'undelivered' THEN
      UPDATE campaign_stats SET total_undelivered = total_undelivered + 1, updated_at = NOW() WHERE campaign_id = camp_id;
    ELSE
      NULL;
  END CASE;

  -- Recalculate rates
  UPDATE campaign_stats SET
    delivery_rate = CASE WHEN total_sent > 0 THEN (total_delivered::NUMERIC / total_sent * 100) ELSE 0 END,
    open_rate = CASE WHEN total_delivered > 0 THEN (total_opened::NUMERIC / total_delivered * 100) ELSE 0 END,
    click_rate = CASE WHEN total_read > 0 THEN (total_clicked::NUMERIC / total_read * 100) ELSE 0 END,
    updated_at = NOW()
  WHERE campaign_id = camp_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================== TRIGGERS ====================

DROP TRIGGER IF EXISTS trg_update_communication_status ON communication_events;
CREATE TRIGGER trg_update_communication_status
  AFTER INSERT ON communication_events
  FOR EACH ROW
  EXECUTE FUNCTION update_communication_status();

DROP TRIGGER IF EXISTS trg_update_campaign_stats ON communication_events;
CREATE TRIGGER trg_update_campaign_stats
  AFTER INSERT ON communication_events
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_stats();

-- ==================== ENABLE REALTIME ====================

ALTER PUBLICATION supabase_realtime ADD TABLE campaign_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE communications;
ALTER PUBLICATION supabase_realtime ADD TABLE campaigns;
