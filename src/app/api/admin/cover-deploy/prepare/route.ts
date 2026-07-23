import { type NextRequest, NextResponse } from "next/server";
import { prepareCoverDeployment } from "@/lib/cover-deploy.server";
import { parseCoverDeployDescriptor } from "@/lib/cover-deploy-contract";
import { coverDeployErrorResponse } from "@/lib/cover-deploy-route";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as {
      descriptor?: unknown;
      revisionConfirmed?: unknown;
    };
    const descriptor = parseCoverDeployDescriptor(payload.descriptor);
    const result = await prepareCoverDeployment(
      descriptor,
      payload.revisionConfirmed === true,
    );
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return coverDeployErrorResponse(error, "prepare");
  }
}
