# 04 - TypeScript 项目引用

## 为什么需要项目引用？

在第 3 章中，我们学习了 pnpm workspaces 如何让包在**运行时**互相引用。但 TypeScript 也需要理解这些依赖关系，才能：

1. 在编辑器中提供正确的**类型提示**和**自动补全**
2. 在构建时按正确的**顺序编译**包（先编译 shared，再编译依赖 shared 的包）
3. 检测到类型不一致时**报错**

**TypeScript Project References** 就是让 TypeScript 理解 monorepo 中包与包之间关系的机制。

## 根 tsconfig.json

```json
// 根目录 tsconfig.json
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

### 关键配置解释

| 字段 | 值 | 含义 |
|------|----|------|
| `target` | `ES2022` | 编译后的 JavaScript 目标版本 |
| `module` | `ESNext` | 使用最新的 ES 模块语法（import/export） |
| `moduleResolution` | `bundler` | 使用打包器（如 Vite）的模块解析策略 |
| `strict` | `true` | 开启所有严格类型检查 |
| `declaration` | `true` | 生成 `.d.ts` 类型声明文件（其他包需要这些文件来获取类型） |
| `declarationMap` | `true` | 生成声明文件的 source map（方便调试跳转到源码） |
| `references` | [...] | 列出所有子项目的路径 |

## 子项目的 tsconfig.json

每个子项目都有自己的 `tsconfig.json`，通过 `extends` 继承根配置：

### packages/shared/tsconfig.json

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

**`composite: true`** 是项目引用的核心标志。它告诉 TypeScript：

- 这个项目可以被其他项目引用
- 编译结果会生成 `.d.ts` 声明文件
- 使用增量编译（`.tsbuildinfo` 文件记录编译状态，加快后续编译）

### packages/ui/tsconfig.json

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

注意 `references` 字段：`ui` 引用了 `shared`，表示 `ui` 依赖 `shared` 的类型。加上 `jsx: "react-jsx"` 是因为这个包包含 JSX 代码。

### apps/web/tsconfig.json

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

注意这里**没有 `composite: true`**，因为 `web` 是最终应用，不需要被其他包引用。同时使用了 `noEmit: true`，因为 Vite 会处理实际的编译，TypeScript 只负责类型检查。

### apps/server/tsconfig.json

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

## tsconfig 继承链

```
根 tsconfig.json (共享基础配置)
  │
  ├── packages/shared/tsconfig.json   (+ composite, outDir, rootDir)
  │
  ├── packages/ui/tsconfig.json       (+ composite, jsx, + references: shared)
  │
  ├── apps/web/tsconfig.json          (+ jsx, noEmit, + references: shared, ui)
  │
  └── apps/server/tsconfig.json        (+ outDir, rootDir, + references: shared)
```

每个子项目只需要写自己特有的配置，公共配置从根 `tsconfig.json` 继承。

## TypeScript 编译命令

```bash
# 构建单个项目（tsc -b 使用项目引用模式构建）
# 会先自动构建该项目依赖的所有上游项目
cd packages/shared && tsc -b    # 只构建 shared
cd packages/ui && tsc -b         # 自动先构建 shared，再构建 ui

# 增量编译（tsc -b 可以检测变更，只重新编译修改的文件）
tsc -b                            # 在任何子项目中执行增量编译

# 整个 monorepo 的类型检查（从根目录执行）
tsc -b --verbose                  # 按 references 顺序构建所有项目
```

`tsc -b`（`--build` 模式）是项目引用的核心命令：

1. 读取 `references` 字段，构建依赖图
2. 按拓扑顺序构建（先构建被依赖的包）
3. 只重新构建有变更的项目
4. 生成 `.d.ts` 文件供下游项目使用

## composite 和 noEmit 的对比

| | `composite: true` | `noEmit: true` |
|---|---|---|
| 用于 | 可复用的包（packages/） | 最终应用（apps/） |
| 生成 `.js` | 是 | 否 |
| 生成 `.d.ts` | 是 | 否 |
| 可被引用 | 是 | 否 |
| 本项目 | shared, ui | web |

## 总结

- 根 `tsconfig.json` 定义共享的编译选项，并列出所有子项目
- `composite: true` 标记一个包可以被其他包引用
- `references` 声明项目间的依赖关系
- `tsc -b` 按依赖顺序自动构建
- 应用使用 `noEmit: true`，让打包器（Vite）处理实际编译

下一章，我们将学习 Turborepo 如何自动化整个构建过程 → [05 - Turborepo 构建编排](./05-Turborepo构建编排.md)
