# 08 - Web 前端应用

## 概述

`apps/web` 是前端 Web 应用，使用 React 19 + Vite 构建，运行在浏览器中。它依赖 `@monorepo/shared` 和 `@monorepo/ui`。

## 目录结构

```
apps/web/
├── src/
│   ├── main.tsx           # 应用入口，渲染 React 根组件
│   ├── App.css            # 全局样式
│   └── vite-env.d.ts      # Vite 类型声明
├── index.html              # HTML 模板
├── vite.config.ts          # Vite 配置
├── package.json
└── tsconfig.json
```

## 核心文件解析

### index.html — HTML 入口

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Monorepo Web</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- `<div id="root">` 是 React 应用的挂载点
- `<script type="module" src="/src/main.tsx">` 加载应用入口
- `type="module"` 表示使用 ES 模块

### main.tsx — React 应用入口

```tsx
// apps/web/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Button } from "@monorepo/ui";
import { createResponse } from "@monorepo/shared";
import "./App.css";

const data = createResponse({ name: "Monorepo" });
console.log(data);

function App() {
  return (
    <div className="app">
      <h1>Monorepo Web</h1>
      <p>pnpm workspaces + React + TypeScript</p>
      <Button onClick={() => alert("Hello from monorepo!")}>
        Click me
      </Button>
      <Button variant="secondary" style={{ marginLeft: 8 }}>
        Secondary
      </Button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

关键点：

1. **`import { Button } from "@monorepo/ui"`** — 直接从 monorepo 的 UI 包导入组件
2. **`import { createResponse } from "@monorepo/shared"`** — 从共享包导入工具函数
3. **`ReactDOM.createRoot()`** — React 19 的创建根节点方式（比旧的 `ReactDOM.render` 更简洁）
4. **`<React.StrictMode>`** — 开启严格模式，帮助检测潜在问题

### vite.config.ts — Vite 配置

```typescript
// apps/web/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@monorepo/shared": path.resolve(__dirname, "../../packages/shared/src"),
      "@monorepo/ui": path.resolve(__dirname, "../../packages/ui/src"),
    },
  },
  server: {
    port: 3000,
  },
});
```

这是整个 web 应用最关键的配置文件之一。让我们逐部分理解：

#### `plugins: [react()]`

加载 Vite 的 React 插件，提供：

- JSX 语法转换（`<div>` → `React.createElement("div")`）
- Fast Refresh（开发时热更新 React 组件）

#### `resolve.alias` — 路径别名

```typescript
alias: {
  "@monorepo/shared": path.resolve(__dirname, "../../packages/shared/src"),
  "@monorepo/ui": path.resolve(__dirname, "../../packages/ui/src"),
}
```

**这是 web 应用能直接使用 monorepo 包的关键配置。**

为什么需要这个？因为：

1. pnpm workspace 在 `node_modules` 中创建的符号链接指向的是 `packages/shared/dist/`（编译后的代码）
2. 但在开发时，我们希望 Vite **直接加载源代码**（`packages/shared/src/`），这样修改 shared 包后 web 应用能立即反映变化
3. 别名将 `@monorepo/shared` 指向源码目录，绕过编译产物

**开发时**的模块解析流程：
```
import { Button } from "@monorepo/ui"
  → Vite 别名 → packages/ui/src/index.ts（源码）
  → 直接加载 .tsx 源文件（Vite 内置对 JSX 的支持）
```

**生产构建时**的模块解析流程：
```
import { Button } from "@monorepo/ui"
  → pnpm workspace → packages/ui/dist/index.js（编译产物）
  → 已经是标准 JS，无需再转换
```

#### `server.port: 3000`

开发服务器运行在 3000 端口。

### tsconfig.json

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "jsx": "react-jsx",
    "noEmit": true
  },
  "include": ["src", "vite-env.d.ts"],
  "references": [
    { "path": "../../packages/shared" },
    { "path": "../../packages/ui" }
  ]
}
```

- `jsx: "react-jsx"` — 使用 React 17+ 的新 JSX 转换（不需要手动 `import React`）
- `noEmit: true` — TypeScript 只做类型检查，不输出 JS 文件（Vite 负责编译）
- `references` — 引用 shared 和 ui 包以获取类型信息

### package.json

```json
{
  "name": "@monorepo/web",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  }
}
```

| 脚本 | 命令 | 作用 |
|------|------|------|
| `dev` | `vite` | 启动开发服务器（端口 3000） |
| `build` | `tsc -b && vite build` | 先类型检查，再用 Vite 打包 |
| `preview` | `vite preview` | 预览生产构建结果 |

注意 `build` 脚本先执行 `tsc -b` 做类型检查，再执行 `vite build` 做实际打包。如果类型检查失败，构建会中断。

## 开发工作流

```bash
# 1. 在根目录安装所有依赖
pnpm install

# 2. 启动 web 开发服务器
pnpm dev:web
# → Vite 启动在 http://localhost:3000
# → 修改 shared 或 ui 包的代码后，浏览器自动更新

# 3. 打包生产版本
pnpm build:web
# → 在 apps/web/dist/ 生成优化后的静态文件
```

## 总结

- Web 应用通过 Vite 别名直接加载 monorepo 包的源码
- `vite.config.ts` 的 `resolve.alias` 是连接 web 与 packages 的桥梁
- `noEmit: true` 让 TypeScript 只负责类型检查，Vite 负责编译
- 构建时先类型检查（`tsc -b`），再打包（`vite build`）

下一章，我们看看后端应用 → [09 - Server 后端应用](./09-Server后端应用.md)
