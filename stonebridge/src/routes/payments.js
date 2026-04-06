const express = require("express");
const { prisma } = require("../lib/prisma");
const { asyncHandler, sendError } = require("../lib/http");
const { requireAuth } = require("../middleware/auth");
const { cancelIntent, captureIntent, createHeldIntent } = require("../lib/payments");

const router = express.Router();

router.use(requireAuth);

router.post("/create-intent", asyncHandler(async (req, res) => {
  const { dealId, paymentMethodId } = req.body;
  const deal = await prisma.deal.findFirst({
    where: { id: dealId, clientId: req.user.id }
  });
  if (!deal) return sendError(res, 404, "Deal not found");

  const intent = await createHeldIntent({
    amount: deal.amountCents,
    dealId: deal.id,
    customerEmail: req.user.email,
    paymentMethodId
  });

  await prisma.deal.update({
    where: { id: deal.id },
    data: {
      paymentIntentId: intent.id,
      paymentStatus: "HELD"
    }
  });

  await prisma.timelineEvent.create({
    data: {
      dealId: deal.id,
      event: "PAYMENT_HOLD_CREATED",
      detail: `PaymentIntent ${intent.id} created with manual capture`
    }
  });

  res.json({ clientSecret: intent.client_secret, paymentIntentId: intent.id, status: intent.status });
}));

router.post("/capture/:dealId", asyncHandler(async (req, res) => {
  const deal = await prisma.deal.findFirst({
    where: { id: req.params.dealId, clientId: req.user.id }
  });
  if (!deal || !deal.paymentIntentId) return sendError(res, 404, "Deal or payment hold not found");
  const intent = await captureIntent(deal.paymentIntentId);
  await prisma.deal.update({
    where: { id: deal.id },
    data: { paymentStatus: "RELEASED" }
  });
  res.json({ paymentIntent: intent.id, status: "RELEASED" });
}));

router.post("/refund/:dealId", asyncHandler(async (req, res) => {
  const deal = await prisma.deal.findFirst({
    where: { id: req.params.dealId, clientId: req.user.id }
  });
  if (!deal || !deal.paymentIntentId) return sendError(res, 404, "Deal or payment hold not found");
  const intent = await cancelIntent(deal.paymentIntentId);
  await prisma.deal.update({
    where: { id: deal.id },
    data: { paymentStatus: "REFUNDED", status: "DISPUTED" }
  });
  res.json({ paymentIntent: intent.id, status: "REFUNDED" });
}));

module.exports = router;
