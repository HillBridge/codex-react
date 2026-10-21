// 含逗号、引号、换行的单元格需要加引号，引号本身重复一次。
export function escapeCsvCell(value: string) {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}
