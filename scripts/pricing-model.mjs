const STRIPE_PERCENT = 0.029;
const STRIPE_FIXED_USD = 0.30;
const ASSIGNED_INFRASTRUCTURE_USD = 0.75;
const EXPECTED_AI_COST_PER_CREDIT_USD = 0.002;
const STRESS_AI_COST_PER_CREDIT_USD = 0.01;

const plans = [
  { name: "Starter", price: 9.99, credits: 200 },
  { name: "Pro", price: 19.99, credits: 500 },
  { name: "Max", price: 29.99, credits: 2_000 },
];

const result = plans.map((plan) => {
  const paymentFee = plan.price * STRIPE_PERCENT + STRIPE_FIXED_USD;
  const netRevenue = plan.price - paymentFee;
  const expectedCost = plan.credits * EXPECTED_AI_COST_PER_CREDIT_USD + ASSIGNED_INFRASTRUCTURE_USD;
  const stressCost = plan.credits * STRESS_AI_COST_PER_CREDIT_USD + ASSIGNED_INFRASTRUCTURE_USD;
  return {
    plan: plan.name,
    price: `$${plan.price.toFixed(2)}`,
    credits: plan.credits,
    netAfterStripe: `$${netRevenue.toFixed(2)}`,
    expectedContributionMargin: `${Math.round((netRevenue - expectedCost) / netRevenue * 100)}%`,
    fullAllowanceStressMargin: `${Math.round((netRevenue - stressCost) / netRevenue * 100)}%`,
  };
});

console.table(result);
console.log("Assumptions: 2.9% + $0.30 payment fee, $0.75 allocated infrastructure, $0.002 expected AI cost per credit, $0.01 stress AI cost per credit.");
