"use client";

import { sendGAEvent } from "@next/third-parties/google";

type AnalyticsPrimitive = string | number;
type AnalyticsParams = Record<string, AnalyticsPrimitive | null | undefined>;

function sanitizeParams(params: AnalyticsParams = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null)
  );
}

export function trackEvent(eventName: string, params: AnalyticsParams = {}) {
  if (typeof window === "undefined") {
    return;
  }

  sendGAEvent("event", eventName, sanitizeParams(params));
}
