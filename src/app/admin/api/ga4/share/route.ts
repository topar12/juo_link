import { NextResponse } from "next/server";
import { runGa4Report } from "@/features/admin/lib/ga4";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = searchParams.get("days") || "30";

  const eventNames = [
    "share_result",
    "copy_link",
    "shared_link_visit",
  ];

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
          name: "eventName",
        },
      ],
      metrics: [
        {
          name: "eventCount",
        },
      ],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          inListFilter: {
            values: eventNames,
          },
        },
      },
    });

    const data: Record<string, number> = {};

    eventNames.forEach((name) => {
      data[name] = 0;
    });

    response.rows?.forEach((row) => {
      if (row.dimensionValues?.[0]?.value && row.metricValues?.[0]?.value) {
        data[row.dimensionValues[0].value] = parseInt(row.metricValues[0].value, 10);
      }
    });

    const shareStats = [
      { id: "share_result", label: "네이티브 공유", count: data["share_result"] || 0 },
      { id: "copy_link", label: "링크 복사", count: data["copy_link"] || 0 },
      { id: "shared_link_visit", label: "공유 링크 유입", count: data["shared_link_visit"] || 0 },
    ];

    return NextResponse.json({ success: true, data: shareStats });
  } catch (error) {
    console.error("GA4 API Error (Share Metrics):", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch GA4 share traffic data" },
      { status: 500 }
    );
  }
}
