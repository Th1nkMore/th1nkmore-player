import { S3Client } from "@aws-sdk/client-s3";

type NodeReadableStream = NodeJS.ReadableStream & {
  on: (event: string, listener: (...args: unknown[]) => void) => void;
};

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
};

export type ErrorInfo = {
  name?: string;
  message: string;
  stack?: string;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function isNodeReadableStream(value: unknown): value is NodeReadableStream {
  return (
    typeof value === "object" &&
    value !== null &&
    "on" in value &&
    typeof (value as { on?: unknown }).on === "function"
  );
}

export function getR2Config(): R2Config {
  const accountId = getRequiredEnv("R2_ACCOUNT_ID");
  const accessKeyId = getRequiredEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = getRequiredEnv("R2_SECRET_ACCESS_KEY");
  const bucketName = getRequiredEnv("R2_BUCKET_NAME");
  const publicUrl =
    process.env.R2_PUBLIC_URL ||
    `https://${accountId}.r2.cloudflarestorage.com/${bucketName}`;

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicUrl,
  };
}

export function createR2Client(config: R2Config): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export async function streamToString(body: unknown): Promise<string> {
  if (!body) return "";
  if (typeof body === "string") return body;
  if (body instanceof Blob) return await body.text();

  if (body instanceof ReadableStream) {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let result = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
      }
    } finally {
      reader.releaseLock();
    }

    return result;
  }

  if (isNodeReadableStream(body)) {
    const chunks: Buffer[] = [];
    return await new Promise((resolve, reject) => {
      body.on("data", (chunk: unknown) => {
        if (chunk instanceof Buffer) {
          chunks.push(chunk);
        }
      });
      body.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      body.on("error", (error: unknown) => reject(error));
    });
  }

  return String(body);
}

export function getErrorInfo(error: unknown): ErrorInfo {
  if (error instanceof Error) {
    const typedError = error as Error & { name?: string };
    return {
      name: typedError.name,
      message: typedError.message,
      stack: typedError.stack,
    };
  }

  if (typeof error === "object" && error !== null) {
    const candidate = error as {
      name?: unknown;
      message?: unknown;
      stack?: unknown;
    };
    return {
      name: typeof candidate.name === "string" ? candidate.name : undefined,
      message:
        typeof candidate.message === "string"
          ? candidate.message
          : String(error),
      stack: typeof candidate.stack === "string" ? candidate.stack : undefined,
    };
  }

  return {
    message: String(error),
  };
}
