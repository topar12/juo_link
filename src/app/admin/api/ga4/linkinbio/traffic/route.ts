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
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      limit: 6,
      ...(brandFilter ? { dimensionFilter: brandFilter } : {}),
    });

    const data =
      response.rows?.map((row) => {
        const raw = row.dimensionValues?.[0]?.value || "Unknown";
        const users = parseInt(row.metricValues?.[0]?.value || "0", 10);
        const labels: Record<string, string> = {
          "Organic Social": "소셜 유입",
          Direct: "직접 접속",
          Referral: "추천 링크",
          "Organic Search": "검색 유입",
          Unassigned: "기타",
        };
        return {
          id: raw,
          label: labels[raw] || raw,
          users,
        };
      }) || [];

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Linkinbio traffic GA4 error:", error);

    if (error instanceof MissingGa4PropertyError) {
      return NextResponse.json(
        { success: false, code: "missing_property", error: error.message, hint: LINKINBIO_SETUP_HINT },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch traffic data" },
      { status: 500 }
    );
  }
}
