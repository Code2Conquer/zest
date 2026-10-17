import { z } from "zod";

export const CampaignInput = z.object({
  platform: z.enum(["zomato", "swiggy"]),
  goal: z.enum(["new_customers", "slow_hours", "bigger_orders", "dish", "festival"]),
  offer: z.enum(["percent", "flat", "freebie", "ads"]),
  value: z.number().min(0).max(1000),
  upTo: z.number().min(0).max(1000),
  minOrder: z.number().min(0).max(5000),
  budget: z.number().int().min(100, "Set a budget of at least ₹100").max(100000),
  days: z.number().int().min(1).max(60),
  window: z.string().trim().max(80),
  dish: z.string().trim().max(80).optional(),
});
