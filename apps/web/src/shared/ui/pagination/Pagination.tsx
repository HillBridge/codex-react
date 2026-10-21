import { Button } from "@/shared/ui/button";
import styles from "./Pagination.module.css";

interface PaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, total, pageSize, onChange }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className={styles.pagination}>
      <Button
        isDisabled={page <= 1}
        onPress={() => onChange(page - 1)}
        variant="secondary"
      >
        上一页
      </Button>
      <span>
        第 {page} / {pages} 页，共 {total} 条
      </span>
      <Button
        isDisabled={page >= pages}
        onPress={() => onChange(page + 1)}
        variant="secondary"
      >
        下一页
      </Button>
    </div>
  );
}
