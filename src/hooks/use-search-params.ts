import { parseAsString, useQueryState } from "nuqs";

// TODO: 初期値を引数から設定

// TODO: パーサーの設定 (https://nuqs.dev/docs/parsers/built-in#literals)

// TODO: SEO 対策

export function useSearchParam(key: string) {
  return useQueryState(
    key,
    parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  );
}
