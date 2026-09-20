export const MAX_REQUEST_BODY_BYTES = 2 * 1024 * 1024;

export class RequestBodyError extends Error {
  readonly status: 400 | 413;

  constructor(message: string, status: 400 | 413) {
    super(message);
    this.name = "RequestBodyError";
    this.status = status;
  }
}

export async function readJsonBody<T>(request: Request, maxBytes = MAX_REQUEST_BODY_BYTES): Promise<T> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number.isFinite(Number(contentLength)) && Number(contentLength) > maxBytes) {
    throw new RequestBodyError("Request body is too large.", 413);
  }

  if (!request.body) throw new RequestBodyError("Request body must contain valid JSON.", 400);

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new RequestBodyError("Request body is too large.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  try {
    const text = new TextDecoder().decode(concatenate(chunks, totalBytes));
    return JSON.parse(text) as T;
  } catch {
    throw new RequestBodyError("Request body must contain valid JSON.", 400);
  }
}

function concatenate(chunks: Uint8Array[], totalBytes: number) {
  const result = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}
