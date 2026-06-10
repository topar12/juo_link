import { getAdminEnv } from "./env";

const DEFAULT_CLIENT_EMAIL = "ga4-dashboard@juo-company-491405.iam.gserviceaccount.com";
const DEFAULT_PROPERTY_ID = "530064801";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GA4_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const GA4_ENDPOINT = "https://analyticsdata.googleapis.com/v1beta";

/**
 * 멍-BTI(기본) GA4 속성 ID.
 *
 * 원본은 모듈 로드 시점에 `process.env` 로 값을 고정했지만, Cloudflare Workers 에서는
 * env 바인딩이 모듈 초기화 시점에 없으므로 요청 시점에 평가하는 getter 로 노출한다.
 * (export 이름과 폴백 동작은 동일하게 유지)
 */
export const PROPERTY_ID = DEFAULT_PROPERTY_ID;

const encoder = new TextEncoder();

type Ga4DateRange = {
  startDate: string;
  endDate: string;
};

type Ga4Dimension = {
  name: string;
};

type Ga4Metric = {
  name: string;
};

type Ga4OrderBy =
  | {
      metric: {
        metricName: string;
      };
      desc?: boolean;
    }
  | {
      dimension: {
        dimensionName: string;
      };
      desc?: boolean;
    };

type Ga4InListFilter = {
  values: string[];
};

type Ga4StringFilter = {
  value: string;
  matchType?: "EXACT" | "BEGINS_WITH" | "ENDS_WITH" | "CONTAINS";
};

type Ga4Filter = {
  fieldName: string;
  inListFilter?: Ga4InListFilter;
  stringFilter?: Ga4StringFilter;
};

export type Ga4FilterExpression = {
  filter?: Ga4Filter;
  andGroup?: {
    expressions: Ga4FilterExpression[];
  };
};

export type Ga4RunReportRequest = {
  dateRanges: Ga4DateRange[];
  dimensions: Ga4Dimension[];
  metrics: Ga4Metric[];
  orderBys?: Ga4OrderBy[];
  limit?: number;
  dimensionFilter?: Ga4FilterExpression;
};

export class MissingGa4PropertyError extends Error {
  constructor(envVarName: string) {
    super(`${envVarName} is not configured`);
    this.name = "MissingGa4PropertyError";
  }
}

type Ga4RunReportResponse = {
  rows?: Array<{
    dimensionValues?: Array<{ value?: string }>;
    metricValues?: Array<{ value?: string }>;
  }>;
};

function base64UrlEncode(input: string | Uint8Array | ArrayBuffer) {
  const bytes =
    typeof input === "string"
      ? encoder.encode(input)
      : input instanceof Uint8Array
        ? input
        : new Uint8Array(input);

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function pemToArrayBuffer(pem: string) {
  const normalized = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");

  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

async function importPrivateKey(privateKey: string) {
  return crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKey),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );
}

async function getAccessToken() {
  const clientEmail = getAdminEnv("GA4_CLIENT_EMAIL") || DEFAULT_CLIENT_EMAIL;
  // PEM 개인키는 비밀값 — env 에서 읽고 `\n` 이스케이프를 실제 줄바꿈으로 복원한다. (로그 금지)
  const privateKey = getAdminEnv("GA4_PRIVATE_KEY")?.replace(/\\n/gm, "\n");

  if (!privateKey) {
    throw new Error("GA4_PRIVATE_KEY is not configured");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      iss: clientEmail,
      scope: GA4_SCOPE,
      aud: TOKEN_URL,
      exp: now + 3600,
      iat: now,
    })
  );

  const unsignedJwt = `${header}.${payload}`;
  const privateCryptoKey = await importPrivateKey(privateKey);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateCryptoKey,
    encoder.encode(unsignedJwt)
  );

  const assertion = `${unsignedJwt}.${base64UrlEncode(signature)}`;
  const tokenResponse = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const tokenText = await tokenResponse.text();
  let tokenJson: { access_token?: string; error?: string; error_description?: string };

  try {
    tokenJson = JSON.parse(tokenText);
  } catch {
    throw new Error(`Failed to parse OAuth response: ${tokenText.slice(0, 200)}`);
  }

  if (!tokenResponse.ok || !tokenJson.access_token) {
    throw new Error(tokenJson.error_description || tokenJson.error || "Failed to obtain GA4 access token");
  }

  return tokenJson.access_token;
}

export async function runGa4Report(body: Ga4RunReportRequest): Promise<Ga4RunReportResponse> {
  // 멍-BTI 기본 속성 — env(GA4_PROPERTY_ID)를 요청 시점에 평가한다.
  const propertyId = getAdminEnv("GA4_PROPERTY_ID") || DEFAULT_PROPERTY_ID;
  return runGa4ReportForProperty(propertyId, body);
}

export function getGa4PropertyIdForProject(projectId: string) {
  if (projectId === "meong-bti") {
    return getAdminEnv("GA4_PROPERTY_ID") || DEFAULT_PROPERTY_ID;
  }

  if (projectId === "juo-linkinbio") {
    const propertyId = getAdminEnv("GA4_LINKINBIO_PROPERTY_ID");
    if (!propertyId) {
      throw new MissingGa4PropertyError("GA4_LINKINBIO_PROPERTY_ID");
    }
    return propertyId;
  }

  throw new Error(`Unknown GA4 project: ${projectId}`);
}

export async function runGa4ReportForProperty(
  propertyId: string,
  body: Ga4RunReportRequest
): Promise<Ga4RunReportResponse> {
  const accessToken = await getAccessToken();
  const response = await fetch(`${GA4_ENDPOINT}/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let json: Ga4RunReportResponse & { error?: { message?: string } };

  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Failed to parse GA4 response: ${text.slice(0, 200)}`);
  }

  if (!response.ok) {
    throw new Error(json.error?.message || "Failed to fetch GA4 report");
  }

  return json;
}
