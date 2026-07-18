import assert from "node:assert/strict";
import test from "node:test";
import {
  AI_CREDIT_COSTS,
  isPaidPlanKey,
  PLAN_CATALOG,
  planForKey,
  planKeyForPriceId,
} from "../src/lib/plans.ts";

test("paid plans have increasing prices and bounded AI allowances", () => {
  const paid = [PLAN_CATALOG.starter, PLAN_CATALOG.pro, PLAN_CATALOG.unlimited];
  assert.deepEqual(paid.map((plan) => plan.monthlyPriceCents), [999, 1999, 2999]);
  assert.deepEqual(paid.map((plan) => plan.monthlyAiCredits), [200, 500, 2000]);
  assert.ok(PLAN_CATALOG.free.monthlyAiCredits > 0);
  assert.ok(paid.every((plan, index) => index === 0 || plan.monthlyAiCredits > paid[index - 1].monthlyAiCredits));
});

test("unknown or client-supplied plan names always resolve to free", () => {
  assert.equal(isPaidPlanKey("starter"), true);
  assert.equal(isPaidPlanKey("enterprise-admin"), false);
  assert.equal(planForKey("enterprise-admin").key, "free");
  assert.equal(planForKey(null).key, "free");
});

test("costlier media operations consume more credits than ordinary tutoring", () => {
  assert.equal(AI_CREDIT_COSTS.tutorReply, 1);
  assert.ok(AI_CREDIT_COSTS.visualOrDocumentProcessing > AI_CREDIT_COSTS.quiz);
  assert.ok(AI_CREDIT_COSTS.audioOrVideoProcessing > AI_CREDIT_COSTS.visualOrDocumentProcessing);
});

test("Stripe price IDs map only through server configuration", () => {
  const previous = process.env.STRIPE_PRICE_ID_STARTER;
  process.env.STRIPE_PRICE_ID_STARTER = "price_test_starter";
  try {
    assert.equal(planKeyForPriceId("price_test_starter"), "starter");
    assert.equal(planKeyForPriceId("price_client_spoof"), null);
  } finally {
    if (previous === undefined) {delete process.env.STRIPE_PRICE_ID_STARTER;}
    else {process.env.STRIPE_PRICE_ID_STARTER = previous;}
  }
});
