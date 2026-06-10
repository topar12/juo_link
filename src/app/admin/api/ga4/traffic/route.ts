import { NextResponse } from "next/server";
import { runGa4Report } from "@/features/admin/lib/ga4";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = searchParams.get("days") || "30";

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
          name: "sessionDefaultChannelGroup",
        },
      ],
      metrics: [
        {
          name: "activeUsers",
        },
      ],
      // Sort by activeUsers descending
      orderBys: [
        {
          metric: {
            metricName: "activeUsers",
          },
          desc: true,
        },
      ],
      limit: 5,
    });

    const sources =
      response.rows?.map((row) => {
        const channel = row.dimensionValues?.[0]?.value || "Unknown";
        const users = parseInt(row.metricValues?.[0]?.value || "0", 10);

        // Map GA4 default channel groups to Korean friendly names
        let label = channel;
        if (channel === "Organic Social") label = "인스타그램 / 소셜";
        if (channel === "Direct") label = "직접 접속 (링크)";
        if (channel === "Referral") label = "추천 / 리퍼럴";
        if (channel === "Organic Search") label = "검색 유입";
        if (channel === "Unassigned") label = "기타 / 알 수 없음";

        return {
          id: channel,
          label,
          users,
        };
      }) || [];

    return NextResponse.json({ success: true, data: sources });
  } catch (error) {
    console.error("GA4 API Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch GA4 sources data" },
      { status: 500 }
    );
  }
}
