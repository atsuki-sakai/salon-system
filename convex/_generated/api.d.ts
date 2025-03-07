/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as customer from "../customer.js";
import type * as menu from "../menu.js";
import type * as reservation from "../reservation.js";
import type * as salon from "../salon.js";
import type * as salon_config from "../salon_config.js";
import type * as staff from "../staff.js";
import type * as storage from "../storage.js";
import type * as subscription from "../subscription.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  customer: typeof customer;
  menu: typeof menu;
  reservation: typeof reservation;
  salon: typeof salon;
  salon_config: typeof salon_config;
  staff: typeof staff;
  storage: typeof storage;
  subscription: typeof subscription;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
