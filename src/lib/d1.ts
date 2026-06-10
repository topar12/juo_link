import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * 최소 D1 인터페이스. `wrangler types` 로 생성되는 전역 타입에 의존하지 않고도
 * 타입 안전하게 쓰기 위한 정의이며, 실제 Cloudflare D1 런타임 객체가 이 형태를 만족한다.
 */
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<unknown>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  first<T = unknown>(): Promise<T | null>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

/** 현재 요청의 Cloudflare 컨텍스트에서 D1 바인딩(DB)을 가져온다. */
export function getDb(): D1Database {
  const { env } = getCloudflareContext();
  const db = (env as Record<string, unknown>).DB as D1Database | undefined;
  if (!db) {
    throw new Error("D1 binding 'DB' is not available");
  }
  return db;
}
