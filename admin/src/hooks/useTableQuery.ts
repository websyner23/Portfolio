import { useMemo, useState } from "react";
import { TQueryParams } from "../types";

/**
 * Keeps antd Table pagination/search/filter state in the shape the backend
 * QueryBuilder expects (page, limit, searchTerm, sort, …).
 */
export const useTableQuery = (initial: TQueryParams = {}) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<TQueryParams>(initial);

  const params = useMemo(() => {
    const out: TQueryParams = { page, limit, ...filters };
    if (searchTerm.trim()) out.searchTerm = searchTerm.trim();
    Object.keys(out).forEach((k) => {
      if (out[k] === undefined || out[k] === "") delete out[k];
    });
    return out;
  }, [page, limit, searchTerm, filters]);

  const setFilter = (key: string, value: string | number | undefined) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const search = (value: string) => {
    setPage(1);
    setSearchTerm(value);
  };

  return {
    params,
    page,
    limit,
    searchTerm,
    filters,
    setPage,
    setLimit,
    setFilter,
    setFilters,
    search,
  };
};
