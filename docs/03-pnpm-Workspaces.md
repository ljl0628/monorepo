# 03 - pnpm Workspaces

## 什么是 pnpm？

**pnpm** 是一个高性能的 Node.js 包管理器，类似于 npm 和 yarn。它的名字来源于 **Performant npm**（高性能的 npm）。

pnpm 的核心优势：

- **速度极快**：使用硬链接（hard link）共享依赖文件，不会像 npm 那样每个项目都复制一份
- **节省磁盘空间**：全局只存一份 `node_modules`，所有项目通过符号链接引用
- **严格的依赖隔离**：不会出现"隐式依赖"问题

## 什么是 Workspaces？

**Workspaces** 是 pnpm（以及 npm/yarn）提供的一个功能，允许你在**一个根目录下管理多个子项目**。

没有 workspaces 时，你需要在每个项目中单独 `npm install`。有了 workspaces，你只需要在根目录执行一次 `pnpm install`，所有子项目的依赖都会被自动安装。

## pnpm-workspace.yaml

这是定义 workspace 的配置文件，位于项目根目录：

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"       # 包含 apps/ 下的所有子目录
  - "packages/*"   # 包含 packages/ 下的所有子目录
```

这告诉 pnpm：`apps/` 和 `packages/` 下的每一个子目录都是一个独立的 npm 包。

pnpm 会扫描这些目录，读取每个子目录的 `package.json`，然后统一管理它们的依赖。

## workspace 协议

这是 monorepo 依赖管理的核心概念。看看项目中的实际用法：

```json
// apps/web/package.json
{
  "dependencies": {
    "@monorepo/shared": "workspace:*",
    "@monorepo/ui": "workspace:*"
  }
}

// apps/server/package.json
{
  "dependencies": {
    "@monorepo/shared": "workspace:*"
  }
}
```

### 什么是 `workspace:*`？

`"workspace:*"` 表示：**依赖本 monorepo 中的同名包，使用其最新版本。**

与之对比：
- `"workspace:^"` → workspace 包版本至少是指定版本
- `"workspace:~"` → workspace 包版本兼容指定版本
- `"workspace:*"` → 任何版本都可以（最常用）

### 执行 `pnpm install` 时发生了什么？

1. pnpm 发现 `@monorepo/shared` 的版本是 `"workspace:*"`
2. pnpm 在当前 workspace 中找到 `packages/shared/package.json`（它的 `name` 是 `@monorepo/shared`）
3. pnpm 创建一个**符号链接**：`apps/web/node_modules/@monorepo/shared` → `packages/shared`
4. 这样 `apps/web` 中的代码就可以 `import { something } from "@monorepo/shared"` 了

**你不需要发布到 npm registry，依赖关系在本地就能工作。**

## node_modules 的真实结构

执行 `pnpm install` 后，结构看起来像这样：

```
monorepo/
├── node_modules/                # 根 node_modules（pnpm 的全局存储）
├── apps/
│   └── web/
│       └── node_modules/
│           └── @monorepo/
│               ├── shared/  → ../../../packages/shared/   # 符号链接
│               └── ui/      → ../../../packages/ui/       # 符号链接
├── packages/
│   ├── shared/
│   │   └── node_modules/      # 只有 shared 自己的外部依赖
│   └── ui/
│       └── node_modules/
│           └── @monorepo/
│               └── shared/  → ../../shared/                  # 符号链接
└── apps/
    └── server/
        └── node_modules/
            └── @monorepo/
                └── shared/  → ../../../packages/shared/    # 符号链接
```

每个需要 `@monorepo/shared` 的包都有自己 `node_modules` 中的符号链接指向 `packages/shared`。

## 根 package.json 中的 filter 命令

根 `package.json` 中的脚本使用 `--filter` 来操作特定的包：

```json
{
  "scripts": {
    "dev:web": "pnpm --filter @monorepo/web dev",
    "dev:server": "pnpm --filter @monorepo/server dev",
    "build:shared": "pnpm --filter @monorepo/shared build",
    "build:ui": "pnpm --filter @monorepo/ui build",
    "build:web": "pnpm --filter @monorepo/web build",
    "build:server": "pnpm --filter @monorepo/server build",
    "build": "turbo build"
  }
}
```

`pnpm --filter <包名> <命令>` 的意思是：**只在指定的包中执行这个命令**。

例如 `pnpm --filter @monorepo/web dev` 会在 `apps/web/` 目录下执行 `dev` 脚本。

## 常用 pnpm 命令

```bash
# 在根目录安装所有依赖
pnpm install

# 只给某个包安装新依赖
pnpm --filter @monorepo/web add axios

# 给某个包安装开发依赖
pnpm --filter @monorepo/server add -D @types/node

# 在所有包中执行同一个脚本
pnpm -r build        # -r = recursive，递归执行所有包的 build

# 在根目录运行 turbo build（处理所有包的构建）
pnpm build
```

## 总结

- `pnpm-workspace.yaml` 定义哪些目录是 workspace 包
- `workspace:*` 协议让包之间可以在本地互相依赖
- pnpm 通过符号链接将 workspace 包连接在一起
- `--filter` 用于操作特定的包

下一章，我们将学习 TypeScript 如何理解这些包之间的类型关系 → [04 - TypeScript 项目引用](./04-TypeScript项目引用.md)
