# Type Safety

> 本项目 TypeScript 类型组织、运行时校验与禁用模式。

---

## Overview

当前脚本使用 TypeScript strict 模式。功能内共享类型集中放在同功能目录的 `types.ts`，工具函数和配置函数尽量显式标注参数与返回值。

当前示例：

- `userscripts/highlight-keywords/src/views/app/types.ts`：定义 `RuleItem`、`HighlightState`、`DebugInfo`、`DynamicColors` 等功能类型。
- `userscripts/highlight-keywords/src/views/app/config.ts`：`validateConfig()` 返回 `[boolean, string]` 校验结果。
- `userscripts/highlight-keywords/src/utils/create-shadow-container.ts`：定义 Shadow DOM 容器配置和返回值类型。
- `tsconfig.scripts.json`：根级脚本使用 strict TypeScript 检查。

---

## Type Organization

- 功能级类型放在 `src/views/<feature>/types.ts`。
- 只服务单个工具模块的类型可以和工具函数放在同一文件中，例如 `ShadowContainerOptions`。
- props / emits 类型在组件内部用本地 `interface Props`、`interface Emits` 定义。
- 跨模块复用的领域对象必须从 `types.ts` 引入，避免在多个组件重复声明。
- 导出的函数必须标注参数类型和返回值类型。
- 新增或修改函数时，需要补充标准 JSDoc，包含 `@param` 和 `@returns`；简单事件转发函数可保持短小，但公共工具函数必须完整说明。

---

## Validation

当前没有使用 Zod、Yup、AJV 等运行时校验库。`highlight-keywords` 因打包体积考虑，使用手写校验函数处理用户 JSON 配置。

- 用户可编辑配置必须做运行时校验，不能只依赖 TypeScript 类型断言。
- 校验函数返回结构应清晰表达成功与错误信息；当前示例为 `[boolean, string]`。
- JSON.parse 结果进入业务前必须校验，例如 `handleUpdateConfig()` 会先调用 `validateConfig()`。
- 若未来配置结构明显复杂，再讨论是否引入轻量 schema 校验库。

---

## Common Patterns

- 对象结构使用 `interface`，例如 `RuleItem`、`DebugInfo`。
- 字符串枚举使用字面量联合类型，例如日志等级 `'info' | 'warn' | 'error'`。
- 字典结构使用索引类型，例如 `ThemePresets`。
- DOM API 类型显式标注，例如 `HTMLStyleElement`、`HTMLElement`、`ShadowRoot`。
- 配置常量尽量通过类型约束，例如 `themePresets: ThemePresets`。

---

## Forbidden Patterns

- Biome 配置中 `noExplicitAny` 为 error；新增代码不要使用 `any`。
- 历史代码里存在少量 `any` 用于第三方或浏览器扩展对象兼容，修改相关代码时应逐步收窄为明确接口或 `unknown` 后再缩窄。
- 不要用类型断言绕过用户输入校验。
- 不要在多个文件重复定义同一个领域类型。
- 不要把第三方库对象随意写成 `any`；能从库导入类型时优先导入类型。
