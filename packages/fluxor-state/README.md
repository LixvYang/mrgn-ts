# Fluxor State Store

这是一个基于 Zustand 的状态管理库，专门用于管理 Fluxor 相关的数据，包括全局统计数据和 TVL/APY 数据。

## 特性

- 🚀 **智能缓存**: 自动缓存 API 响应，减少重复请求
- 💾 **持久化存储**: 数据持久化到 localStorage，页面刷新后保持状态
- 🔄 **自动刷新**: 支持强制刷新数据，忽略缓存
- 🗑️ **缓存管理**: 提供灵活的缓存清理方法
- 📊 **类型安全**: 完整的 TypeScript 类型支持

## 安装

```bash
npm install @mrgnlabs/fluxor-state
# 或
yarn add @mrgnlabs/fluxor-state
# 或
pnpm add @mrgnlabs/fluxor-state
```

## 使用方法

### 基本使用

```typescript
import { createFluxorStore } from "@mrgnlabs/fluxor-state";

// 创建 store 实例
const fluxorStore = createFluxorStore();

// 获取全局统计数据
const globalStats = await fluxorStore.getGlobalStatistics("your-group-address");

// 获取 TVL/APY 数据
const tvlApyData = await fluxorStore.getTvlApy("group-address", "bank-address", 7);
```

### React Hook 使用

```typescript
import { createFluxorStore } from "@mrgnlabs/fluxor-state";
import { useEffect, useState } from "react";

const fluxorStore = createFluxorStore();

function MyComponent() {
  const [globalStats, setGlobalStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await fluxorStore.getGlobalStatistics("your-group-address");
        setGlobalStats(data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!globalStats) return <div>No data</div>;

  return (
    <div>
      <h2>Global Statistics</h2>
      <p>TVL: {globalStats.tvl}</p>
      <p>Total Supply: {globalStats.totalSupply}</p>
      <p>Total Borrow: {globalStats.totalBorrow}</p>
    </div>
  );
}
```

## API 参考

### Store 方法

#### `getGlobalStatistics(groupAddress: string, forceRefresh?: boolean)`

获取全局统计数据。

- `groupAddress`: 组地址
- `forceRefresh`: 是否强制刷新（忽略缓存），默认为 `false`

返回: `Promise<FluxorGlobalStatisticsResponse | null>`

#### `getTvlApy(groupAddress: string, bankAddress: string, day: number, forceRefresh?: boolean)`

获取 TVL/APY 数据。

- `groupAddress`: 组地址
- `bankAddress`: 银行地址
- `day`: 天数
- `forceRefresh`: 是否强制刷新（忽略缓存），默认为 `false`

返回: `Promise<FluxorBankTvlApyResponse | null>`

#### `clearCache()`

清除所有缓存数据。

#### `clearGlobalStatisticsCache(groupAddress?: string)`

清除全局统计数据缓存。

- `groupAddress`: 可选的组地址，如果不提供则清除所有缓存

#### `clearTvlApyCache(groupAddress?: string, bankAddress?: string)`

清除 TVL/APY 数据缓存。

- `groupAddress`: 可选的组地址
- `bankAddress`: 可选的银行地址

### 缓存策略

- **缓存时间**: 全局统计数据和 TVL/APY 数据都缓存 5 分钟
- **智能回退**: 如果 API 请求失败但有缓存数据，会返回缓存数据
- **持久化**: 缓存数据会保存到 localStorage，页面刷新后保持

### 数据类型

#### `FluxorGlobalStatisticsResponse`

```typescript
interface FluxorGlobalStatisticsResponse {
  tvl: string;
  totalSupply: string;
  totalBorrow: string;
  supplyItems: {
    bankAsset: FluxorBankAsset;
    supply: string;
    ratio: string;
  }[];
  borrowItems: {
    bankAsset: FluxorBankAsset;
    borrow: string;
    ratio: string;
  }[];
}
```

#### `FluxorBankTvlApyResponse`

```typescript
interface FluxorBankTvlApyResponse {
  items: {
    timestamp: number;
    supplyApy: string;
    borrowApy: string;
    totalSupply: string;
    totalBorrow: string;
  }[];
}
```

## 最佳实践

### 1. 错误处理

```typescript
try {
  const data = await fluxorStore.getGlobalStatistics("group-address");
  if (data) {
    // 处理数据
  } else {
    // 处理无数据情况
  }
} catch (error) {
  // 处理错误
  console.error("Failed to fetch data:", error);
}
```

### 2. 强制刷新

```typescript
// 在需要最新数据时使用
const freshData = await fluxorStore.getGlobalStatistics("group-address", true);
```

### 3. 缓存管理

```typescript
// 清除特定组的缓存
fluxorStore.clearGlobalStatisticsCache("group-address");

// 清除所有缓存
fluxorStore.clearCache();
```

### 4. 性能优化

```typescript
// 在组件卸载时清理缓存（可选）
useEffect(() => {
  return () => {
    // 组件卸载时可以选择清理缓存
    // fluxorStore.clearCache();
  };
}, []);
```

## 注意事项

1. **网络错误处理**: 当 API 请求失败时，store 会尝试返回缓存数据
2. **缓存过期**: 缓存数据会在 5 分钟后自动过期
3. **持久化**: 数据会保存到 localStorage，注意存储空间
4. **并发请求**: 相同的请求不会重复发送，会等待第一个请求完成

## 开发

### 构建

```bash
npm run build
```

### 测试

```bash
npm test
```

### 类型检查

```bash
npm run type-check
```

## 许可证

MIT
