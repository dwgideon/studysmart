# StudySmart pricing and unit economics

Last reviewed: July 17, 2026. Re-run `npm run pricing:model` and re-check every linked price before changing a public plan.

## Current backend cost basis

StudySmart currently uses `gpt-4o-mini` for tutoring, quizzes, diagnostics, and flashcards; `gpt-4.1-mini` for visual/document extraction; `gpt-4o-mini-transcribe` for audio/video; `text-embedding-3-small` for retrieval; and `omni-moderation-latest` for safety.

Official OpenAI standard pricing at review time:

| Operation | Price basis |
| --- | ---: |
| `gpt-4o-mini` | $0.15 input / $0.60 output per 1M tokens |
| `gpt-4.1-mini` | $0.40 input / $1.60 output per 1M tokens |
| `gpt-4o-mini-transcribe` | approximately $0.003 per minute |
| `text-embedding-3-small` | $0.02 per 1M tokens |
| `omni-moderation-latest` | free |

Sources: [OpenAI API pricing](https://developers.openai.com/api/docs/pricing), [OpenAI production cost guidance](https://developers.openai.com/api/docs/guides/production-best-practices#text-generation).

Typical estimated direct AI costs are below one cent for a tutor response, quiz, diagnostic, or text study set. Document extraction is usually a few cents. Long audio is the largest variable cost, so this release limits uploads to 4 MB and weights media processing more heavily in the credit system.

AI credits are intentionally cost-weighted rather than advertised as unlimited generations:

| Action | Credits |
| --- | ---: |
| Tutor response | 1 |
| Quiz or diagnostic | 2 |
| Text study set, including cards | about 3 |
| Document/image study set, including cards | about 12 |
| Audio/video study set, including cards | about 22 |

The repeatable model uses $0.002 as an expected blended cost per credit and $0.01 as a stress assumption. The stress case is deliberately conservative and should be replaced with observed production usage after the first 30 and 90 days.

## Market anchors

| Product | Published individual price at review time |
| --- | --- |
| Quizlet Plus Unlimited | $44.99/year |
| Quizlet Family, up to 5 accounts | $83.99/year |
| Knowt Ultra | $24.99/month or $149.99/year |
| Kahoot!+ | begins around $3/month billed annually; richer tiers are higher |
| Gimkit Pro | $14.99/month or $59.88/year, educator-focused |

Sources: [Quizlet plans](https://quizlet.com/upgrade), [Knowt plans](https://knowt.com/plans?tab=Student+Ultra), [Kahoot study plans](https://kahoot.com/kahoot-study/), [Gimkit Pro](https://help.gimkit.com/en/article/gimkit-pro-faq-14h6d62/).

## Recommendation

For the pilot, keep the technically enforced monthly prices already configured in Stripe: Starter $9.99 for 200 credits, Pro $19.99 for 500, and Max $29.99 for 2,000. These plans have room for support, safety operations, payment fees, and early usage uncertainty. Stripe's standard domestic card fee is currently 2.9% + $0.30 per successful transaction. [Stripe pricing](https://stripe.com/pricing)

After at least 30 days of real usage, simplify the consumer offer:

- Free: $0 with 25 monthly AI credits and unlimited saved-content review.
- Individual Plus: $9.99 monthly or $59.99 annually.
- Family: $14.99 monthly or $99.99 annually for up to five linked learners with a pooled allowance.
- Schools: begin around $8 per student per year with a $500 annual minimum; quote higher tiers for advanced integrations, district controls, and support.

Do not launch the annual or family prices until pooled family entitlements, annual Stripe Price objects, refund language, applicable tax handling, and app-store rules have been verified. Pricing should be based on learning value and support obligations, while credits protect against cost outliers and automated abuse.

Baseline infrastructure also matters. Supabase Pro starts at $25/month before overages. [Supabase pricing](https://supabase.com/pricing) Production forecasts should add Vercel, notification delivery, support, security review, insurance, taxes, and app-store costs rather than treating token cost as the whole cost of service.
