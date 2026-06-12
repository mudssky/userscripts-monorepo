# Frontend Development Guidelines

> 本项目 userscript 前端开发规范索引。

---

## Overview

本目录记录当前仓库真实采用的 frontend / userscript 约定。后续 AI 编码任务在修改前端、userscript、构建脚本或共享工具前，应先阅读本索引和相关 guideline。

当前已有实际 UI 脚本包含 Vue userscript 与 React userscript。Vue 脚本遵守 Vue 专属组件、hook、状态管理约定；React 脚本遵守本文档中新增的 React userscript 小节，不能套用 Vue SFC、props/emits 或 Composition API 规则。

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | 多 userscript 目录、构建策略、命名和模块组织 | Filled |
| [Component Guidelines](./component-guidelines.md) | Vue/React userscript 组件、props、Shadow DOM 样式和组件职责 | Filled |
| [Hook Guidelines](./hook-guidelines.md) | Vue Composition API、React hooks 边界、功能副作用和命名规范 | Filled |
| [State Management](./state-management.md) | Vue/React userscript 状态、GM 持久化、单例和全局状态边界 | Filled |
| [Quality Guidelines](./quality-guidelines.md) | Biome、测试范围、禁用模式、审查清单 | Filled |
| [Type Safety](./type-safety.md) | TypeScript strict、类型组织、运行时校验和 any 限制 | Filled |

---

## Pre-Development Checklist

- 修改目录结构、脚本新增、构建方式或跨脚本边界前，阅读 [Directory Structure](./directory-structure.md)。
- 修改 Vue 组件、props、emits 或样式隔离时，阅读 [Component Guidelines](./component-guidelines.md)。
- 修改 Vue 页面逻辑、组合式函数、GM 存储或 DOM 副作用时，阅读 [Hook Guidelines](./hook-guidelines.md) 与 [State Management](./state-management.md)。
- 新增或修改 React 脚本时，阅读 [Component Guidelines](./component-guidelines.md)、[Hook Guidelines](./hook-guidelines.md) 与 [State Management](./state-management.md) 中的 React userscript 小节。
- 修改类型、配置校验、工具函数签名或用户输入处理时，阅读 [Type Safety](./type-safety.md)。
- 提交前或做质量检查时，阅读 [Quality Guidelines](./quality-guidelines.md)。

---

## Quality Check

- 是否遵守 `userscripts/<script-name>/` 独立脚本边界。
- 是否按脚本复杂度选择构建方式，且没有绕开 userscript metadata 生成。
- 是否区分框架范围：Vue 脚本遵守 Vue guideline，React 脚本需要独立补充 React guideline。
- 是否避免新增显式 `any`，并为函数参数和返回值提供类型与说明。
- 是否将副作用集中在 hook 或工具函数中，并提供清理路径。
- 是否只为业务逻辑、组件行为、工具函数和配置校验补测试，不为纯页面结构或 CSS 样式写测试。

---

**Language**: All documentation should be written in **Chinese**.
