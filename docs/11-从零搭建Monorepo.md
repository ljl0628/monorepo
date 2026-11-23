# 11 - 从零搭建 Monorepo

本章把整个项目从头到尾搭一遍。每一步都给出**为什么这么做**和**具体命令**，跟着做完你会得到一个和当前仓库等价的项目，并能说清每一处配置的作用。

## 设计目标

我们想搭的 monorepo 长这样：

```
@monorepo/shared  ← 纯 TS，类型 + 工具（叶子包，无依赖）
   ↑
   ├── @monorepo/ui     ← React 组件库（peerDep: react）
   │     ↑
   │     └── @monorepo/web  ← Vite SPA，端口 3000
   │           ↑ 也依赖 shared
   │
   └── @monorepo/server ← Express API，端口 4000
```

技术选型：**pnpm workspaces + Turborepo + TypeScript Project References**。

## 前置准备

| 工具 | 版本 | 检查命令 |
|------|------|----------|
| Node.js | ≥ 18 | `node -v` |
| pnpm | 9.x | `pnpm -v` |
| Git | 任意 | `git --version` |

如果没装 pnpm：

```bash
npm install -g pnpm
```

## 步骤 0：初始化项目骨架

```bash
mkdir monorepo && cd monorepo
git init
```

创建根 `package.json`（暂时不写脚本，后面逐步加）：

```json
{
  "name": "monorepo",
  "private": true,
  "packageManager": "pnpm@9.15.0",
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**关键点：**
- `"private": true` 防止根包被误推到 npm
- `"packageManager": "pnpm@9.15.0"` 锁定包管理器版本，团队成员用同一版本（Corepack 会读这个字段）
- 此时**先不要装依赖**

## 步骤 1：声明 pnpm Workspaces

在根创建 `pnpm-workspace.yaml`：

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

这条配置告诉 pnpm：`apps/` 和 `packages/` 下的每个子目录都是一个独立的 npm 包。一次 `pnpm install` 就能把所有子包的依赖装齐。

创建目录骨架：

```bash
mkdir -p packages/shared/src
mkdir -p packages/ui/src
mkdir -p apps/web/src
mkdir -p apps/server/src
```

## 步骤 2：根 TypeScript 配置

每个子包的 `tsconfig.json` 都会 `extends` 根的配置。在根创建 `tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "references": [
    { "path": "packages/shared" },
    { "path": "packages/ui" },
    { "path": "apps/web" },
    { "path": "apps/server" }
  ]
}
```

**为什么选 `moduleResolution: "bundler"`？**
现代前端构建工具（Vite、Webpack）使用 ESM 和按需解析，比 Node 经典模式更宽松。后端虽然跑在 Node，但因为用 `tsx` 直接执行 TS，也兼容这个模式。

**为什么根 `tsconfig.json` 不直接编译任何东西？**
它只起"配置基类 + 项目引用聚合点"的作用。实际编译发生在每个子包的 `tsc -b`。

## 步骤 3：创建 shared 包（依赖图叶子）

`packages/shared/package.json`：

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

**关键点：**
- `"main"` + `"types"` + `"exports"` 三件套：让消费方既能用 CommonJS 也能用现代 ESM 导入，且类型解析指向编译产物
- 没有任何 `dependencies`——shared 是叶子包，不能依赖其他 workspace 包

`packages/shared/tsconfig.json`：

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

**`composite: true` 是 Project References 的硬性要求**。它让 TS 把这个项目视为可被引用的"复合项目"，生成 `.d.ts` 和 `.tsbuildinfo`。

`packages/shared/src/index.ts`：

```ts
export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export function createResponse<T>(data: T, message = "success"): ApiResponse<T> {
  return {
    code: 0,
    data,
    message,
  };
}
```

## 步骤 4：创建 ui 包（React 组件库）

`packages/ui/package.json`：

```json
{
  "name": "@monorepo/ui",
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
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.7.0"
  },
  "peerDependencies": {
    "react": ">=18.0.0"
  }
}
```

**`peerDependencies` 的意义：**
组件库不应该自带 React——否则下游应用装了 ui 后会有两份 React 实例（破坏 hooks）。`peerDependencies` 告诉消费方："你需要自己装一份 React"。`devDependencies` 里也写 react 是为了本地开发时能跑测试和 demo。

`packages/ui/tsconfig.json`：

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [
    { "path": "../shared" }
  ]
}
```

**`"jsx": "react-jsx"`** 是 React 17+ 的新 JSX 转换，不需要每个文件 `import React`。

`packages/ui/src/Button.tsx`：

```tsx
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  const base = "px-4 py-2 rounded font-medium transition-colors cursor-pointer disabled:opacity-50";
  const styles =
    variant === "primary"
      ? "bg-blue-600 text-white hover:bg-blue-700"
      : "bg-gray-200 text-gray-800 hover:bg-gray-300";

  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}
```

`packages/ui/src/index.ts`：

```ts
export { Button } from "./Button";
```

## 步骤 5：创建 web 应用（Vite + React）

`apps/web/package.json`：

```json
{
  "name": "@monorepo/web",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "clean": "rm -rf dist *.tsbuildinfo"
  },
  "dependencies": {
    "@monorepo/shared": "workspace:*",
    "@monorepo/ui": "workspace:*",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.3.0",
    "vite": "^4.5.0"
  }
}
```

**`"workspace:*"` 的意义：**
告诉 pnpm "这个依赖来自本 monorepo，不要去 npm 上找"。pnpm 会创建符号链接：`apps/web/node_modules/@monorepo/shared` → `packages/shared`。

`apps/web/tsconfig.json`：

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

**`"noEmit": true`** 因为 Vite 负责产出，TS 只做类型检查。

`apps/web/vite.config.ts`（**开发体验的关键**）：

```ts
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

**为什么需要 alias？**
默认情况下，导入 `@monorepo/shared` 会走 `node_modules` 里的符号链接，指向 `packages/shared` 的 `main`（即 `dist/index.js`）。这意味着开发时你必须**先 build 上游包**才能看到改动。
alias 把导入直接重定向到源码 `src/index.ts`，HMR 即时生效，开发循环不需要"先 build"。

`apps/web/index.html`：

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

`apps/web/src/main.tsx`：

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Button } from "@monorepo/ui";
import { createResponse } from "@monorepo/shared";

const data = createResponse({ name: "Monorepo" });
console.log(data);

function App() {
  return (
    <div className="app">
      <h1>Monorepo Web</h1>
      <p>pnpm workspaces + React + TypeScript</p>
      <Button onClick={() => alert("Hello from monorepo!")}>Click me</Button>
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

`apps/web/vite-env.d.ts`：

```ts
/// <reference types="vite/client" />
```

## 步骤 6：创建 server 应用（Express）

`apps/server/package.json`：

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

**`"type": "module"` + `tsx`：**
让 Node 直接跑 ESM TypeScript，免编译。生产用 `tsc -b` 出 `dist/`，再 `node dist/index.js`。

`apps/server/tsconfig.json`：

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

`apps/server/src/index.ts`：

```ts
import express from "express";
import { createResponse } from "@monorepo/shared";

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json(createResponse({ status: "ok", timestamp: Date.now() }));
});

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

## 步骤 7：安装依赖

在根目录执行：

```bash
pnpm install
```

这一步会发生：
1. pnpm 读取 `pnpm-workspace.yaml` 发现 4 个子包
2. 解析所有 `package.json` 的依赖
3. 把 `workspace:*` 解析成本地符号链接
4. 外部依赖（react、express 等）下载到 pnpm 全局存储，子包通过硬链接引用

完成后每个子包都有 `node_modules/`，根目录也有。

## 步骤 8：配置 Turborepo

在根装 Turborepo：

```bash
pnpm add -Dw turbo
```

`turbo.json`：

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "clean": {
      "cache": false
    },
    "lint": {
      "dependsOn": [],
      "outputs": []
    }
  }
}
```

**字段解释：**
- `build.dependsOn: ["^build"]` —— 构建当前包前先构建它的上游依赖（`^` 表示上游）。`web` 的 build 会等 `shared` 和 `ui` 编译完
- `build.outputs: ["dist/**"]` —— 告诉 Turbo 哪些文件是构建产物，会被缓存
- `dev.persistent: true` —— dev 是长驻进程，不会被缓存
- `lint.dependsOn: []` —— lint 不需要等上游 build（如果用 `recommended` 而非 `strictTypeChecked`）

在根 `package.json` 加脚本：

```json
{
  "scripts": {
    "dev:web": "pnpm --filter @monorepo/web dev",
    "dev:server": "pnpm --filter @monorepo/server dev",
    "build:shared": "pnpm --filter @monorepo/shared build",
    "build:ui": "pnpm --filter @monorepo/ui build",
    "build:web": "pnpm --filter @monorepo/web build",
    "build:server": "pnpm --filter @monorepo/server build",
    "build": "turbo build",
    "clean": "pnpm -r clean"
  }
}
```

跑一下：

```bash
pnpm build
```

Turborepo 会按 `shared → ui → {server, web}` 的顺序并行构建。第二次跑无代码改动会瞬间从缓存返回。

## 步骤 9：配置 ESLint + Prettier

在根装工具链：

```bash
pnpm add -Dw eslint@^9 @eslint/js@^9 typescript-eslint \
  eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-jsx-a11y \
  eslint-config-prettier globals prettier
```

> **坑点：** 把 ESLint 锁在 v9，不要让它升到 10。`eslint-plugin-react` 和 `eslint-plugin-jsx-a11y` 当前声明的 peer 上限是 9，装 10 会触发 peer 警告。

`eslint.config.mjs`（用 `.mjs` 而非 `.js`，因为根 `package.json` 没有 `"type": "module"`）：

```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/*.tsbuildinfo",
      "**/.turbo/**",
      "**/vite.config.ts",
      "**/vite-env.d.ts",
      "eslint.config.mjs",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx,js}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
  },
  {
    files: ["packages/ui/**/*.{ts,tsx}", "apps/web/**/*.{ts,tsx}"],
    plugins: {
      react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
    },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: globals.browser,
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
    },
  },
  {
    files: ["apps/server/**/*.ts"],
    languageOptions: {
      globals: globals.node,
    },
  },
  // 必须放最后：关掉 ESLint 里所有和 Prettier 冲突的格式规则
  prettier,
);
```

`.prettierrc.json`：

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

`.prettierignore`（**关键：用 `**/` 前缀，否则只匹配根目录**）：

```
**/node_modules/**
**/dist/**
**/*.tsbuildinfo
**/.turbo/**
pnpm-lock.yaml
*.log
```

每个子包的 `package.json` 加四个脚本：

```json
"lint": "eslint .",
"lint:fix": "eslint . --fix",
"format": "prettier --write .",
"format:check": "prettier --check ."
```

根 `package.json` 加 fan-out 脚本：

```json
"lint": "pnpm -r lint",
"lint:fix": "pnpm -r lint:fix",
"format": "pnpm -r format",
"format:check": "pnpm -r format:check"
```

跑一下验证：

```bash
pnpm format
pnpm format:check   # 全部通过
pnpm lint           # 全部通过
```

## 步骤 10：完整验证

```bash
# 构建所有包
pnpm build

# 启动后端
pnpm dev:server
# 新终端窗口
curl http://localhost:4000/api/health
# 预期：{"code":0,"data":{"status":"ok","timestamp":...},"message":"success"}

# 启动前端
pnpm dev:web
# 浏览器打开 http://localhost:3000
```

## 检查清单

完成后你的项目应该有这些文件：

```
monorepo/
├── .gitignore
├── .prettierignore
├── .prettierrc.json
├── CLAUDE.md
├── README.md
├── eslint.config.mjs
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
├── turbo.json
├── apps/
│   ├── server/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/index.ts
│   └── web/
│       ├── index.html
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── vite-env.d.ts
│       └── src/main.tsx
└── packages/
    ├── shared/
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/index.ts
    └── ui/
        ├── package.json
        ├── tsconfig.json
        └── src/
            ├── Button.tsx
            └── index.ts
```

## 容易踩的坑

| 坑 | 现象 | 解决 |
|----|------|------|
| ESLint 配置用 `.js` 扩展名 | `SyntaxError: Cannot use import statement outside a module` | 改成 `.mjs`，或给根 `package.json` 加 `"type": "module"` |
| ESLint 自动升级到 v10 | peer dependency 警告 | 显式 `eslint@^9` 锁版本 |
| `.prettierignore` 写 `dist/` | 子包的 `dist/` 仍被格式化 | 用 `**/dist/**`，glob 模式相对于 ignore 文件所在目录 |
| Vite alias 没配 | 改 `shared` 源码后 HMR 不生效 | 必须显式 alias 指向 `src/` |
| `composite: true` 漏掉 | `tsc -b` 报 "Referenced project must have setting composite: true" | 每个 `references` 目标的 `tsconfig.json` 都要开 |
| 子包没声明 `workspace:*` | 装了 npm 上的同名包（如果存在） | 显式 `"@monorepo/xxx": "workspace:*"` |

## 下一步

搭建完成后，建议：

1. 接 [Git 钩子](https://typicode.github.io/husky/)（husky + lint-staged）在 commit 前自动跑 lint/format
2. 加 CI 配置（GitHub Actions）：`pnpm install --frozen-lockfile && pnpm lint && pnpm build`
3. 引入测试框架（Vitest）
4. 给 `shared` 加更多业务类型，给 `ui` 加 Storybook

回到 [目录](./README.md)。
