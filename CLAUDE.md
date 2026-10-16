# 项目约定

## React Query 键工厂

每个 feature 的 `queryKeys.ts` 按以下方式写：

- 文件顶部用模块私有常量声明层级根键（`xxxRoot`、`listRoot`、`detailRoot`），不作为对外成员导出。
- 导出对象只保留实际被调用的方法，不预留没人用的成员。
- 层级写在文件顶部注释里：模块 → 类型 → 商户 → 具体条件，失效按前缀匹配。
- 每个方法上方用一行注释说明用途（精确查询 / 批量失效等）。
- 只有单个键的模块，直接导出一个常量即可。

参考实现：`src/features/orders/queryKeys.ts`。

## 提交前验证

提交前钩子（`.githooks/pre-commit`）会依次执行 format:check、lint:styles、typecheck、lint、test，失败则不能提交。
