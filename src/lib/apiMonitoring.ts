import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";
import {
  emitOperationalEvent,
  reportOperationalFailure,
  requestIdFromHeaders,
} from "@/lib/operations";

export function withApiMonitoring(route: string, handler: NextApiHandler): NextApiHandler {
  return async function monitoredHandler(req: NextApiRequest, res: NextApiResponse) {
    const startedAt = Date.now();
    const requestId = requestIdFromHeaders(req.headers) ?? randomUUID();
    res.setHeader("X-Request-ID", requestId);
    res.once("finish", () => {
      const durationMs = Date.now() - startedAt;
      emitOperationalEvent(res.statusCode >= 500 ? "error" : "info", "api.request.completed", {
        route,
        method: req.method,
        status: res.statusCode,
        durationMs,
        requestId,
      });
    });
    try {
      await handler(req, res);
    } catch (error) {
      await reportOperationalFailure("api.request.unhandled", error, {
        route,
        method: req.method,
        requestId,
        durationMs: Date.now() - startedAt,
      });
      if (!res.headersSent) {
        res.status(500).json({ error: "An unexpected service error occurred.", requestId });
      } else if (!res.writableEnded) {
        res.end();
      }
    }
  };
}
