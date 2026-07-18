if (process.env.VERCEL_ENV === "production") {
  await import("./verify-production-readiness.mjs");
} else {
  console.log("Production environment gate skipped outside a Vercel Production build.");
}
