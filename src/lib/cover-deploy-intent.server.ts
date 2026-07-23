import { jwtVerify, SignJWT } from "jose";
import { getAdminAuthSecret } from "@/lib/auth";

const COVER_DEPLOY_AUDIENCE = "sonic-ide-cover-deploy";
const COVER_DEPLOY_ISSUER = "sonic-ide";
const COVER_DEPLOY_SUBJECT = "cover-upload-intent";
export const COVER_DEPLOY_INTENT_TTL_SECONDS = 15 * 60;

export type CoverDeployIntent = {
  packageId: string;
  projectId: string;
  audioSha256: string;
  audioSize: number;
  manifestSha256: string;
  lyricsSha256: string;
  objectKey: string;
  publicUrl: string;
  revisionConfirmed: boolean;
};

export async function signCoverDeployIntent(
  intent: CoverDeployIntent,
): Promise<{ token: string; expiresAt: string }> {
  const expiresAtSeconds =
    Math.floor(Date.now() / 1000) + COVER_DEPLOY_INTENT_TTL_SECONDS;
  const token = await new SignJWT(intent)
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(COVER_DEPLOY_AUDIENCE)
    .setIssuer(COVER_DEPLOY_ISSUER)
    .setSubject(COVER_DEPLOY_SUBJECT)
    .setIssuedAt()
    .setExpirationTime(expiresAtSeconds)
    .sign(getAdminAuthSecret());
  return {
    token,
    expiresAt: new Date(expiresAtSeconds * 1000).toISOString(),
  };
}

export async function verifyCoverDeployIntent(
  token: string,
): Promise<CoverDeployIntent> {
  const { payload } = await jwtVerify(token, getAdminAuthSecret(), {
    algorithms: ["HS256"],
    audience: COVER_DEPLOY_AUDIENCE,
    issuer: COVER_DEPLOY_ISSUER,
    subject: COVER_DEPLOY_SUBJECT,
  });
  const intent = payload as Partial<CoverDeployIntent>;
  if (
    typeof intent.packageId !== "string" ||
    typeof intent.projectId !== "string" ||
    typeof intent.audioSha256 !== "string" ||
    typeof intent.audioSize !== "number" ||
    typeof intent.manifestSha256 !== "string" ||
    typeof intent.lyricsSha256 !== "string" ||
    typeof intent.objectKey !== "string" ||
    typeof intent.publicUrl !== "string" ||
    typeof intent.revisionConfirmed !== "boolean"
  ) {
    throw new Error("Cover deployment intent is incomplete.");
  }
  return intent as CoverDeployIntent;
}
