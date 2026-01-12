# PHASE 1: DATABASE SETUP & SCHEMA

**Goal:** Set up Supabase database tables for subscription management

**Estimated Time:** 30 minutes

---

## 📋 OVERVIEW

This phase creates the database foundation for managing user subscriptions. We'll add:
- `subscriptions` table to track Stripe subscriptions
- `subscription_events` table for audit logging
- Helper functions to check subscription status
- Row Level Security policies

---

## 🗄️ DATABASE SCHEMA

### Step 1: Create Subscriptions Table

Run this SQL in your Supabase SQL Editor:

```sql
-- ================================================================
-- SUBSCRIPTIONS TABLE
-- Stores Stripe subscription data for each user
-- ================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_price_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete', 'trialing', 'unpaid')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);

-- Ensure only one active subscription per user
CREATE UNIQUE INDEX idx_subscriptions_user_active 
  ON subscriptions(user_id) 
  WHERE status = 'active';
```

### Step 2: Create Subscription Events Table

```sql
-- ================================================================
-- SUBSCRIPTION EVENTS TABLE
-- Logs all Stripe webhook events for debugging and audit trail
-- ================================================================
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscription_events_subscription_id ON subscription_events(subscription_id);
CREATE INDEX idx_subscription_events_created_at ON subscription_events(created_at);
CREATE INDEX idx_subscription_events_type ON subscription_events(event_type);
```

### Step 3: Update Users Table

```sql
-- ================================================================
-- UPDATE USERS TABLE
-- Add subscription tracking columns
-- ================================================================
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free' 
  CHECK (subscription_status IN ('free', 'active', 'past_due', 'canceled'));

ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS cloud_storage_limit INTEGER DEFAULT 5;

-- Index for quick subscription status lookups
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
```

### Step 4: Enable Row Level Security

```sql
-- ================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures users can only see their own data
-- ================================================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscriptions (for the UI)
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role (backend functions) can modify subscriptions
CREATE POLICY "Service role can manage subscriptions" ON subscriptions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Only service role can manage events
CREATE POLICY "Service role can manage events" ON subscription_events
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

### Step 5: Create Helper Functions

```sql
-- ================================================================
-- HELPER FUNCTIONS
-- Reusable functions for checking subscription status
-- ================================================================

-- Check if user has an active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = user_uuid
    AND status = 'active'
    AND current_period_end > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's cloud storage limit based on subscription
CREATE OR REPLACE FUNCTION get_cloud_storage_limit(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  has_sub BOOLEAN;
BEGIN
  has_sub := has_active_subscription(user_uuid);
  
  IF has_sub THEN
    RETURN 999999; -- Unlimited (large number)
  ELSE
    RETURN 5; -- Free tier limit
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user's subscription status (called by webhooks)
CREATE OR REPLACE FUNCTION update_user_subscription_status(
  user_uuid UUID,
  new_status TEXT,
  new_limit INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET 
    subscription_status = new_status,
    cloud_storage_limit = new_limit,
    updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## ✅ VERIFICATION

After running all SQL, verify the setup:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('subscriptions', 'subscription_events');

-- Check users table has new columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('subscription_status', 'cloud_storage_limit');

-- Test helper function (should return 5 for free user)
SELECT get_cloud_storage_limit('00000000-0000-0000-0000-000000000000');
```

---

## 🎯 SUCCESS CRITERIA

- ✅ `subscriptions` table created with all columns
- ✅ `subscription_events` table created
- ✅ `users` table updated with subscription columns
- ✅ All indexes created
- ✅ RLS policies enabled
- ✅ Helper functions working
- ✅ No SQL errors in Supabase logs

---

## 📝 NOTES FOR CLAUDE CODE

- Run each SQL block separately in Supabase SQL Editor
- Check for errors after each block
- If a table already exists, that's okay (IF NOT EXISTS handles it)
- Save the SQL in a file: `database/subscription_schema.sql` for version control
- Document any modifications needed for your specific setup

---

## 🔄 ROLLBACK (if needed)

```sql
-- WARNING: This deletes all subscription data!
DROP TABLE IF EXISTS subscription_events CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP FUNCTION IF EXISTS has_active_subscription(UUID);
DROP FUNCTION IF EXISTS get_cloud_storage_limit(UUID);
DROP FUNCTION IF EXISTS update_user_subscription_status(UUID, TEXT, INTEGER);

ALTER TABLE users DROP COLUMN IF EXISTS subscription_status;
ALTER TABLE users DROP COLUMN IF EXISTS cloud_storage_limit;
```

---

## ➡️ NEXT PHASE

Once database is set up, proceed to **PHASE 2: Stripe Setup & Configuration**
