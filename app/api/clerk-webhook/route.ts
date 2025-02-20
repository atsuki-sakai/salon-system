// app/api/clerk-webhook/route.ts
import { Webhook } from 'svix'; // Svixライブラリ for Clerk webhook verification
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { WebhookEvent } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { api } from '@/convex/_generated/api';
import { fetchMutation, fetchQuery } from 'convex/nextjs';

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
    console.error("Clerk webhook signature verification failed:", err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // 3. イベントタイプに応じた処理
  const eventType = evt.type;
  const data = evt.data;

  if (eventType === 'user.created') {
    const { id, email_addresses } = data as { id: string; email_addresses: Array<{ email_address: string }> };
    const clerkUserId = id;
    const email = email_addresses[0]?.email_address ?? "no-email";

    // 既存ユーザーの存在チェック
    const existingUser = await fetchQuery(api.users.getUserByClerkId, { clerkId: clerkUserId });
    if (!existingUser) {
      // 新規の場合は Stripe で Customer を作成
      const customer = await stripe.customers.create({
        email: email || undefined,
        metadata: { clerkUserId },
      });
      // registerUser で新規登録
      await fetchMutation(api.users.registerUser, { clerkId: clerkUserId, email, stripeCustomerId: customer.id });
    } else {
      // 既に存在する場合は registerUser でメールアドレス更新（Stripe Customer ID はそのまま）
      await fetchMutation(api.users.registerUser, { clerkId: clerkUserId, email, stripeCustomerId: existingUser.stripeCustomerId });
    }
  }
  else if (eventType === 'user.updated') {
    const { id, email_addresses } = data as { id: string; email_addresses: Array<{ email_address: string }> };
    const clerkUserId = id;
    const email = email_addresses[0]?.email_address;
    await fetchMutation(api.users.registerUser, { clerkId: clerkUserId, email: email ?? "no-email", stripeCustomerId: "" });
    // ※既存ユーザーがある前提なので、stripeCustomerId は既に存在しているものを保持する運用とする
  }
  else if (eventType === 'user.deleted') {
    const { id } = data as { id: string };
    const clerkUserId = id;
    const userRecord = await fetchQuery(api.users.getUserByClerkId, { clerkId: clerkUserId });
    if (userRecord && userRecord.stripeCustomerId) {
      try {
        await stripe.customers.del(userRecord.stripeCustomerId);
      } catch (err) {
        console.error("Stripe customer deletion failed:", err);
      }
    }
    await fetchMutation(api.users.deleteUser, { clerkId: clerkUserId });
  }

  return NextResponse.json({ status: 'success' }, { status: 200 });
}

export async function GET() {
  return NextResponse.json(
    { message: 'Clerk webhook endpoint is working. Please use POST for webhooks.' },
    { status: 200 }
  );
}
