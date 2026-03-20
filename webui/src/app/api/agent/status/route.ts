import { NextRequest } from "next/server";
import { getAgentStatus } from "@/lib/campaigns";

export const dynamic = "force-dynamic";

/** SSE endpoint — streams agent status updates. */
export function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("campaign") ?? undefined;

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      function send() {
        if (closed) return;
        try {
          const status = getAgentStatus(slug);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(status)}\n\n`)
          );
        } catch {
          // Ignore read errors during polling
        }
      }

      // Immediate first push
      send();

      // Poll every 2 seconds
      const interval = setInterval(send, 2000);

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
