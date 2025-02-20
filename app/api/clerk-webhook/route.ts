// app/api/clerk-webhook/route.ts
import { Webhook } from 'svix';                     // Svixライブラリ for Clerk webhook verification
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { WebhookEvent } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { api } from '@/convex/_generated/api';
import { fetchMutation, fetchQuery } from 'convex/nextjs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-01-27.acacia' });

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

  // 2. 署名を検証
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
    const email = email_addresses[0]?.email_address ?? "no-email";  // emailがない場合のフォールバック
    // Stripe上にCustomerを作成
    const customer = await stripe.customers.create({ 
      email: email || undefined,
      metadata: { clerkUserId }  // 任意でClerkのIDをメタデータに保存
    });
    // Convexにユーザー登録（Clerk ID, Email, Stripe Customer ID）
    await fetchMutation(api.users.createUser, { 
      clerkId: clerkUserId, 
      email: email,
      stripeCustomerId: customer.id 
    });
  } 
  else if (eventType === 'user.updated') {
    const { id, email_addresses } = data as { id: string; email_addresses: Array<{ email_address: string }> };
    const clerkUserId = id;
    const email = email_addresses[0]?.email_address;
    await fetchMutation(api.users.updateUser, { clerkId: clerkUserId, email });
  } 
  else if (eventType === 'user.deleted') {
    const { id } = data as { id: string };
    const clerkUserId = id;
    // まずStripeのCustomerを削除
    // ConvexからStripe Customer IDを取得
    const userRecord = await fetchQuery(api.users.getUserByClerkId, { clerkId: clerkUserId });
    if (userRecord && userRecord.stripeCustomerId) {
      try {
        await stripe.customers.del(userRecord.stripeCustomerId);
      } catch (err) {
        console.error("Stripe customer deletion failed:", err);
      }
    }
    // Convex上のユーザーデータと関連サブスクリプションを削除
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
