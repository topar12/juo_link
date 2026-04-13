"use client";

import { sendGAEvent } from "@next/third-parties/google";

type AnalyticsPrimitive = string | number;
type AnalyticsParams = Record<string, AnalyticsPrimitive | null | undefined>;
type DataLayerEntry = ArrayLike<unknown>;
type AnalyticsWindow = Window & {
  dataLayer?: DataLayerEntry[];
};

const PAGE_VIEW_RETRY_LIMIT = 20;
const PAGE_VIEW_RETRY_DELAY_MS = 100;

function sanitizeParams(params: AnalyticsParams = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null)
  );
}

function ensureDataLayer() {
  const analyticsWindow = window as AnalyticsWindow;
  analyticsWindow.dataLayer = analyticsWindow.dataLayer ?? [];
}

function hasGAConfigCommand() {
  const dataLayer = (window as AnalyticsWindow).dataLayer;

  return dataLayer?.some((entry) => Array.from(entry as ArrayLike<unknown>)[0] === "config") ?? false;
}

export function trackEvent(eventName: string, params: AnalyticsParams = {}) {
  if (typeof window === "undefined") {
    return;
  }

  ensureDataLayer();
  sendGAEvent("event", eventName, sanitizeParams(params));
}

function trackLinkInBioPageViewWhenReady(params: AnalyticsParams, attempt: number) {
  if (typeof window === "undefined") {
    return;
  }

  if (!hasGAConfigCommand() && attempt < PAGE_VIEW_RETRY_LIMIT) {
    window.setTimeout(
      () => trackLinkInBioPageViewWhenReady(params, attempt + 1),
      PAGE_VIEW_RETRY_DELAY_MS
    );
    return;
  }

  trackEvent("linkinbio_page_view", {
    page_location: window.location.href,
    page_path: `${window.location.pathname}${window.location.search}`,
    page_title: document.title,
    ...params,
  });
}

export function trackLinkInBioPageView(params: AnalyticsParams = {}) {
  trackLinkInBioPageViewWhenReady(params, 0);
}
