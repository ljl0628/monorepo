# TypeScript Monorepo 教学文档

本系列文档面向前端/全栈初学者，从零讲解如何理解和使用本 monorepo 项目。

## 学习路线

| 章节 | 内容 | 难度 |
|------|------|------|
| [01 - Monorepo 概念介绍](./01-Monorepo概念介绍.md) | 什么是 monorepo，为什么用 monorepo | 入门 |
| [02 - 项目结构详解](./02-项目结构详解.md) | 目录布局、packages 与 apps 的区别 | 入门 |
| [03 - pnpm Workspaces](./03-pnpm-Workspaces.md) | workspace 协议、依赖管理机制 | 基础 |
| [04 - TypeScript 项目引用](./04-TypeScript项目引用.md) | tsconfig 继承链、composite、references | 基础 |
| [05 - Turborepo 构建编排](./05-Turborepo构建编排.md) | 任务依赖、缓存机制、turbo.json | 中级 |
| [06 - Shared 共享包](./06-Shared共享包.md) | 类型定义、工具函数的设计与使用 | 中级 |
| [07 - UI 组件库](./07-UI组件库.md) | React 组件封装、peerDependencies | 中级 |
| [08 - Web 前端应用](./08-Web前端应用.md) | Vite 配置、别名解析、React 19 | 中级 |
| [09 - Server 后端应用](./09-Server后端应用.md) | Express API、与 shared 包集成 | 中级 |
| [10 - 快速上手指南](./10-快速上手指南.md) | 安装依赖、启动开发、构建部署 | 实操 |
| [11 - 从零搭建 Monorepo](./11-从零搭建Monorepo.md) | 从空目录到完整项目的搭建流程 | 实操 |

## 前置知识

阅读本文档前，你需要具备以下基础：

- **JavaScript / TypeScript** 基础语法
- **Node.js** 和 npm 的基本使用
- **React** 的基本概念（组件、props、JSX）
- **命令行** 的基本操作（cd、ls、mkdir 等）

如果上述内容你不熟悉，建议先花 1-2 周学习基础知识后再来。

## 项目技术栈

| 技术 | 用途 | 版本 |
|------|------|------|
| pnpm | 包管理器 | 9.x |
| Turborepo | 构建编排与缓存 | 2.x |
| TypeScript | 类型系统 | 5.x |
| React | 前端 UI 框架 | 19.x |
| Vite | 前端开发服务器与构建工具 | 4.x |
| Express | 后端 API 框架 | 4.x |

## 开始学习

如果你是第一次接触 monorepo，请从 [第 1 章](./01-Monorepo概念介绍.md) 开始，按顺序阅读。如果你已经有 monorepo 经验，可以直接跳到感兴趣的章节。
