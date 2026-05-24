import os
import stripe

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")

PRICE_ID = os.environ.get("STRIPE_PRICE_ID", "")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")


def create_checkout_session(user_id: str, email: str) -> str:
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        mode="subscription",
        customer_email=email,
        line_items=[{"price": PRICE_ID, "quantity": 1}],
        success_url=f"{FRONTEND_URL}/dashboard?upgraded=true",
        cancel_url=f"{FRONTEND_URL}/pricing",
        metadata={"user_id": user_id},
    )
    return session.url


def create_portal_session(customer_id: str) -> str:
    session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=f"{FRONTEND_URL}/dashboard",
    )
    return session.url


def handle_webhook(payload: bytes, sig_header: str) -> dict:
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except stripe.error.SignatureVerificationError:
        return {"error": "Invalid signature"}

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session["metadata"]["user_id"]
        customer_id = session["customer"]
        subscription_id = session["subscription"]
        return {
            "event": "subscription_created",
            "user_id": user_id,
            "customer_id": customer_id,
            "subscription_id": subscription_id,
        }

    if event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        return {
            "event": "subscription_cancelled",
            "subscription_id": subscription["id"],
        }

    return {"event": "ignored"}
