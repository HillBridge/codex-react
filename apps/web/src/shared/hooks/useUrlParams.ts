import { useSearchParams } from "react-router";

// 列表页的 URL 查询参数读写：改筛选条件时回到第一页。
export function useUrlParams() {
  const [params, setParams] = useSearchParams();

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete("page");
    setParams(next);
  };

  const setPage = (page: number) => {
    const next = new URLSearchParams(params);
    next.set("page", String(page));
    setParams(next);
  };

  const reset = () => setParams({});

  return { params, update, setPage, reset };
}
