-- ============================================================================
-- ASYNC DEVELOPMENT - Multi-Tenant Reseller Platform Migration
-- Run in Supabase SQL Editor
-- ============================================================================

-- 1. Resellers Roster & Credit Pool Table
CREATE TABLE IF NOT EXISTS public.resellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  credit_balance NUMERIC(12, 2) DEFAULT 0.00 CHECK (credit_balance >= 0),
  currency TEXT DEFAULT 'PHP',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resellers_discord_id ON public.resellers(discord_id);
CREATE INDEX IF NOT EXISTS idx_resellers_status ON public.resellers(status);

-- 2. Uniform Wholesale Pricing Matrix (Global rates applied to all approved resellers)
CREATE TABLE IF NOT EXISTS public.reseller_wholesale_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  tier_key TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'lifetime'
  wholesale_price_php NUMERIC(10, 2) NOT NULL CHECK (wholesale_price_php >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, tier_key)
);

CREATE INDEX IF NOT EXISTS idx_reseller_wholesale_pricing_prod_tier ON public.reseller_wholesale_pricing(product_id, tier_key);

-- 3. Reseller Financial Ledger & Key Minting Transaction History
CREATE TABLE IF NOT EXISTS public.reseller_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID REFERENCES public.resellers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'deduction', 'key_mint')),
  amount NUMERIC(12, 2) NOT NULL,
  balance_before NUMERIC(12, 2) NOT NULL,
  balance_after NUMERIC(12, 2) NOT NULL,
  note TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reseller_tx_reseller_id ON public.reseller_transactions(reseller_id);
CREATE INDEX IF NOT EXISTS idx_reseller_tx_created_at ON public.reseller_transactions(created_at DESC);

-- 4. Tag Issued Licenses to Resellers & Support HWID Reset
ALTER TABLE public.licenses 
ADD COLUMN IF NOT EXISTS reseller_id UUID REFERENCES public.resellers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS hwid TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_hwid_reset_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_licenses_reseller_id ON public.licenses(reseller_id);

-- 5. Enable RLS or grant access for service role
ALTER TABLE public.resellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_wholesale_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_transactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_resellers') THEN
    CREATE POLICY service_role_all_resellers ON public.resellers FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_wholesale_pricing') THEN
    CREATE POLICY service_role_all_wholesale_pricing ON public.reseller_wholesale_pricing FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_reseller_tx') THEN
    CREATE POLICY service_role_all_reseller_tx ON public.reseller_transactions FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;
