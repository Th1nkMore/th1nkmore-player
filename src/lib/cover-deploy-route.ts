import { errors as JoseErrors } from "jose";
import { NextResponse } from "next/server";
import {
  CoverDeployConflictError,
  CoverDeployValidationError,
} from "@/lib/cover-deploy.server";
import { CoverDeployContractError } from "@/lib/cover-deploy-contract";

export function coverDeployErrorResponse(error: unknown, operation: string) {
  if (
    error instanceof CoverDeployContractError ||
    error instanceof CoverDeployValidationError ||
    error instanceof JoseErrors.JOSEError ||
    error instanceof SyntaxError
  ) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof CoverDeployConflictError) {
    return NextResponse.json(
      {
        error: error.message,
        ...(error.relatedSongId ? { relatedSongId: error.relatedSongId } : {}),
      },
      { status: 409 },
    );
  }
  console.error(`Cover deployment ${operation} failed:`, error);
  return NextResponse.json(
    { error: `Cover deployment ${operation} failed.` },
    { status: 500 },
  );
}
