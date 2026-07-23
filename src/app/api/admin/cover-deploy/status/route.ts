import { type NextRequest, NextResponse } from "next/server";
import { getCoverDeploymentStatus } from "@/lib/cover-deploy.server";
import { CoverDeployContractError } from "@/lib/cover-deploy-contract";
import { coverDeployErrorResponse } from "@/lib/cover-deploy-route";

export async function GET(request: NextRequest) {
  try {
    const packageId = request.nextUrl.searchParams.get("packageId")?.trim();
    const projectId = request.nextUrl.searchParams.get("projectId")?.trim();
    if (!packageId || packageId.length > 128) {
      throw new CoverDeployContractError(
        "cover deployment packageId is required.",
      );
    }
    if (projectId && projectId.length > 128) {
      throw new CoverDeployContractError(
        "cover deployment projectId is invalid.",
      );
    }
    return NextResponse.json(
      await getCoverDeploymentStatus(packageId, projectId),
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    return coverDeployErrorResponse(error, "status check");
  }
}
