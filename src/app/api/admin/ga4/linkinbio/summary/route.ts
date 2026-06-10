import { NextResponse } from "next/server";
import {
  MissingGa4PropertyError,
  getGa4PropertyIdForProject,
  runGa4ReportForProperty,
} from "@/features/admin/lib/ga4";
import { LINKINBIO_ACTION_EVENT_LABELS, LINKINBIO_CORE_EVENTS, LINKINBIO_SETUP_HINT, buildBrandFilter, combineDimensionFilters } from "@/features/admin/lib/linkinbio";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = searchParams.get("days") || "30";
  const brand = searchParams.get("brand") || "all";
  const brandFilter = buildBrandFilter(brand);

  try {
    const propertyId = getGa4PropertyIdForProject("juo-linkinbio");

    const [totalsResponse, actionsResponse] = await Promise.all([
      runGa4ReportForProperty(propertyId, {
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
        dimensions: [],
        metrics: [{ name: "activeUsers" }, { name: "eventCount" }],
        ...(brandFilter ? { dimensionFilter: brandFilter } : {}),
      }),
      runGa4ReportForProperty(propertyId, {
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: combineDimensionFilters(
          { filter: { fieldName: "eventName", inListFilter: { values: [...LINKINBIO_CORE_EVENTS] } } },
          brandFilter,
        ),
      }),
    ]);

    const totalUsers = parseInt(totalsResponse.rows?.[0]?.metricValues?.[0]?.value || "0", 10);
    const totalEvents = parseInt(totalsResponse.rows?.[0]?.metricValues?.[1]?.value || "0", 10);

    const actionCounts: Record<string, number> = {};
    LINKINBIO_CORE_EVENTS.forEach((eventName) => {
      actionCounts[eventName] = 0;
    });

    actionsResponse.rows?.forEach((row) => {
      const eventName = row.dimensionValues?.[0]?.value || "";
      const count = parseInt(row.metricValues?.[0]?.value || "0", 10);
      if (eventName) {
        actionCounts[eventName] = count;
      }
    });

    const actions = LINKINBIO_CORE_EVENTS.map((eventName) => ({
      id: eventName,
      label: LINKINBIO_ACTION_EVENT_LABELS[eventName],
      count: actionCounts[eventName] || 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalEvents,
        officialMallClicks: actionCounts.official_mall_click || 0,
        meongbtiClicks: actionCounts.meongbti_click || 0,
        storeFinderOpens: actionCounts.store_finder_open || 0,
        storeSelections: actionCounts.store_select || 0,
        socialClicks: actionCounts.social_click || 0,
        locateMeClicks: actionCounts.locate_me_click || 0,
        actions,
      },
    });
  } catch (error) {
    console.error("Linkinbio summary GA4 error:", error);

    if (error instanceof MissingGa4PropertyError) {
      return NextResponse.json(
        {
          success: false,
          code: "missing_property",
          error: error.message,
          hint: LINKINBIO_SETUP_HINT,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch GA4 summary data",
      },
      { status: 500 }
    );
  }
}
