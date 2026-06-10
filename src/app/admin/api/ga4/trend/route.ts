import { NextResponse } from "next/server";
import { runGa4Report } from "@/features/admin/lib/ga4";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = searchParams.get("days") || "14";

  try {
    const response = await runGa4Report({
      dateRanges: [
        {
          startDate: `${days}daysAgo`,
          endDate: "today",
        },
      ],
      dimensions: [
        {
          name: "date",
        },
      ],
      metrics: [
        {
          name: "activeUsers",
        },
        {
          name: "eventCount",
        },
      ],
      // Sort by date ascending (oldest to newest)
      orderBys: [
        {
          dimension: {
            dimensionName: "date",
          },
          desc: false,
        },
      ],
    });

    const timeline =
      response.rows?.map((row) => {
        const dateStr = row.dimensionValues?.[0]?.value || "";
        // Parse YYYYMMDD to MM/DD
        const label = dateStr ? `${dateStr.substring(4, 6)}/${dateStr.substring(6, 8)}` : "";
        const users = parseInt(row.metricValues?.[0]?.value || "0", 10);
        const events = parseInt(row.metricValues?.[1]?.value || "0", 10);

        return {
          date: dateStr,
          label,
          users,
          events,
        };
      }) || [];

    return NextResponse.json({ success: true, data: timeline });
  } catch (error) {
    console.error("GA4 API Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch GA4 trend data" },
      { status: 500 }
    );
  }
}
