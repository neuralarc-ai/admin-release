export class ApiError extends Error {
  status: number;
  detail: string;
  payload: unknown;

  constructor(status: number, detail: string, payload: unknown) {
    super(detail || `HTTP ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
    this.payload = payload;
  }

  get isAuth(): boolean {
    return this.status === 401 || this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isValidation(): boolean {
    return this.status === 400 || this.status === 422;
  }

  get isMissingConfig(): boolean {
    return this.status === 503;
  }
}

export async function readErrorDetail(res: Response): Promise<{ detail: string; payload: unknown }> {
  const text = await res.text();
  if (!text) return { detail: `HTTP ${res.status}`, payload: null };
  try {
    const json = JSON.parse(text);
    const detail =
      typeof json?.detail === "string"
        ? json.detail
        : typeof json?.message === "string"
          ? json.message
          : `HTTP ${res.status}`;
    return { detail, payload: json };
  } catch {
    return { detail: text || `HTTP ${res.status}`, payload: text };
  }
}
