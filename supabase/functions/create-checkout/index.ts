import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import Stripe from "https://esm.sh/stripe@22.0.2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";
import { isPublicCheckoutAllowed } from "../_shared/paymentApproval.ts";
import { isCheckoutPriceAllowed, isTrustedReturnUrl } from "../_shared/checkoutCatalog.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

async function createCheckoutSession(options: {
  priceId: string;
  customerEmail?: string;
  userId?: string;
  returnUrl: string;
  environment: StripeEnv;
}) {
  if (!/^[a-zA-Z0-9_-]+$/.test(options.priceId)) throw new Error("Invalid priceId");
  const stripe = createStripeClient(options.environment);

  const prices = await stripe.prices.list({ lookup_keys: [options.priceId] });
  if (!prices.data.length) throw new Error("Price not found");
  const stripePrice = prices.data[0];
  const isRecurring = stripePrice.type === "recurring";

  const customerId = (options.customerEmail || options.userId)
    ? await resolveOrCreateCustomer(stripe, {
        email: options.customerEmail,
        userId: options.userId,
      })
    : undefined;

  let productDescription: string | undefined;
  if (!isRecurring) {
    const productId = typeof stripePrice.product === "string"
      ? stripePrice.product
      : (stripePrice.product as { id: string }).id;
    const product = await stripe.products.retrieve(productId);
    productDescription = (product as { name?: string }).name;
  }

  const session = await stripe.checkout.sessions.create({
    line_items: [{ price: stripePrice.id, quantity: 1 }],
    mode: isRecurring ? "subscription" : "payment",
    ui_mode: "embedded_page",
    return_url: options.returnUrl,
    ...(customerId && { customer: customerId }),
    ...(!isRecurring && { payment_intent_data: { description: productDescription } }),
    managed_payments: { enabled: true },
    metadata: {
      ...(options.userId && { userId: options.userId }),
      priceId: options.priceId,
      managed_payments: "true",
    },
    ...(isRecurring && options.userId && {
      subscription_data: { metadata: { userId: options.userId } },
    }),
  } as Stripe.Checkout.SessionCreateParams);

  return session.client_secret;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const json = (b: unknown, status: number) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const body = await req.json();
    if (body.environment !== "sandbox" && body.environment !== "live") return json({ error: "Invalid environment" }, 400);
    const environment: StripeEnv = body.environment;
    if (!isPublicCheckoutAllowed(environment, Deno.env.get("PUBLIC_LIVE_PAYMENTS_APPROVED"))) {
      return json({ error: "Real-money purchases require launch approval" }, 403);
    }
    if (!isCheckoutPriceAllowed(body.priceId)) return json({ error: "Product not available" }, 400);
    if (!isTrustedReturnUrl(body.returnUrl, req.headers.get("origin"))) return json({ error: "Invalid return address" }, 400);

    // Buyer comes from the signed-in session, never from the request body.
    const token = req.headers.get("Authorization")?.replace(/^Bearer /, "") ?? "";
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: auth, error: authError } = await db.auth.getUser(token);
    if (authError || !auth.user) return json({ error: "Sign in required" }, 401);

    const clientSecret = await createCheckoutSession({
      priceId: body.priceId,
      customerEmail: auth.user.email ?? undefined,
      userId: auth.user.id,
      returnUrl: body.returnUrl,
      environment,
    });

    return new Response(JSON.stringify({ clientSecret }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-checkout error:", e);
    return new Response(JSON.stringify({ error: "Could not start checkout" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
