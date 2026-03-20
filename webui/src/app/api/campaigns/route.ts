import { NextResponse } from "next/server";
import { listCampaigns } from "@/lib/campaigns";

export const dynamic = "force-dynamic";

export function GET() {
  const campaigns = listCampaigns();
  return NextResponse.json(campaigns);
}
