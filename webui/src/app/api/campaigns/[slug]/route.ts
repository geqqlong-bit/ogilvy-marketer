import { NextRequest, NextResponse } from "next/server";
import { getCampaign, readCampaignFile } from "@/lib/campaigns";

export const dynamic = "force-dynamic";

export function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { searchParams } = request.nextUrl;
  const file = searchParams.get("file");

  if (file) {
    const content = readCampaignFile(params.slug, file);
    if (!content) return NextResponse.json({ error: "File not found" }, { status: 404 });
    return NextResponse.json({ content });
  }

  const campaign = getCampaign(params.slug);
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  return NextResponse.json(campaign);
}
