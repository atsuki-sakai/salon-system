
// app/api/clerk-webhook/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { WebhookEvent } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { api } from '@/convex/_generated/api';
import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { clerkWebhookSchema } from '@/lib/validations';
import * as Sentry from "@sentry/nextjs";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia'
});

export async function POST(req: Request) {
  // 1. Clerk署名検証の準備
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!SIGNING_SECRET) {
    console.error("Clerk signing secret not configured");
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }
  const wh = new Webhook(SIGNING_SECRET);

  // Svix署名ヘッダーを取得
  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');
  if (!svixId || !svixTimestamp || !svixSignature) {
    Sentry.captureMessage("Clerk signing secret not configured", { level: "error" });
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  // リクエストボディを取得（文字列化して後で検証）
  const payload = await req.json();
  const payloadString = JSON.stringify(payload);

  // 2. 署名検証
  let evt: WebhookEvent;
  try {
    evt = wh.verify(payloadString, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    Sentry.captureMessage("Missing svix headers", { level: "error" });
    console.error("Clerk webhook signature verification failed:", err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const validPayload = clerkWebhookSchema.safeParse(payload);
  if (!validPayload.success) {
    Sentry.captureMessage("Clerk webhook payload のバリデーションエラー", { level: "error" });
    console.error("Clerk webhook payload のバリデーションエラー:", validPayload.error);
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }


  // 3. イベントタイプに応じた処理
  const eventType = validPayload.data.type ?? evt.type;
  const data = validPayload.data.data;

  if (eventType === 'user.created') {
    const { id, email_addresses } = data;
    const clerkUserId = id;
    const email = email_addresses[0]?.email_address ?? "no-email";

    // 既存ユーザーの存在チェック
    const existingSalon = await fetchQuery(api.salon.getBySalonId, { salonId: clerkUserId });
    if (!existingSalon) {
      // 新規の場合は Stripe で Customer を作成
      const customer = await stripe.customers.create({
        email: email || undefined,
        metadata: { clerkUserId },
      });
      // registerUser で新規登録
      await fetchMutation(api.salon.add, { clerkId: clerkUserId, salonId: clerkUserId, email, stripeCustomerId: customer.id });
    } else {
      // 既に存在する場合は registerUser でメールアドレス更新（Stripe Customer ID はそのまま）
      await fetchMutation(api.salon.add, { clerkId: clerkUserId, salonId: clerkUserId, email, stripeCustomerId: existingSalon.stripeCustomerId });
    }
  }
  else if (eventType === 'user.updated') {
    const { id, email_addresses } = data;
    const clerkUserId = id;
    const email = email_addresses[0]?.email_address;
    await fetchMutation(api.salon.add, { clerkId: clerkUserId, salonId: clerkUserId, email: email ?? "no-email", stripeCustomerId: "" });
    // ※既存ユーザーがある前提なので、stripeCustomerId は既に存在しているものを保持する運用とする
  }
  else if (eventType === 'user.deleted') {
    const { id } = data as { id: string };
    const clerkUserId = id;
    const salonRecord = await fetchQuery(api.salon.getBySalonId, { salonId: clerkUserId });
    if (salonRecord && salonRecord.stripeCustomerId) {
      try {
        await stripe.customers.del(salonRecord.stripeCustomerId);
        await fetchMutation(api.salon.trash, { clerkId: clerkUserId });
      } catch (err) {
        Sentry.captureMessage("Stripe customer deletion failed", { level: "error" });
        console.error("Stripe customer deletion failed:", err);
      }
    }
  }

  return NextResponse.json({ status: 'success' }, { status: 200 });
}

export async function GET() {
  return NextResponse.json(
    { message: 'Clerk webhook endpoint is working. Please use POST for webhooks.' },
    { status: 200 }
  );
}
