-- ============================================================================
-- Production Coupons & Promotional Discounts Table
-- Supports Percentage & Fixed Discounts with Non-Stacking Rules
-- Execute this script in your Supabase SQL Editor
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    discount_type VARCHAR(20) NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent', 'fixed')),
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
    min_spend NUMERIC(10, 2) DEFAULT 0,
    max_uses INT DEFAULT NULL,
    times_used INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code_upper ON public.coupons (UPPER(code));
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons (is_active) WHERE is_active = TRUE;

-- Seed initial promo codes if not existing
INSERT INTO public.coupons (code, discount_type, discount_value, min_spend, max_uses, is_active)
VALUES 
    ('ASYNC10', 'percent', 10.00, 0, 500, TRUE),
    ('WELCOME50', 'fixed', 50.00, 200, 100, TRUE)
ON CONFLICT (code) DO NOTHING;

ANALYZE public.coupons;
