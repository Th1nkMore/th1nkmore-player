import { type NextRequest, NextResponse } from "next/server";
import { commitCoverDeployment } from "@/lib/cover-deploy.server";
import {
  CoverDeployContractError,
  parseCoverDeployDescriptor,
} from "@/lib/cover-deploy-contract";
import { coverDeployErrorResponse } from "@/lib/cover-deploy-route";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as {
      descriptor?: unknown;
      intent?: unknown;
    };
    if (
      typeof payload.intent !== "string" ||
      !payload.intent ||
      payload.intent.length > 4096
    ) {
      throw new CoverDeployContractError(
        "cover deployment intent is required.",
      );
    }
    const result = await commitCoverDeployment(
      parseCoverDeployDescriptor(payload.descriptor),
      payload.intent,
    );
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return coverDeployErrorResponse(error, "commit");
  }
}
