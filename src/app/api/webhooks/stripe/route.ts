import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import {
  findPatientIdByStripeCustomer,
  syncInvoice,
  syncSubscription,
} from "@/lib/stripe/sync";
import { createSupabaseServiceClient } from "@/lib/db";

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhooks not configured" }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const patientId =
          subscription.metadata?.patient_id ??
          (await findPatientIdByStripeCustomer(supabase, customerId));

        if (patientId) {
          await syncSubscription(supabase, subscription, patientId);
        }
        break;
      }

      case "invoice.paid":
      case "invoice.payment_failed":
      case "invoice.finalized": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

        if (customerId) {
          const patientId =
            invoice.metadata?.patient_id ??
            (await findPatientIdByStripeCustomer(supabase, customerId));

          if (patientId) {
            await syncInvoice(supabase, invoice, patientId);
          }
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[stripe webhook]", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
