# Fluxor Store 使用说明

## 快速开始

### 1. 基本使用

```typescript
import { createFluxorStore } from "@mrgnlabs/fluxor-state";

// 创建 store 实例
const store = createFluxorStore();

// 获取全局统计数据
const globalStats = await store.getGlobalStatistics("your-group-address");

// 获取 TVL/APY 数据
const tvlApy = await store.getTvlApy("group-address", "bank-address", 7);
```

### 2. React Hook 使用

```typescript
import { useGlobalStatistics, useTvlApy } from "@mrgnlabs/fluxor-state";

function MyComponent() {
  const { data, loading, error, refresh } = useGlobalStatistics("group-address");
  const { data: tvlData, loading: tvlLoading } = useTvlApy("group-address", "bank-address", 7);

  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <h2>TVL: {data?.tvl}</h2>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

### 3. 缓存管理

```typescript
import { fluxorStore } from "@mrgnlabs/fluxor-state";

// 清除特定组的缓存
fluxorStore.clearGlobalStatisticsCache("group-address");

// 清除特定银行的缓存
fluxorStore.clearTvlApyCache("group-address", "bank-address");

// 清除所有缓存
fluxorStore.clearCache();
```

## 主要特性

- ✅ **智能缓存**: 5分钟缓存，减少重复请求
- ✅ **错误回退**: API失败时返回缓存数据
- ✅ **持久化**: 数据保存到 localStorage
- ✅ **类型安全**: 完整 TypeScript 支持
- ✅ **React 集成**: 提供 React hooks

## 缓存策略

- 全局统计数据: 缓存 5 分钟
- TVL/APY 数据: 缓存 5 分钟
- 支持强制刷新忽略缓存
- 网络错误时智能回退到缓存

## 注意事项

1. 首次使用需要提供 `groupAddress` 参数
2. 缓存数据会在页面刷新后保持
3. 支持并发请求，相同请求不会重复发送
4. 所有方法都返回 Promise，记得使用 async/await
