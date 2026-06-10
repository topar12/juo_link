import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * 관리자(어드민) 환경변수를 읽는 헬퍼.
 *
 * Cloudflare Workers 런타임에서는 요청 컨텍스트의 `env` 바인딩이 1순위이고,
 * 로컬 개발/빌드 등 컨텍스트 밖에서는 `process.env` 로 폴백한다.
 * `getCloudflareContext()` 는 요청 컨텍스트 밖에서 호출하면 throw 하므로 try/catch 로 감싼다.
 *
 * 주의: 비밀값(예: GA4_PRIVATE_KEY)을 절대 로그로 남기지 않는다.
 */
export function getAdminEnv(key: string): string | undefined {
  try {
    const { env } = getCloudflareContext();
    const value = (env as Record<string, unknown>)[key];
    if (typeof value === "string") {
      return value;
    }
  } catch {
    // 요청 컨텍스트 밖(빌드 타임 등)에서는 process.env 로 폴백한다.
  }

  return process.env[key];
}
