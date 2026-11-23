# 01 - Monorepo 概念介绍

## 什么是 Monorepo？

**Monorepo**（Mono + Repository）就是**把多个相关的项目放在同一个 Git 仓库里**。

与之相对的是 **Polyrepo**（多仓库），每个项目各自有独立的 Git 仓库。

举个例子：

```
# Polyrepo（多仓库）                    # Monorepo（单仓库）
company/                                 company/
├── frontend-repo/      ← Git 仓库 1     └── monorepo/    ← 唯一的 Git 仓库
│   ├── package.json                        ├── apps/
│   └── src/                                │   ├── frontend/
│       └── ...                             │   │   ├── package.json
├── backend-repo/       ← Git 仓库 2       │   │   └── src/
│   ├── package.json                        │   └── backend/
│   └── src/                                │       ├── package.json
│       └── ...                             └── packages/
└── shared-lib-repo/     ← Git 仓库 3         ├── shared-types/
    ├── package.json                            └── ui-components/
    └── src/
        └── ...
```

## 为什么用 Monorepo？

### 1. 代码共享变得简单

在 polyrepo 中，如果你想在前端项目和后端项目中共享一个 `User` 类型，你需要：

1. 创建一个独立的 npm 包
2. 发布到 npm registry（或配置私有 registry）
3. 在前端和后端分别安装这个包
4. 每次修改类型，都要重新发布和更新版本

在 monorepo 中，你只需要：

1. 在 `packages/shared` 中定义类型
2. 在前端和后端的 `package.json` 中添加一行依赖
3. 修改类型后，其他项目立即获得最新版本

### 2. 原子化提交

假设你要给前端加一个新功能，这个功能需要后端提供一个新的 API 字段。在 polyrepo 中，你需要：

- 先在后端仓库提交代码 → 发布新版本
- 再在前端仓库安装新版本 → 提交代码
- 两个 PR 需要分别 review 和合并

在 monorepo 中，你可以**一个 commit 同时修改后端和前端**，确保改动是完整且一致的。

### 3. 统一的工具链和代码规范

所有项目共享同一个：

- TypeScript 配置（`tsconfig.json`）
- ESLint 规则
- 依赖版本（React 19 统一使用）
- 构建工具

不会出现"A 项目用 React 18，B 项目用 React 19"的混乱情况。

### 4. 更容易做大规模重构

你想重命名一个函数？在 monorepo 中，所有引用都在同一个仓库里，IDE 可以全局搜索替换。在 polyrepo 中，你需要逐个仓库去改。

## Monorepo 的缺点

| 缺点 | 说明 | 本项目的解决方案 |
|------|------|------------------|
| 仓库体积大 | 所有代码放一起，clone 慢 | 使用 Turborepo 缓存，减少重复构建 |
| CI/CD 复杂 | 如何只构建变更的项目？ | Turborepo 自动检测变更，只构建受影响的部分 |
| 依赖管理复杂 | 项目间互相依赖容易循环 | Turborepo 的 `dependsOn` 确保正确的构建顺序 |
| 代码权限粗粒度 | 无法按仓库设置权限 | 通过 `packages/` 和 `apps/` 目录划分来缓解 |

## 本项目的 Monorepo 技术选型

本项目选择了业界主流的三件套：

```
pnpm workspaces  →  管理 workspace 之间的依赖关系
    +
Turborepo         →  编排构建顺序，提供本地缓存
    +
TypeScript 项目引用 →  让 TypeScript 理解项目间的类型关系
```

**为什么不选其他方案？**

| 方案 | 优点 | 缺点 |
|------|------|------|
| **pnpm + Turborepo**（本项目） | 轻量、快速、社区活跃 | 需要了解多个工具 |
| Nx | 功能强大，内置很多插件 | 学习曲线陡，配置复杂 |
| Lerna | 老牌工具 | 已不太活跃，功能被 Turborepo 覆盖 |
| Rush | 微软出品，适合超大规模 | 过于复杂，小项目用不上 |

## 总结

Monorepo 的核心思想就是**把相关的项目放在一起管理**。它不是银弹，但对于前端+后端+共享库的典型全栈项目来说，monorepo 能显著提升开发效率。

下一章，我们将看看本项目的具体目录结构 → [02 - 项目结构详解](./02-项目结构详解.md)
