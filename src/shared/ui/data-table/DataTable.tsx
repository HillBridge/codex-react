import type { ReactNode } from "react";
import { Cell, Column, Row, Table, TableBody, TableHeader } from "react-aria-components";
import styles from "./DataTable.module.css";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  isRowHeader?: boolean;
  // 操作列：窄屏卡片里不显示列名，靠右排布。
  isActions?: boolean;
  cell: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  ariaLabel: string;
  rows: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => string;
}

export function DataTable<T>({ ariaLabel, rows, columns, getRowId }: DataTableProps<T>) {
  return (
    // 宽屏是普通表格；窄屏由 CSS 把每行渲染成卡片（单元格用 data-label 显示列名），语义与键盘行为不变。
    <div className={styles.scroll}>
      <Table aria-label={ariaLabel} className={styles.table}>
        <TableHeader>
          {columns.map((column) => (
            <Column key={column.key} id={column.key} isRowHeader={column.isRowHeader}>
              {column.header}
            </Column>
          ))}
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <Row id={getRowId(row)} key={getRowId(row)}>
              {columns.map((column) => (
                <Cell
                  key={column.key}
                  data-actions={column.isActions || undefined}
                  data-label={column.header}
                >
                  {column.cell(row)}
                </Cell>
              ))}
            </Row>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
