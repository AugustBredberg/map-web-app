import { vi } from "vitest";
import type { DbClient } from "@/lib/supabase";

/**
 * Build a minimal mock Supabase client that supports chaining:
 *   .from(table).select(...).eq(...).in(...).gte(...).lte(...).single()
 *   .from(table).select(...).eq(...).maybeSingle()
 *   .from(table).insert(...).select(...).single()
 *   .from(table).update(...).eq(...).select(...).single()
 *   .from(table).upsert(...).select(...).single()
 *   .from(table).delete().eq(...)
 *
 * Usage:
 *   const client = mockClient({ data: [...], error: null });
 *   const result = await fetchProjects(client);
 *
 * For multi-step flows (e.g. insert + then insert assignees), call
 * `mockClientSequence([response1, response2, ...])`.
 */

interface MockResponse {
  data: unknown;
  error: { message: string } | null;
}

function createChain(response: () => MockResponse) {
  const chain: Record<string, unknown> = {};
  const self = () => chain;

  chain.select = vi.fn().mockImplementation(self);
  chain.insert = vi.fn().mockImplementation(self);
  chain.update = vi.fn().mockImplementation(self);
  chain.upsert = vi.fn().mockImplementation(self);
  chain.delete = vi.fn().mockImplementation(self);
  chain.eq = vi.fn().mockImplementation(self);
  chain.order = vi.fn().mockImplementation(self);
  chain.in = vi.fn().mockImplementation(self);
  chain.gte = vi.fn().mockImplementation(self);
  chain.lte = vi.fn().mockImplementation(self);
  chain.single = vi.fn().mockImplementation(() => Promise.resolve(response()));
  chain.maybeSingle = vi.fn().mockImplementation(() => Promise.resolve(response()));

  // When awaited directly (no .single()), resolve the response
  chain.then = (resolve: (v: MockResponse) => void) => Promise.resolve(response()).then(resolve);

  return chain;
}

export function mockClient(response: MockResponse): DbClient {
  const chain = createChain(() => response);
  return {
    from: vi.fn().mockReturnValue(chain),
  } as unknown as DbClient;
}

export function mockClientSequence(responses: MockResponse[]): DbClient {
  let callIndex = 0;
  const chains: ReturnType<typeof createChain>[] = [];

  for (const r of responses) {
    chains.push(createChain(() => r));
  }

  return {
    from: vi.fn().mockImplementation(() => {
      const chain = chains[Math.min(callIndex, chains.length - 1)];
      callIndex++;
      return chain;
    }),
  } as unknown as DbClient;
}
