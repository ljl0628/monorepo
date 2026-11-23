# 05 - Turborepo 构建编排

## 为什么需要 Turborepo？

在 monorepo 中，你有很多包需要构建。手动一个一个构建很麻烦：

```bash
# 手动构建（你必须知道正确的顺序！）
cd packages/shared && pnpm build
cd packages/ui && pnpm build
cd apps/server && pnpm build
cd apps/web && pnpm build
```

如果 shared 被修改了，你需要重新构建 shared、ui、server 和 web。如果只修改了 server 呢？只需要重新构建 server。

**Turborepo 自动帮你解决这些问题：**

1. 自动检测依赖关系，确定正确的构建顺序
2. 只重新构建有变更的包及其下游依赖者
3. 缓存构建结果，避免重复构建

## turbo.json 配置

```json
// turbo.json
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
      "dependsOn": ["^build"]
    }
  }
}
```

### 逐行解读

#### build 任务

```json
"build": {
  "dependsOn": ["^build"],
  "outputs": ["dist/**"]
}
```

- **`dependsOn: ["^build"]`**：`^` 表示"上游依赖"。意思是：在构建当前包之前，先构建它所依赖的所有包。
  - 构建 `@monorepo/web` 之前，先构建 `@monorepo/shared` 和 `@monorepo/ui`
  - 构建 `@monorepo/ui` 之前，先构建 `@monorepo/shared`
  - 构建 `@monorepo/shared` 之前，没有上游依赖，直接构建
- **`outputs: ["dist/**"]`**：构建产物的位置。Turborepo 缓存的是 `dist/` 目录的内容。

#### dev 任务

```json
"dev": {
  "cache": false,
  "persistent": true
}
```

- **`cache: false`**：开发服务器不缓存（因为它持续运行，内容一直在变）
- **`persistent: true`**：进程会一直运行不会退出（Vite dev server、tsx watch）

#### clean 任务

```json
"clean": {
  "cache": false
}
```

清理操作不需要缓存。

#### lint 任务

```json
"lint": {
  "dependsOn": ["^build"]
}
```

代码检查依赖上游包先构建完成（因为 lint 可能需要类型信息）。

## 执行流程

当你运行 `pnpm build`（它会调用 `turbo build`）时：

```
Step 1: 分析变更
  → 检测哪些包的源码发生了变化

Step 2: 构建依赖图
  @monorepo/shared (无依赖)
       ↓
  @monorepo/ui (依赖 shared)
       ↓
  @monorepo/server (依赖 shared)
  @monorepo/web (依赖 shared + ui)

Step 3: 检查缓存
  → 对于未变更的包，直接恢复缓存结果

Step 4: 按顺序构建
  → 只构建有变更的包及其受影响的下游
```

## 缓存机制

Turborepo 的缓存是它最强大的功能之一：

```
第一次构建（全量构建）：
  shared → [编译] → 缓存 dist/
  ui     → [编译] → 缓存 dist/
  server → [编译] → 缓存 dist/
  web    → [编译] → 缓存 dist/
  总耗时：~10s

修改 shared 后再次构建（只构建受影响的包）：
  shared → [缓存失效，重新编译] → 缓存 dist/
  ui     → [缓存失效，重新编译] → 缓存 dist/
  server → [缓存失效，重新编译] → 缓存 dist/
  web    → [缓存失效，重新编译] → 缓存 dist/
  总耗时：~10s

只修改 server 后再次构建（只构建 server）：
  shared → [缓存命中 ✓] 跳过
  ui     → [缓存命中 ✓] 跳过
  server → [缓存失效，重新编译] → 缓存 dist/
  web    → [缓存命中 ✓] 跳过
  总耗时：~2s
```

缓存存储在 `.turbo/` 目录下，已经被 `.gitignore` 忽略。

## 常用 Turborepo 命令

```bash
# 构建所有包（按依赖顺序，使用缓存）
turbo build

# 只构建特定包及其依赖
turbo build --filter=@monorepo/web

# 强制重新构建（忽略缓存）
turbo build --force

# 查看构建图（可视化依赖关系）
turbo build --graph

# 运行开发服务器（所有包同时启动）
turbo dev

# 清除缓存
turbo clean
```

## dependsOn 的 ^ 含义

`^` 是 Turborepo 中表示"上游依赖"的特殊符号：

| 语法 | 含义 |
|------|------|
| `"^build"` | 先构建当前包的**所有上游依赖**的 build 任务 |
| `"build"` | 先构建当前包的 build 任务（一般不用这个） |

举例：

```json
// packages/ui 的 build 任务
"dependsOn": ["^build"]
// 等价于：先构建 @monorepo/shared 的 build 任务，再构建 @monorepo/ui 的 build
```

## 总结

- Turborepo 自动确定构建顺序，你不需要手动管理
- `^` 表示"上游依赖"，确保被依赖的包先构建
- `outputs` 声明构建产物，用于缓存匹配
- `cache: false` 用于持续运行的任务（dev server）
- 缓存机制避免重复构建，大幅提升开发体验

接下来，我们将深入每个包的代码实现，从最底层的 `shared` 开始 → [06 - Shared 共享包](./06-Shared共享包.md)
