import { NextResponse } from "next/server";
import { runGa4Report } from "@/features/admin/lib/ga4";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = searchParams.get("days") || "30";

  // Example filter for future multi-project separation.
  // Right now, all data is meong-bti so we just get the global events.
  const eventNames = [
    "quiz_start",
    "quiz_complete",
    "result_download",
    "shop_click",
    "dm_click",
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

    // Format response into a simple record
    const data: Record<string, number> = {};

    // Initialize all to 0 first to ensure order
    eventNames.forEach((name) => {
      data[name] = 0;
    });

    response.rows?.forEach((row) => {
      if (row.dimensionValues?.[0]?.value && row.metricValues?.[0]?.value) {
        data[row.dimensionValues[0].value] = parseInt(row.metricValues[0].value, 10);
      }
    });

    // Format for frontend consumption (array with labels)
    const funnelSteps = [
      { id: "quiz_start", label: "퀴즈 시작", count: data["quiz_start"] || 0 },
      { id: "quiz_complete", label: "완료 도달", count: data["quiz_complete"] || 0 },
      { id: "result_download", label: "이미지 저장", count: data["result_download"] || 0 },
      { id: "shop_click", label: "쇼핑몰 클릭", count: data["shop_click"] || 0 },
      { id: "dm_click", label: "DM 전송", count: data["dm_click"] || 0 },
    ];

    return NextResponse.json({ success: true, data: funnelSteps });
  } catch (error) {
    console.error("GA4 API Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch GA4 funnel data" },
      { status: 500 }
    );
  }
}
