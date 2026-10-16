import type { ReactNode } from "react";
import { Cell, Column, Row, Table, TableBody, TableHeader } from "react-aria-components";
import styles from "./DataTable.module.css";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  isRowHeader?: boolean;
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
              <Cell key={column.key}>{column.cell(row)}</Cell>
            ))}
          </Row>
        ))}
      </TableBody>
    </Table>
  );
}
