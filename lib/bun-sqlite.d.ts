declare module "bun:sqlite" {
  export type SQLiteValue = string | number | bigint | Uint8Array | null;

  export interface Statement<ReturnType = unknown, ParamsType = unknown> {
    all(params?: ParamsType): ReturnType[];
    get(params?: ParamsType): ReturnType | null;
    run(params?: ParamsType): unknown;
  }

  export class Database {
    constructor(filename?: string, options?: { readonly?: boolean; create?: boolean; strict?: boolean });
    query<ReturnType = unknown, ParamsType = unknown>(sql: string): Statement<ReturnType, ParamsType>;
    prepare<ReturnType = unknown, ParamsType = unknown>(sql: string): Statement<ReturnType, ParamsType>;
    run(sql: string): unknown;
    exec(sql: string): unknown;
    transaction<TArgs extends unknown[], TResult>(fn: (...args: TArgs) => TResult): ((...args: TArgs) => TResult) & {
      deferred: (...args: TArgs) => TResult;
      immediate: (...args: TArgs) => TResult;
      exclusive: (...args: TArgs) => TResult;
    };
    close(): void;
  }
}
