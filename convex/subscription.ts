import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import Stripe from "stripe";
import { action } from "./_generated/server";


export const syncSubscription = mutation({
  args: {
    subscription: v.object({
      id: v.string(),
      customer: v.string(),
      status: v.string(),
      priceId: v.string(),
      currentPeriodEnd: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscription")
      .withIndex("by_subscription_id", (q) => q.eq("subscriptionId", args.subscription.id))
      .first();

    if (existing) {
      console.log("Updating subscription status:", args.subscription.id);
      return await ctx.db.patch(existing._id, {
        status: args.subscription.status,
        currentPeriodEnd: args.subscription.currentPeriodEnd,
      });
    }

    console.log("Creating new subscription:", args.subscription.id);
    return await ctx.db.insert("subscription", {
        subscriptionId: args.subscription.id,
        customerId: args.subscription.customer,
        status: args.subscription.status,
        priceId: args.subscription.priceId,
        currentPeriodEnd: args.subscription.currentPeriodEnd
    });
  },
});


export const markFailed = mutation({
  args: { subscriptionId: v.string() },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscription")
      .filter(q => q.eq("subscriptionId", args.subscriptionId))
      .first();
    if (!subscription) return null;
    return await ctx.db.patch(subscription._id, { status: "payment_failed" });
  },
});

export const createSubscriptionSession = action({
  args: { 
    clerkUserId: v.string(),
    stripeCustomerId: v.string(),
    priceId: v.string(),
    baseUrl: v.string(),
    trialPeriodDays: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-01-27.acacia",
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: args.stripeCustomerId,
      line_items: [{ price: args.priceId, quantity: 1 }],
      success_url: `${args.baseUrl}/dashboard/${args.clerkUserId}/subscription/success`,
      cancel_url: `${args.baseUrl}/dashboard/${args.clerkUserId}/subscription/cancel`,
      client_reference_id: args.clerkUserId,
      metadata: {
        clerkUserId: args.clerkUserId,
      },
      subscription_data: {
        trial_period_days: args.trialPeriodDays ?? 14,
      }
    });

    return { checkoutUrl: session.url };
  },
});

export const checkSubscription = query({
  args: { salonId: v.string() },
  handler: async (ctx, args) => {
    const salon = await ctx.db.query("salon").filter(q => q.eq(q.field("_id"), args.salonId)).first();
    const salonSubscription = await ctx.db.query("subscription").filter(q => q.eq(q.field("customerId"), salon?.stripeCustomerId)).first();
    return salonSubscription?.status !== "active" ? true : false;
  },
});

export const createBillingPortalSession = action({
  args: { 
    customerId: v.string(),  // Stripe の Customer ID を指定
    returnUrl: v.string(),   // 顧客がポータルから戻る URL
  },
  handler: async (ctx, args) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-01-27.acacia",
    });
    const session = await stripe.billingPortal.sessions.create({
      customer: args.customerId,
      return_url: args.returnUrl,
    });
    return { portalUrl: session.url };
  },
});