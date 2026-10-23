-- Performance Indexes for Orders, Transactions & Digital Products Catalog
-- Execute this script in your Supabase SQL Editor

-- ── 1. ORDERS TABLE PERFORMANCE INDEXES ──
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON public.orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON public.orders (order_type);
CREATE INDEX IF NOT EXISTS idx_orders_email ON public.orders (email);
CREATE INDEX IF NOT EXISTS idx_orders_discord_id ON public.orders (discord_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON public.orders (product_id);
CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON public.orders (paid_at DESC) WHERE paid_at IS NOT NULL;

-- ── 2. DIGITAL PRODUCTS TABLE PERFORMANCE INDEXES ──
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products (is_active);
CREATE INDEX IF NOT EXISTS idx_products_sort_order ON public.products (sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_products_active_sort ON public.products (is_active, sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_delivery_mode ON public.products (delivery_mode);
CREATE INDEX IF NOT EXISTS idx_products_service_scope ON public.products (service_scope);

