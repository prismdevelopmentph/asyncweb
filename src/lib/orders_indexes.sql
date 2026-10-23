-- ============================================================================
-- Production Performance Indexes
-- Orders, Digital Products, Claim Logs, Usages & Licenses
-- Execute this script in your Supabase SQL Editor
-- ============================================================================

-- 1. Orders Table Indexes (Admin Dashboard, Order Status, Filtering)
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc 
    ON public.orders (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status 
    ON public.orders (status);

CREATE INDEX IF NOT EXISTS idx_orders_status_created_at 
    ON public.orders (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_order_type 
    ON public.orders (order_type);

CREATE INDEX IF NOT EXISTS idx_orders_email 
    ON public.orders (email);

CREATE INDEX IF NOT EXISTS idx_orders_discord_id 
    ON public.orders (discord_id);

CREATE INDEX IF NOT EXISTS idx_orders_product_id 
    ON public.orders (product_id);

CREATE INDEX IF NOT EXISTS idx_orders_paid_at 
    ON public.orders (paid_at DESC) 
    WHERE paid_at IS NOT NULL;

-- 2. Digital Products Table Indexes (Storefront Catalog & Admin Fast Load)
CREATE INDEX IF NOT EXISTS idx_products_active_sort 
    ON public.products (is_active, sort_order ASC);

CREATE INDEX IF NOT EXISTS idx_products_sort_order 
    ON public.products (sort_order ASC);

CREATE INDEX IF NOT EXISTS idx_products_category 
    ON public.products (category, is_active);

CREATE INDEX IF NOT EXISTS idx_products_delivery_mode 
    ON public.products (delivery_mode);

-- Relational Mappings for Packages and Services
CREATE INDEX IF NOT EXISTS idx_package_services_composite 
    ON public.package_services (package_id, service_id);

CREATE INDEX IF NOT EXISTS idx_license_services_composite 
    ON public.license_services (license_id, service_id);

-- 3. Website Claim Logs Table Indexes (Live Generation Claims Audit & Filtering)
CREATE INDEX IF NOT EXISTS idx_website_claim_logs_claimed_at_desc 
    ON public.website_claim_logs (claimed_at DESC);

CREATE INDEX IF NOT EXISTS idx_website_claim_logs_discord_user 
    ON public.website_claim_logs (discord_user_id, claimed_at DESC);

CREATE INDEX IF NOT EXISTS idx_website_claim_logs_service 
    ON public.website_claim_logs (service_name, claimed_at DESC);

-- 4. Generator Daily Usage & Quotas (Atomic Claim RPC & Real-Time Lookups)
CREATE INDEX IF NOT EXISTS idx_license_daily_usages_lookup 
    ON public.license_daily_usages (license_id, usage_date);

CREATE INDEX IF NOT EXISTS idx_license_daily_usages_user 
    ON public.license_daily_usages (discord_id, usage_date);

-- 5. Generator Licenses (User-First Traversal & HWID Verification)
CREATE INDEX IF NOT EXISTS idx_licenses_redeemed_active 
    ON public.licenses (redeemed_by, is_active) 
    WHERE redeemed_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_licenses_hwid 
    ON public.licenses (hwid) 
    WHERE hwid IS NOT NULL;
