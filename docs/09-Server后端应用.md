# 09 - Server 后端应用

## 概述

`apps/server` 是后端 API 服务，使用 Express 构建，运行在 Node.js 中。它依赖 `@monorepo/shared` 包来使用共享的类型和工具函数。

## 目录结构

```
apps/server/
├── src/
│   └── index.ts           # 服务器入口
├── package.json
└── tsconfig.json
```

非常简洁——一个最小的 Express API 服务器。

## 源码解析

```typescript
// apps/server/src/index.ts
import express from "express";
import { createResponse } from "@monorepo/shared";

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(express.json());

// 健康检查接口
app.get("/api/health", (_req, res) => {
  res.json(createResponse({ status: "ok", timestamp: Date.now() }));
});

// 获取用户列表接口
app.get("/api/users", (_req, res) => {
  const users = [
    { id: "1", name: "Alice", email: "alice@example.com" },
    { id: "2", name: "Bob", email: "bob@example.com" },
  ];
  res.json(createResponse(users));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
```

### 逐部分解析

#### 导入

```typescript
import express from "express";
import { createResponse } from "@monorepo/shared";
```

- 从 npm 安装的 `express` 包导入 Express 框架
- 从 monorepo 的 shared 包导入 `createResponse` 工具函数

#### 中间件

```typescript
app.use(express.json());
```

注册 JSON 解析中间件，自动将请求体解析为 JavaScript 对象。这样你可以在路由处理函数中通过 `req.body` 获取 JSON 数据。

#### 路由

```typescript
app.get("/api/health", (_req, res) => {
  res.json(createResponse({ status: "ok", timestamp: Date.now() }));
});
```

- `app.get(path, handler)` 注册一个 GET 路由
- `_req` 的下划线前缀表示"这个参数没有使用"（TypeScript 约定）
- `createResponse()` 包装响应数据为统一格式

#### 启动服务器

```typescript
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
```

`process.env.PORT ?? 4000` 使用了**空值合并运算符（??）**，优先使用环境变量中的端口号，没有设置时默认 4000。

## API 响应格式

所有 API 都使用 `createResponse()` 返回统一格式：

```json
// GET /api/health
{
  "code": 0,
  "data": {
    "status": "ok",
    "timestamp": 1717440000000
  },
  "message": "success"
}

// GET /api/users
{
  "code": 0,
  "data": [
    { "id": "1", "name": "Alice", "email": "alice@example.com" },
    { "id": "2", "name": "Bob", "email": "bob@example.com" }
  ],
  "message": "success"
}
```

这种统一的响应格式让前端可以通用处理：

```typescript
// 前端通用响应处理
async function fetchApi<T>(url: string): Promise<ApiResponse<T>> {
  const res = await fetch(url);
  return res.json();
}

// 使用
const result = await fetchApi<User[]>("/api/users");
if (result.code === 0) {
  console.log(result.data); // User[]
}
```

## package.json

```json
{
  "name": "@monorepo/server",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -b",
    "start": "node dist/index.js",
    "clean": "rm -rf dist *.tsbuildinfo"
  },
  "dependencies": {
    "@monorepo/shared": "workspace:*",
    "express": "^4.21.0"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0"
  }
}
```

### 关键字段

| 字段 | 值 | 含义 |
|------|----|------|
| `"type": "module"` | — | 使用 ES 模块（import/export），而不是 CommonJS（require） |
| `dev: "tsx watch"` | `tsx watch src/index.ts` | 用 tsx 运行 TS 文件，并监听文件变化自动重启 |
| `build: "tsc -b"` | — | 用 TypeScript 编译器编译到 `dist/` |
| `start: "node dist/index.js"` | — | 运行编译后的 JS 文件（生产环境用） |

### `tsx` — TypeScript 执行器

`tsx` 是一个能**直接运行 TypeScript 文件**的工具，不需要先编译。

```
开发时：
  pnpm dev:server
  → tsx watch src/index.ts
  → 监听文件变化，自动重新执行
  → 不需要手动重启服务器

生产时：
  pnpm build:server
  → tsc -b（编译 TypeScript → JavaScript）
  → node dist/index.js（运行编译后的代码）
```

## tsconfig.json

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"],
  "references": [
    { "path": "../../packages/shared" }
  ]
}
```

- **没有 `noEmit: true`** — 因为 server 需要编译输出 JS 文件供 Node.js 运行
- **没有 `composite: true`** — 因为 server 是最终应用，不需要被其他包引用
- **`references`** — 引用 shared 包以获取类型

## 开发工作流

```bash
# 1. 启动开发服务器（带自动重启）
pnpm dev:server
# → Server 启动在 http://localhost:4000
# → 修改代码后自动重启

# 2. 测试 API
curl http://localhost:4000/api/health
curl http://localhost:4000/api/users

# 3. 生产构建
pnpm build:server
# → 编译到 apps/server/dist/
# → 运行: node apps/server/dist/index.js
```

## 前后端协作

这是 monorepo 最大的优势——前后端共享类型：

```
packages/shared/src/index.ts
  ┌─ ApiResponse<T>     ← 后端用 createResponse() 生成这种格式
  └─ User               ← 前端用 User 类型来接收数据
```

1. 后端在 `shared` 中定义 `User` 接口
2. 后端使用 `createResponse(users)` 返回类型安全的数据
3. 前端导入同一个 `User` 接口和 `ApiResponse<T>` 类型
4. 前端可以精确知道 API 返回什么数据，无需猜测或手写类型

如果后端修改了 `User` 接口（比如新增了一个字段），前端会**立即得到 TypeScript 的类型错误提示**，不会出现"改了后端忘了改前端"的问题。

## 扩展示例：添加新 API

```typescript
// 在 apps/server/src/index.ts 中添加 POST 路由

import { createResponse, User } from "@monorepo/shared";

// 使用共享的 User 类型
app.post<"/api/users", {}, ApiResponse<User>>("/api/users", (req, res) => {
  const { name, email } = req.body;

  // TypeScript 会检查 req.body 的类型
  const newUser: User = {
    id: Date.now().toString(),
    name,
    email,
  };

  res.json(createResponse(newUser));
});
```

## 总结

- Server 使用 `tsx` 在开发时直接运行 TypeScript
- `createResponse()` 确保所有 API 返回统一的响应格式
- 前后端通过 shared 包共享类型，实现端到端类型安全
- 修改 shared 中的类型会自动影响 server 和 web 的类型检查

最后一章，我们来看看完整的快速上手指南 → [10 - 快速上手指南](./10-快速上手指南.md)
