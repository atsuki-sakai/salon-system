// app/api/stripe-webhook/route.ts
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-01-27.acacia' });

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  // 生のボディ文字列を取得 (署名検証に使用)
  let event;
  const body = await req.text();  // 生データとしてテキストを取得
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('Stripe webhook signature verification failed:', err.message);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    } else {
      console.error('Stripe webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Unknown webhook error' }, { status: 400 });
    }
  }

  // イベントタイプに応じて処理
  const eventType = event.type;
  
  const dataObject = event.data.object;
  switch (eventType) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = dataObject as Stripe.Subscription;
      await fetchMutation(api.subscriptions.syncSubscription, {
        subscription: {
          id: subscription.id,
          customer: typeof subscription.customer === 'string' 
            ? subscription.customer
            : subscription.customer.id,
          status: subscription.status,
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!
        }
      });
      break;
    case 'customer.subscription.deleted':
      const canceledSub = dataObject as Stripe.Subscription;
      await fetchMutation(api.subscriptions.syncSubscription, {
        subscription: {
          id: canceledSub.id,
          customer: typeof canceledSub.customer === 'string'
            ? canceledSub.customer 
            : canceledSub.customer.id,
          status: canceledSub.status,
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!
        }
      });
      break;
    case 'invoice.payment_failed':
      // 支払い失敗: サブスクリプションを支払い保留状態に更新
      const invoice = dataObject as Stripe.Invoice;
      const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.toString();
      if (subId) {
        await fetchMutation(api.subscriptions.markFailed, { subscriptionId: subId });
      }
      break;
    default:
      console.log(`Unhandled Stripe event type: ${eventType}`);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
