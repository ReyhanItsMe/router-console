import { isMock } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    mock: isMock(),
    baseUrl: process.env.AI_ROUTER_BASE_URL || "https://api.openai.com/v1",
    app: "router-console",
    version: "1.0.0",
  });
}
