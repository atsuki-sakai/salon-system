// app/api/stripe-webhook/route.ts
import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';
import * as Sentry from '@sentry/nextjs';
import { normalizeSubscriptionStatus, formatTimestampToDate } from '@/lib/utils';
import { stripeWebhookSchema } from '@/lib/validations';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !webhookSecret) {
    Sentry.captureMessage("Missing Stripe signature or webhook secret", { level: "error" });
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  // 生のボディ文字列を取得（署名検証に使用）
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    Sentry.captureException(err);
    console.error("Stripe webhook signature verification failed:", errMsg);
    return NextResponse.json({ error: `Webhook Error: ${errMsg}` }, { status: 400 });
  }

  // Zod による型チェック
  const validationResult = stripeWebhookSchema.safeParse(event);
  if (!validationResult.success) {
    Sentry.captureException(validationResult.error);
    console.error("Stripe webhook payload validation error:", validationResult.error);
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
  }

  // 型チェック済みのイベントを利用
  const validatedEvent = validationResult.data;
  const eventType = validatedEvent.type;
  const dataObject = validatedEvent.data.object;

  switch (eventType) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = dataObject as Stripe.Subscription;
      const formattedDate = formatTimestampToDate(subscription.current_period_end);
      await fetchMutation(api.subscription.syncSubscription, {
        subscription: {
          id: subscription.id,
          customer:
            typeof subscription.customer === 'string'
              ? subscription.customer
              : subscription.customer.id,
          status: normalizeSubscriptionStatus(subscription),
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!,
          currentPeriodEnd: formattedDate,
        },
      });
      await fetchMutation(api.salon.updateSubscription, {
        customerId:
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer.id,
        subscriptionId: subscription.id,
        subscriptionStatus: normalizeSubscriptionStatus(subscription),
      });
      break;
    }
    case 'invoice.payment_succeeded': {
      const invoice = dataObject as Stripe.Invoice;
      const subId =
        typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.toString();
      if (subId) {
        const subscription = await stripe.subscriptions.retrieve(subId);
        const formattedDate = formatTimestampToDate(subscription.current_period_end);
        await fetchMutation(api.subscription.syncSubscription, {
          subscription: {
            id: subscription.id,
            customer:
              typeof subscription.customer === 'string'
                ? subscription.customer
                : subscription.customer.id,
            status: normalizeSubscriptionStatus(subscription),
            priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!,
            currentPeriodEnd: formattedDate,
          },
        });
        await fetchMutation(api.salon.updateSubscription, {
          customerId:
            typeof subscription.customer === 'string'
              ? subscription.customer
              : subscription.customer.id,
          subscriptionId: subscription.id,
          subscriptionStatus: normalizeSubscriptionStatus(subscription),
        });
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const canceledSub = dataObject as Stripe.Subscription;
      const formattedDate = formatTimestampToDate(canceledSub.current_period_end);
      await fetchMutation(api.subscription.syncSubscription, {
        subscription: {
          id: canceledSub.id,
          customer:
            typeof canceledSub.customer === 'string'
              ? canceledSub.customer
              : canceledSub.customer.id,
          status: normalizeSubscriptionStatus(canceledSub),
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!,
          currentPeriodEnd: formattedDate,
        },
      });
      await fetchMutation(api.salon.updateSubscription, {
        customerId:
          typeof canceledSub.customer === 'string'
            ? canceledSub.customer
            : canceledSub.customer.id,
        subscriptionId: canceledSub.id,
        subscriptionStatus: normalizeSubscriptionStatus(canceledSub),
      });
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = dataObject as Stripe.Invoice;
      const subId =
        typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.toString();
      if (subId) {
        await fetchMutation(api.subscription.markFailed, { subscriptionId: subId });
      }
      break;
    }
    default:
      console.log(`Unhandled Stripe event type: ${eventType}`);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
