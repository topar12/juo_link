import { NextResponse } from "next/server";
import {
  MissingGa4PropertyError,
  getGa4PropertyIdForProject,
  runGa4ReportForProperty,
} from "@/features/admin/lib/ga4";
import { LINKINBIO_SETUP_HINT, buildBrandFilter } from "@/features/admin/lib/linkinbio";

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
      dimensions: [{ name: "date" }],
      metrics: [{ name: "activeUsers" }, { name: "eventCount" }],
      orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
      ...(brandFilter ? { dimensionFilter: brandFilter } : {}),
    });

    const timeline =
      response.rows?.map((row) => {
        const date = row.dimensionValues?.[0]?.value || "";
        return {
          date,
          label: date ? `${date.slice(4, 6)}/${date.slice(6, 8)}` : "",
          users: parseInt(row.metricValues?.[0]?.value || "0", 10),
          events: parseInt(row.metricValues?.[1]?.value || "0", 10),
        };
      }) || [];

    return NextResponse.json({ success: true, data: timeline });
  } catch (error) {
    console.error("Linkinbio trend GA4 error:", error);

    if (error instanceof MissingGa4PropertyError) {
      return NextResponse.json(
        { success: false, code: "missing_property", error: error.message, hint: LINKINBIO_SETUP_HINT },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch trend data" },
      { status: 500 }
    );
  }
}
