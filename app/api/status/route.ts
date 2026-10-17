import { isMock } from "@/lib/auth";

export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json({
    mock: !process.env.AI_ROUTER_API_KEY,
    hasEnvKey: !!process.env.AI_ROUTER_API_KEY,
    baseUrl: process.env.AI_ROUTER_BASE_URL || "https://api.openai.com/v1",
    app: "router-console",
    version: "1.1.0",
  });
}
