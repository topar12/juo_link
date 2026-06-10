import { NextResponse } from "next/server";
import {
  MissingGa4PropertyError,
  getGa4PropertyIdForProject,
  runGa4ReportForProperty,
} from "@/features/admin/lib/ga4";
import { LINKINBIO_SETUP_HINT, isMissingCustomDimensionError, buildBrandFilter, combineDimensionFilters } from "@/features/admin/lib/linkinbio";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = searchParams.get("days") || "30";
  const brand = searchParams.get("brand") || "all";
  const brandFilter = buildBrandFilter(brand);

  try {
    const propertyId = getGa4PropertyIdForProject("juo-linkinbio");
    const response = await runGa4ReportForProperty(propertyId, {
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
      dimensions: [{ name: "customEvent:channel" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: combineDimensionFilters(
        { filter: { fieldName: "eventName", inListFilter: { values: ["social_click"] } } },
        brandFilter,
      ),
      orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
      limit: 10,
    });

    const data =
      response.rows?.map((row) => ({
        id: row.dimensionValues?.[0]?.value || "unknown",
        label: row.dimensionValues?.[0]?.value || "unknown",
        count: parseInt(row.metricValues?.[0]?.value || "0", 10),
      })) || [];

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Linkinbio social GA4 error:", error);

    if (error instanceof MissingGa4PropertyError) {
      return NextResponse.json(
        { success: false, code: "missing_property", error: error.message, hint: LINKINBIO_SETUP_HINT },
        { status: 400 }
      );
    }

    if (isMissingCustomDimensionError(error)) {
      return NextResponse.json({
        success: true,
        data: [],
        requiresCustomDimensions: true,
        hint: LINKINBIO_SETUP_HINT,
      });
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch social data" },
      { status: 500 }
    );
  }
}
