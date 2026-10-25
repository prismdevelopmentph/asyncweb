import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getPayMongoConfig, createPayMongoCheckoutSession } from '@/lib/paymongo';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ ok: false, error: 'Missing orderId' }, { status: 400 });
    }

    // 1. Fetch order details from Supabase
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 });
    }

    if (order.status === 'delivered') {
      return NextResponse.json({
        ok: false,
        error: 'Order has already been fulfilled and delivered.'
      }, { status: 400 });
    }

    // 2. Fetch PayMongo credentials
    const { secretKey, isAutomated } = await getPayMongoConfig();

    if (!secretKey) {
      return NextResponse.json({
        ok: false,
        error: 'PayMongo Secret Key is not configured. Please add PAYMONGO_SECRET_KEY to .env.local or Admin Settings.'
      }, { status: 500 });
    }

    // 3. Resolve base URL for success/cancel redirects
    const host = req.headers.get('host') || 'asyncdevph.xyz';
    const proto = req.headers.get('x-forwarded-proto') || 'https';
    const originUrl = `${proto}://${host}`;

    // 4. Format line items from cart items or order product
    const details = order.payment_details || {};
    const cartItems = details.cart_items;
    let lineItems: Array<{ name: string; quantity: number; amountPHP: number }> | undefined;

    if (Array.isArray(cartItems) && cartItems.length > 0) {
      lineItems = cartItems.map((c: any) => ({
        name: c.title || 'ASYNC Product',
        quantity: Math.max(1, Number(c.quantity) || 1),
        amountPHP: Number(c.pricePHP || c.price || 0)
      }));
    }

    // 5. Create Checkout Session via PayMongo API
    const session = await createPayMongoCheckoutSession(secretKey, {
      orderId: order.id,
      amountPHP: Number(order.amount),
      productName: order.product_name || 'ASYNC Digital Product',
      customerEmail: order.email || details.billing_email || null,
      customerName: details.billing_name || order.discord_id || null,
      customerDiscordId: order.discord_id || null,
      originUrl,
      lineItems
    });

    // 6. Update order with session metadata
    await supabaseAdmin
      .from('orders')
      .update({
        payment_details: {
          ...details,
          paymongo_checkout_session_id: session.sessionId,
          paymongo_checkout_url: session.checkoutUrl,
          paymongo_created_at: new Date().toISOString()
        }
      })
      .eq('id', order.id);

    return NextResponse.json({
      ok: true,
      checkoutUrl: session.checkoutUrl,
      sessionId: session.sessionId
    });
  } catch (err: any) {
    console.error('[PayMongo Create Session Error]:', err);
    return NextResponse.json({
      ok: false,
      error: err.message || 'Internal Server Error'
    }, { status: 500 });
  }
}

