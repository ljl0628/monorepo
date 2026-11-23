# 06 - Shared 共享包

## 概述

`packages/shared` 是整个 monorepo 的**基础包**，它不依赖任何其他内部包，但被所有其他包依赖。

它的职责是提供：

- **共享类型定义** — 比如 `User`、`ApiResponse<T>`
- **共享工具函数** — 比如 `createResponse()`

这样前端和后端可以使用**完全相同的数据类型**，避免类型不一致的问题。

## 目录结构

```
packages/shared/
├── src/
│   └── index.ts          # 包的入口，导出所有公共 API
├── package.json
└── tsconfig.json
```

非常简洁——一个共享包只需要一个 `index.ts` 作为统一出口。

## 源码解析

```typescript
// packages/shared/src/index.ts

// 1. 泛型接口：统一的 API 响应格式
export interface ApiResponse<T = unknown> {
  code: number;     // 业务状态码，0 表示成功
  data: T;          // 响应数据，类型由泛型 T 决定
  message: string;  // 提示信息
}

// 2. 实体类型：用户
export interface User {
  id: string;
  name: string;
  email: string;
}

// 3. 工具函数：创建标准响应
export function createResponse<T>(data: T, message = "success"): ApiResponse<T> {
  return {
    code: 0,
    data,
    message,
  };
}
```

### 逐行解析

#### `ApiResponse<T>` — 泛型接口

```typescript
export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}
```

- `T` 是**泛型参数**，表示响应数据的类型
- `T = unknown` 是默认值，不传时 `data` 的类型是 `unknown`
- 这样后端可以写 `ApiResponse<User[]>` 表示返回用户列表
- 前端看到这个类型就知道响应的具体结构

#### `createResponse<T>()` — 泛型函数

```typescript
export function createResponse<T>(data: T, message = "success"): ApiResponse<T> {
  return { code: 0, data, message };
}
```

- 接收任意类型的数据 `data`，包装成统一的 `ApiResponse` 格式
- TypeScript 会自动推断 `T` 的类型，你不需要手动写
- 例如 `createResponse([user1, user2])` 自动推断为 `ApiResponse<User[]>`

## package.json 配置

```json
{
  "name": "@monorepo/shared",
  "version": "1.0.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -b",
    "clean": "rm -rf dist *.tsbuildinfo"
  },
  "devDependencies": {
    "typescript": "^5.7.0"
  }
}
```

### 关键字段解释

| 字段 | 值 | 含义 |
|------|----|------|
| `"main"` | `"./dist/index.js"` | CommonJS 入口（兼容旧工具） |
| `"types"` | `"./dist/index.d.ts"` | TypeScript 类型声明入口 |
| `"exports"` | `{ ".": { ... } }` | 现代 ESM 入口（推荐使用） |
| `"private": true` | — | 标记为私有包，不会误发布到 npm |

**`exports` 字段** 是现代 Node.js 的标准方式来声明包的入口：

```json
"exports": {
  ".": {
    "types": "./dist/index.d.ts",    // TypeScript 先找类型
    "import": "./dist/index.js"      // 然后找 JS 代码
  }
}
```

`"."` 表示 `import { something } from "@monorepo/shared"` 的导入路径。如果将来你想暴露子路径，可以扩展：

```json
"exports": {
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js"
  },
  "./utils": {
    "types": "./dist/utils/index.d.ts",
    "import": "./dist/utils/index.js"
  }
}
```

## 如何被其他包使用

### 在 server 中使用

```typescript
// apps/server/src/index.ts
import { createResponse } from "@monorepo/shared";

app.get("/api/users", (_req, res) => {
  const users = [
    { id: "1", name: "Alice", email: "alice@example.com" },
  ];
  res.json(createResponse(users));
  // TypeScript 知道返回值是 ApiResponse<{id: string; name: string; email: string}[]>
});
```

### 在 web 中使用

```typescript
// apps/web/src/main.tsx
import { createResponse } from "@monorepo/shared";

const data = createResponse({ name: "Monorepo" });
// TypeScript 推断 data 的类型为 ApiResponse<{ name: string }>
```

## 共享包的设计原则

1. **零外部依赖** — shared 包尽量不依赖任何第三方库，保持轻量
2. **只包含真正共享的内容** — 不要把只有前端用的东西放进去
3. **类型优先** — 多定义接口和类型，少实现复杂逻辑
4. **稳定 API** — shared 包的改动会影响所有下游包，修改要谨慎

## 练习

尝试给 shared 包添加一些新内容：

```typescript
// 在 packages/shared/src/index.ts 中添加

// 分页请求参数
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// 分页响应
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
}
```

然后看看 web 和 server 项目能否立即使用这些新类型（不需要额外操作，TypeScript 会自动识别）。

## 总结

- `shared` 包是 monorepo 的基础，提供共享的类型和工具
- 通过泛型 `ApiResponse<T>` 实现类型安全的 API 响应
- `package.json` 的 `exports` 字段声明包的入口
- 修改 shared 包后，下游包可以立即使用新的类型

下一章，我们看看 UI 组件库的设计 → [07 - UI 组件库](./07-UI组件库.md)
