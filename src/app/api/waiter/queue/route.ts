import { NextRequest, NextResponse } from "next/server";
import { requireWaiter } from "@/lib/auth";
import { getWaiterQueue, serveDish } from "@/lib/waiter";

/** GET — dishes ready to run, plus the recently served log. */
export async function GET(request: NextRequest) {
  const auth = await requireWaiter(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const queue = await getWaiterQueue();
    return NextResponse.json({ success: true, data: queue });
  } catch (e: any) {
    console.error("waiter/queue GET error:", e);
    return NextResponse.json(
      { success: false, error: "Could not load the queue" },
      { status: 500 }
    );
  }
}

/**
 * PATCH — hand one ready dish to its table.
 *
 * Serves a single dish rather than a whole order: a table's starter can go out
 * while the main is still cooking. The waiter is the only role that can reach
 * the `served` state, which is enforced in the status flow rather than here.
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireWaiter(request);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const itemId = (body as any)?.itemId;
  if (!itemId || typeof itemId !== "string") {
    return NextResponse.json(
      { success: false, error: "itemId is required" },
      { status: 400 }
    );
  }

  const updated = await serveDish(itemId, auth.session.userId);
  if (!updated) {
    return NextResponse.json(
      {
        success: false,
        error: "This dish is not ready to serve, or was already served.",
      },
      { status: 409 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      id: updated.id,
      status: updated.status,
      servedAt: updated.served_at,
    },
  });
}