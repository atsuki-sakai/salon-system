// convex/storage.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  args: {
  },
  handler: async (ctx) => {
    const url = await ctx.storage.generateUploadUrl();
    return url;
  },
});


export const getUrl = query({
  args: {
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});


export const deleteFile = mutation({
  args: {
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.storage.delete(args.storageId);
  },
});
