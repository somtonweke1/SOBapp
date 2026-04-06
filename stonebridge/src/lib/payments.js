const { stripe } = require("./config");

function assertStripe() {
  if (!stripe) {
    const error = new Error("Stripe is not configured. Set STRIPE_SECRET_KEY to enable payment holds.");
    error.statusCode = 500;
    throw error;
  }
}

async function createHeldIntent({ amount, currency = "usd", dealId, customerEmail, paymentMethodId }) {
  assertStripe();
  const payload = {
    amount,
    currency,
    capture_method: "manual",
    receipt_email: customerEmail,
    metadata: { dealId }
  };
  if (paymentMethodId) {
    payload.payment_method = paymentMethodId;
    payload.confirm = true;
    payload.return_url = "https://example.com/return";
  } else {
    payload.automatic_payment_methods = { enabled: true };
  }
  return stripe.paymentIntents.create(payload);
}

async function captureIntent(paymentIntentId) {
  assertStripe();
  return stripe.paymentIntents.capture(paymentIntentId);
}

async function cancelIntent(paymentIntentId) {
  assertStripe();
  return stripe.paymentIntents.cancel(paymentIntentId);
}

module.exports = { createHeldIntent, captureIntent, cancelIntent };
