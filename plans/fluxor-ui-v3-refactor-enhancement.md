# Fluxor UI v3 - UI Refactoring & Enhancement Plan

**创建日期**: 2025-12-06
**类型**: Feature Enhancement & Refactoring
**优先级**: High
**预计复杂度**: Large (Multi-Phase)

---

## 概述 (Overview)

本计划旨在全面重构和增强 Fluxor UI v3 应用,基于对当前实现的深入分析和DeFi借贷市场最佳实践的研究,提出系统性的改进方案。

**当前状态**: Fluxor UI v3 是一个基于 Next.js 14 的 Solana DeFi 借贷平台,具备核心借贷功能,但在数据展示、风险管理和用户体验方面存在优化空间。

**目标**: 提升至行业领先水平 (对标 Aave、Kamino、NAVI Protocol),增强用户体验、风险可视化和数据洞察能力。

---

## 当前应用分析总结

### ✅ 已实现的核心功能

1. **核心借贷操作**
   - 存款/借款/还款/提款完整流程
   - 实时 APY 显示
   - 健康度计算和展示
   - E-mode 和隔离池支持

2. **数据展示**
   - 全局统计 (TVL, Total Supply/Borrow)
   - 资产列表 (桌面/移动端)
   - 投资组合仪表板
   - 7日历史数据

3. **技术架构**
   - 多层 Provider 结构 (State, Wallet, Auth, Action)
   - React Query (服务器状态) + Zustand (客户端状态)
   - Radix UI 组件库
   - Mixin 钱包集成

### ⚠️ 需要改进的领域

根据与 Aave、Kamino、NAVI Protocol 等主流协议对比,Fluxor UI v3 在以下方面存在差距:

1. **风险管理工具** - 缺少清算价格计算器、详细风险预警
2. **数据可视化** - 缺少 24h 变化、资产分布图、价格图表
3. **交易历史** - 完全缺失用户交易记录
4. **收益工具** - 缺少 APY 计算器、收益预测
5. **通知系统** - 只有基础 Toast 提示,无通知中心
6. **搜索和筛选** - 基础分类过滤,缺少高级筛选
7. **性能优化** - 图表功能已注释,可能存在性能问题

---

## 问题陈述 (Problem Statement)

### 用户痛点

1. **风险感知不足**: 用户无法清晰了解清算风险,不知道在什么价格会被清算
2. **数据盲区**: 缺少短期变化趋势 (24h),无法快速判断市场动向
3. **历史追溯困难**: 没有交易历史,用户难以回顾操作记录
4. **收益规划困难**: 无法提前预估收益,影响资金配置决策
5. **信息过载**: 大量资产列表缺少有效搜索和筛选工具

### 业务影响

- **用户留存率低**: 缺少必要工具导致用户转向竞品 (Kamino、MarginFi)
- **清算率高**: 风险管理工具不足,用户容易被清算
- **新手门槛高**: 缺少引导和教育,新用户难以上手

---

## 建议解决方案 (Proposed Solution)

### 分阶段实施策略

采用**渐进式增强**策略,分为三个阶段:

1. **Phase 1: 关键功能补充** (2-3周) - 补齐核心缺失功能
2. **Phase 2: 体验优化** (3-4周) - 提升整体用户体验
3. **Phase 3: 高级功能** (4-6周) - 添加差异化竞争优势

---

## Phase 1: 关键功能补充 (Critical Features)

### 1.1 清算风险管理系统 🚨

**优先级**: P0 (最高)
**文件位置**: 新建 `apps/fluxor-ui-v3/src/components/common/liquidation-risk/`

**功能需求**:

```typescript
// liquidation-risk-calculator.tsx
interface LiquidationRiskData {
  currentHealthFactor: number;
  liquidationPrice: Record<string, number>; // 每个抵押资产的清算价格
  distanceToLiquidation: number; // 距离清算的距离 (%)
  safetyBuffer: number; // 安全缓冲 ($)
  recommendedActions: LiquidationAction[];
}

interface LiquidationAction {
  type: 'add_collateral' | 'repay_debt' | 'close_position';
  asset: string;
  amount: number;
  impact: number; // 对健康度的影响
}
```

**UI 组件**:

1. **LiquidationPriceCard** - 清算价格卡片
   - 显示每个抵押资产的清算价格
   - 当前价格 vs 清算价格的距离
   - 视觉化进度条 (绿/黄/红)

2. **RiskZoneVisualization** - 风险区域可视化
   - 健康度范围图 (0-100%)
   - 标注当前位置
   - 安全区 / 警告区 / 危险区

3. **ActionRecommendations** - 操作建议
   - "Add X USDC to reach safety" - 需要添加多少才能达到安全
   - "Can withdraw up to X SOL safely" - 可以安全提取多少

**集成位置**:
- 投资组合页面 (`portfolio.tsx`) - 健康度卡片下方
- 主页 ActionBox - 交易预览时显示风险评估

**技术实现**:
```typescript
// 使用 marginfi-client-v2 的模拟功能
import { MarginfiAccount } from '@mrgnlabs/marginfi-client-v2';

function calculateLiquidationPrice(account: MarginfiAccount, collateralMint: string) {
  // 公式: 清算价格 = 当前价格 × (1 - (健康度 - 1) / LTV)
  const collateralBalance = account.balances.find(b => b.mint === collateralMint);
  const ltv = collateralBalance.bank.config.loanToValueRatio;
  const currentPrice = collateralBalance.bank.price;
  const healthFactor = account.healthFactor;

  return currentPrice * (1 - (healthFactor - 1) / ltv);
}
```

**参考文件**:
- 当前健康度计算: `apps/fluxor-ui-v3/src/components/common/Portfolio/lending-portfolio.tsx:223-242`
- 账户数据 Hook: `packages/mrgn-state/src/hooks/use-marginfi-account.ts`

---

### 1.2 24小时数据变化追踪 📊

**优先级**: P0
**文件位置**: 修改现有组件

**需要修改的文件**:

1. **GlobalStatistics** (`apps/fluxor-ui-v3/src/components/common/GlobalStatistics/global-statistics.tsx`)

```typescript
// 扩展接口
interface GlobalStats {
  tvl: string;
  tvl24hChange: number;        // ← 新增
  tvl24hChangePercent: number; // ← 新增
  totalSupply: string;
  totalSupply24hChange: number; // ← 新增
  totalBorrow: string;
  totalBorrow24hChange: number; // ← 新增
}

// UI 更新
<div className="stat-card">
  <div className="stat-label">Total Value Locked</div>
  <div className="stat-value">${formatNumber(tvl)}</div>
  <div className={`stat-change ${tvl24hChangePercent >= 0 ? 'positive' : 'negative'}`}>
    {tvl24hChangePercent >= 0 ? '↑' : '↓'} {Math.abs(tvl24hChangePercent).toFixed(2)}%
    <span className="change-timeframe">24h</span>
  </div>
</div>
```

2. **AssetList Columns** (`apps/fluxor-ui-v3/src/components/desktop/AssetList/utils/columnDataUtils.tsx`)

新增列:
- **Price 24h Change** - 价格变化
- **APY 24h Change** - 利率变化
- **Liquidity 24h Change** - 流动性变化

```typescript
// 新增 column
export const getPriceChangeCell = ({ bank }: { bank: ExtendedBankInfo }) => {
  const change24h = bank.price24hChange || 0;

  return (
    <div className={`flex items-center gap-2 ${change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
      {change24h >= 0 ? '↑' : '↓'} {Math.abs(change24h).toFixed(2)}%
    </div>
  );
};
```

**数据来源**:
- 扩展 `@mrgnlabs/fluxor-state` API - `getGlobalStatistics` 返回 24h 数据
- 使用 Birdeye API 获取历史价格数据 (已有集成)

---

### 1.3 交易历史记录系统 📜

**优先级**: P1
**文件位置**: 新建 `apps/fluxor-ui-v3/src/components/common/transaction-history/`

**数据模型**:

```typescript
// types/transaction.ts
interface Transaction {
  id: string;
  timestamp: number;
  type: 'deposit' | 'withdraw' | 'borrow' | 'repay' | 'liquidation' | 'stake' | 'unstake';
  asset: {
    mint: string;
    symbol: string;
    logoUrl: string;
  };
  amount: number;
  usdValue: number;
  txHash: string;
  status: 'success' | 'failed' | 'pending';
  healthFactorBefore?: number;
  healthFactorAfter?: number;
  gasFee?: number;
}
```

**UI 组件**:

1. **TransactionHistoryTable** - 交易历史表格
   - 时间线视图 (按日期分组)
   - 交易类型图标
   - 资产徽章
   - 金额 (+ 绿色 / - 红色)
   - 状态指示器
   - 链接到区块浏览器 (Solscan/Solana Explorer)

2. **HistoryFilters** - 筛选器
   - 交易类型 (多选)
   - 资产选择
   - 时间范围 (7d/30d/90d/All)
   - 状态筛选

3. **ExportButton** - 导出功能
   - 导出 CSV (用于税务记录)
   - 日期范围选择

**集成位置**:
- 投资组合页面 (`portfolio.tsx`) - 新增 "History" 标签页
- 布局: `Positions | Analytics | History`

**技术实现**:

```typescript
// hooks/use-transaction-history.ts
import { useQuery } from '@tanstack/react-query';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

export function useTransactionHistory(accountAddress: string | undefined) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ['transaction-history', accountAddress],
    queryFn: async () => {
      if (!accountAddress) return [];

      // 方案1: 从 Solana RPC 获取交易签名
      const signatures = await connection.getSignaturesForAddress(
        new PublicKey(accountAddress),
        { limit: 100 }
      );

      // 方案2: 从后端索引服务获取 (更高效)
      // const res = await fetch(`/api/transactions/${accountAddress}`);
      // return res.json();

      // 解析交易详情
      const transactions = await Promise.all(
        signatures.map(async (sig) => {
          const tx = await connection.getParsedTransaction(sig.signature);
          return parseMarginfiTransaction(tx);
        })
      );

      return transactions;
    },
    enabled: !!accountAddress,
    staleTime: 30_000, // 30 seconds
  });
}

// 解析 MarginFi 交易
function parseMarginfiTransaction(tx: ParsedTransactionWithMeta): Transaction | null {
  // 识别 MarginFi 程序指令
  const marginfiInstruction = tx.transaction.message.instructions.find(
    ix => ix.programId.equals(MARGINFI_PROGRAM_ID)
  );

  if (!marginfiInstruction) return null;

  // 根据指令类型解析
  const instructionData = marginfiInstruction.data;
  const type = parseInstructionType(instructionData); // 'deposit' | 'borrow' | ...

  return {
    id: tx.transaction.signatures[0],
    timestamp: tx.blockTime * 1000,
    type,
    // ... 其他字段
  };
}
```

**性能优化**:
- 虚拟滚动 (react-window) - 支持大量历史记录
- 分页加载 - 初始加载最近 50 条
- 后台索引服务 - 预处理交易数据 (推荐长期方案)

**参考文件**:
- Solana 连接: `packages/mrgn-common/src/config.ts`
- 程序 ID: `packages/marginfi-client-v2/src/constants.ts`

---

### 1.4 APY 收益计算器 💰

**优先级**: P1
**文件位置**: 新建 `apps/fluxor-ui-v3/src/components/common/apy-calculator/`

**功能需求**:

```typescript
// apy-calculator.tsx
interface APYCalculatorProps {
  bank: ExtendedBankInfo;
  initialAmount?: number;
  mode: 'lending' | 'borrowing';
}

interface CalculationResult {
  principal: number;
  interestEarned: number;
  totalValue: number;
  effectiveAPY: number; // 考虑复利
  breakdown: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
}
```

**UI 组件**:

1. **CalculatorInput** - 输入区
   - 金额输入框
   - 时间周期选择器 (1天/7天/30天/1年/自定义)
   - 复利频率选择 (每日/每周/每月)

2. **ResultsDisplay** - 结果展示
   - 大号收益数字
   - 时间线图表 (收益增长曲线)
   - 详细分解 (本金 + 利息)

3. **ComparisonTable** - 对比表格
   - 同类资产收益对比
   - "If you had invested in X instead" 场景

**计算逻辑**:

```typescript
// utils/apy-calculations.ts

// 考虑复利的 APY 计算
export function calculateCompoundedReturns(
  principal: number,
  apy: number,
  days: number,
  compoundFrequency: 'daily' | 'weekly' | 'monthly' = 'daily'
): CalculationResult {
  const periods = {
    daily: days,
    weekly: days / 7,
    monthly: days / 30,
  }[compoundFrequency];

  const ratePerPeriod = apy / (365 / (days / periods));
  const totalValue = principal * Math.pow(1 + ratePerPeriod, periods);
  const interestEarned = totalValue - principal;

  return {
    principal,
    interestEarned,
    totalValue,
    effectiveAPY: (totalValue / principal - 1) * (365 / days) * 100,
    breakdown: {
      daily: interestEarned / days,
      weekly: interestEarned / (days / 7),
      monthly: interestEarned / (days / 30),
      yearly: interestEarned * (365 / days),
    },
  };
}
```

**集成位置**:
- 主页资产列表 - 点击 APY 数字打开 Dialog
- 投资组合页面 - 每个持仓旁边显示预测收益

**参考文件**:
- 当前 APY 数据: `packages/mrgn-state/src/hooks/use-banks.ts`
- Dialog 组件: `packages/mrgn-ui/src/components/ui/dialog.tsx`

---

## Phase 2: 体验优化 (UX Enhancements)

### 2.1 资产分布可视化 🥧

**优先级**: P2
**文件位置**: `apps/fluxor-ui-v3/src/components/common/Portfolio/components/asset-distribution/`

**图表组件**:

```typescript
// asset-distribution-chart.tsx
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface AssetDistribution {
  symbol: string;
  value: number;
  percentage: number;
  color: string;
}

export function AssetDistributionChart({ type }: { type: 'collateral' | 'debt' }) {
  const { data } = useAccountSummary();

  const chartData: AssetDistribution[] = type === 'collateral'
    ? data.collateralAssets.map(asset => ({
        symbol: asset.symbol,
        value: asset.usdValue,
        percentage: (asset.usdValue / data.totalCollateral) * 100,
        color: getAssetColor(asset.symbol),
      }))
    : // ... 类似的借款资产处理

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="symbol"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={({ symbol, percentage }) => `${symbol} ${percentage.toFixed(1)}%`}
        >
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => `$${formatNumber(value)}`}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

**集成位置**:
- 投资组合页面 (`portfolio.tsx`) - 健康度下方
- 两个并排饼图: Collateral Distribution | Debt Distribution

---

### 2.2 迷你价格图表 📉

**优先级**: P2
**文件位置**: `apps/fluxor-ui-v3/src/components/desktop/AssetList/components/mini-price-chart.tsx`

**Sparkline 组件**:

```typescript
// mini-price-chart.tsx
import { Sparklines, SparklinesLine } from 'react-sparklines';

interface MiniPriceChartProps {
  data: number[]; // 7天价格历史
  current: number;
}

export function MiniPriceChart({ data, current }: MiniPriceChartProps) {
  const trend = current > data[0] ? 'up' : 'down';
  const color = trend === 'up' ? '#75BA80' : '#CF6F6F';

  return (
    <div className="w-24 h-8">
      <Sparklines data={data} width={96} height={32}>
        <SparklinesLine color={color} style={{ strokeWidth: 2, fill: 'none' }} />
      </Sparklines>
    </div>
  );
}
```

**集成位置**:
- 主页资产列表 (`AssetList.tsx`) - Price 列中
- 替换: `apps/fluxor-ui-v3/src/components/desktop/AssetList/components/AssetCells.tsx:getAssetPriceCell`

**数据来源**:
- Birdeye API - 7天历史价格
- 缓存策略: React Query 缓存 1 小时

---

### 2.3 高级搜索和筛选 🔍

**优先级**: P2
**文件位置**: `apps/fluxor-ui-v3/src/components/desktop/AssetList/components/advanced-filters.tsx`

**筛选器功能**:

1. **APY 范围筛选**
   - 双滑块组件 (0-100%)
   - 预设快捷选项: >5%, >10%, >20%

2. **流动性范围筛选**
   - 最小流动性阈值
   - 排除低流动性资产

3. **风险等级筛选**
   - 低风险 (稳定币)
   - 中风险 (LST)
   - 高风险 (Meme 币)

4. **持仓状态筛选**
   - 有持仓
   - 无持仓
   - 全部

**全局搜索面板** (Cmd+K):

```typescript
// components/global-search.tsx
import { Command } from 'cmdk';

export function GlobalSearchDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <Command.Dialog open={open} onOpenChange={setOpen}>
      <Command.Input placeholder="Search assets, banks, or actions..." />
      <Command.List>
        <Command.Group heading="Assets">
          {banks.map(bank => (
            <Command.Item key={bank.address} onSelect={() => navigateToBank(bank)}>
              {bank.meta.tokenSymbol}
            </Command.Item>
          ))}
        </Command.Group>
        <Command.Group heading="Actions">
          <Command.Item onSelect={() => openLendDialog()}>Lend</Command.Item>
          <Command.Item onSelect={() => openBorrowDialog()}>Borrow</Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
```

**参考文件**:
- 当前筛选器: `apps/fluxor-ui-v3/src/components/desktop/AssetList/components/AssetListNav.tsx`
- 快捷键配置: `apps/fluxor-ui-v3/src/hooks/use-keyboard-shortcuts.ts`

---

### 2.4 通知中心 🔔

**优先级**: P2
**文件位置**: 新建 `apps/fluxor-ui-v3/src/components/common/notifications/`

**通知类型**:

```typescript
// types/notification.ts
interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  category: 'liquidation_risk' | 'apy_change' | 'new_pool' | 'rewards' | 'transaction';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}
```

**UI 组件**:

1. **NotificationBell** - 通知图标
   - 未读数量徽章
   - 点击打开通知面板

2. **NotificationPanel** - 通知面板
   - 通知列表 (时间倒序)
   - 标记已读/全部已读
   - 删除通知

3. **NotificationSettings** - 通知设置
   - 开关不同类型通知
   - 通知频率设置

**触发逻辑**:

```typescript
// hooks/use-liquidation-alerts.ts
import { useEffect } from 'react';
import { useAccountSummary } from '@mrgnlabs/mrgn-state';
import { useNotifications } from './use-notifications';

export function useLiquidationAlerts() {
  const { data: summary } = useAccountSummary();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!summary) return;

    const healthFactor = summary.healthFactor;

    if (healthFactor < 1.5 && healthFactor >= 1.2) {
      addNotification({
        type: 'warning',
        category: 'liquidation_risk',
        title: 'Moderate Liquidation Risk',
        message: `Your health factor is ${healthFactor.toFixed(2)}. Consider adding collateral.`,
        actionUrl: '/portfolio',
        actionLabel: 'Manage Position',
      });
    } else if (healthFactor < 1.2 && healthFactor >= 1.05) {
      addNotification({
        type: 'error',
        category: 'liquidation_risk',
        title: 'High Liquidation Risk',
        message: `⚠️ Your health factor is ${healthFactor.toFixed(2)}. Urgent action needed!`,
        actionUrl: '/portfolio',
        actionLabel: 'Add Collateral Now',
      });
    } else if (healthFactor < 1.05) {
      addNotification({
        type: 'error',
        category: 'liquidation_risk',
        title: '🚨 Critical: Liquidation Imminent',
        message: `Your position may be liquidated soon. Health factor: ${healthFactor.toFixed(2)}`,
        actionUrl: '/portfolio',
        actionLabel: 'Emergency Action',
      });
    }
  }, [summary, addNotification]);
}
```

**集成位置**:
- 导航栏右上角 - NotificationBell 组件
- 投资组合页面 - 风险警告横幅

---

## Phase 3: 高级功能 (Advanced Features)

### 3.1 Dashboard 仪表板 📈

**优先级**: P3
**文件位置**: 新建 `apps/fluxor-ui-v3/src/pages/dashboard.tsx`

**布局结构**:

```typescript
// pages/dashboard.tsx
export default function DashboardPage() {
  return (
    <div className="dashboard-grid">
      {/* 关键指标卡片 */}
      <section className="key-metrics">
        <MetricCard
          label="Total Assets"
          value={totalAssets}
          change24h={assetsChange}
          icon={<WalletIcon />}
        />
        <MetricCard
          label="Net APY"
          value={weightedAvgAPY}
          subtitle="Weighted average"
          icon={<TrendingUpIcon />}
        />
        <MetricCard
          label="Health Factor"
          value={healthFactor}
          status={getHealthStatus(healthFactor)}
          icon={<ShieldIcon />}
        />
        <MetricCard
          label="This Month"
          value={monthlyEarnings}
          change={monthlyChange}
          icon={<DollarIcon />}
        />
      </section>

      {/* 快速操作区 */}
      <section className="quick-actions">
        <QuickActionButton
          action="deposit"
          asset="USDC"
          label="Deposit USDC"
        />
        <QuickActionButton
          action="repay"
          label="Repay Debt"
        />
        <QuickActionButton
          action="adjust"
          label="Optimize Health"
        />
      </section>

      {/* 市场概览 */}
      <section className="market-overview">
        <h2>Hot Markets</h2>
        <TopAssetsTable type="highest-apy" limit={5} />
        <TVLTrendChart timeframe="7d" />
      </section>

      {/* 个人时间线 */}
      <section className="activity-timeline">
        <h2>Recent Activity</h2>
        <Timeline items={recentTransactions} />
      </section>
    </div>
  );
}
```

**数据聚合**:

```typescript
// hooks/use-dashboard-data.ts
export function useDashboardData() {
  const { data: summary } = useAccountSummary();
  const { data: banks } = useExtendedBanks();
  const { data: transactions } = useTransactionHistory();

  // 计算加权平均 APY
  const weightedAvgAPY = useMemo(() => {
    if (!summary) return 0;

    const totalLendingAPY = summary.lendingPositions.reduce(
      (acc, pos) => acc + pos.usdValue * pos.apy,
      0
    );
    const totalBorrowingAPY = summary.borrowingPositions.reduce(
      (acc, pos) => acc + pos.usdValue * pos.apy,
      0
    );

    return (totalLendingAPY - totalBorrowingAPY) / summary.totalAssets;
  }, [summary]);

  // 本月收益
  const monthlyEarnings = useMemo(() => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return transactions
      ?.filter(tx => tx.timestamp >= startOfMonth.getTime())
      .reduce((acc, tx) => {
        if (tx.type === 'deposit') return acc + tx.interestEarned;
        if (tx.type === 'borrow') return acc - tx.interestPaid;
        return acc;
      }, 0) || 0;
  }, [transactions]);

  return {
    totalAssets: summary?.totalAssets || 0,
    weightedAvgAPY,
    healthFactor: summary?.healthFactor || 0,
    monthlyEarnings,
    // ...
  };
}
```

---

### 3.2 资产对比工具 ⚖️

**优先级**: P3
**文件位置**: `apps/fluxor-ui-v3/src/components/common/asset-comparison/`

**功能需求**:

1. **选择资产** - 多选 (2-4 个)
2. **并排对比** - 表格或卡片布局
3. **评分系统** - 综合评分 (APY + 风险 + 流动性)

```typescript
// asset-comparison-table.tsx
interface ComparisonMetric {
  label: string;
  getValue: (bank: ExtendedBankInfo) => string | number;
  format?: (value: any) => string;
  higher_is_better?: boolean;
}

const COMPARISON_METRICS: ComparisonMetric[] = [
  {
    label: 'Lending APY',
    getValue: (bank) => bank.info.state.lendingRate,
    format: (val) => `${(val * 100).toFixed(2)}%`,
    higher_is_better: true,
  },
  {
    label: 'Borrowing APY',
    getValue: (bank) => bank.info.state.borrowingRate,
    format: (val) => `${(val * 100).toFixed(2)}%`,
    higher_is_better: false,
  },
  {
    label: 'Available Liquidity',
    getValue: (bank) => bank.info.state.totalDeposits - bank.info.state.totalBorrows,
    format: (val) => `$${formatNumber(val)}`,
  },
  {
    label: 'Loan-to-Value',
    getValue: (bank) => bank.info.rawBank.config.assetWeightInit,
    format: (val) => `${(val * 100).toFixed(0)}%`,
  },
  {
    label: 'Risk Level',
    getValue: (bank) => getRiskLevel(bank),
  },
];

export function AssetComparisonTable({ selectedBanks }: { selectedBanks: ExtendedBankInfo[] }) {
  return (
    <table className="comparison-table">
      <thead>
        <tr>
          <th>Metric</th>
          {selectedBanks.map(bank => (
            <th key={bank.address.toString()}>
              <div className="bank-header">
                <img src={bank.meta.tokenLogoUri} alt={bank.meta.tokenSymbol} />
                <span>{bank.meta.tokenSymbol}</span>
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {COMPARISON_METRICS.map(metric => (
          <tr key={metric.label}>
            <td className="metric-label">{metric.label}</td>
            {selectedBanks.map(bank => {
              const value = metric.getValue(bank);
              const formatted = metric.format ? metric.format(value) : value;

              return (
                <td key={bank.address.toString()}>
                  {formatted}
                  {metric.higher_is_better !== undefined && (
                    <BestValueBadge
                      isBest={checkIfBest(value, selectedBanks, metric)}
                    />
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

### 3.3 多语言支持 🌍

**优先级**: P3
**文件位置**: `apps/fluxor-ui-v3/locales/`

**实现方案**: 使用 `next-intl`

```bash
pnpm add next-intl
```

**文件结构**:
```
apps/fluxor-ui-v3/
├── locales/
│   ├── zh-CN.json  # 简体中文
│   ├── en-US.json  # 英文
│   ├── ja-JP.json  # 日文
│   └── ko-KR.json  # 韩文
├── middleware.ts   # 语言检测中间件
└── i18n.ts        # 配置文件
```

**翻译示例**:

```json
// locales/zh-CN.json
{
  "common": {
    "lend": "存入",
    "borrow": "借出",
    "repay": "还款",
    "withdraw": "提取",
    "health_factor": "健康度",
    "liquidation_price": "清算价格"
  },
  "portfolio": {
    "title": "我的投资组合",
    "total_supplied": "存入总额",
    "total_borrowed": "借出总额",
    "net_value": "净值",
    "no_positions": "暂无持仓,开始存入资产以赚取收益!"
  }
}

// locales/en-US.json
{
  "common": {
    "lend": "Lend",
    "borrow": "Borrow",
    "repay": "Repay",
    "withdraw": "Withdraw",
    "health_factor": "Health Factor",
    "liquidation_price": "Liquidation Price"
  },
  "portfolio": {
    "title": "My Portfolio",
    "total_supplied": "Total Supplied",
    "total_borrowed": "Total Borrowed",
    "net_value": "Net Value",
    "no_positions": "No positions yet. Start lending to earn yield!"
  }
}
```

**使用方式**:

```typescript
// components/portfolio.tsx
import { useTranslations } from 'next-intl';

export function PortfolioPage() {
  const t = useTranslations('portfolio');

  return (
    <div>
      <h1>{t('title')}</h1>
      <div>
        <label>{t('total_supplied')}</label>
        <value>{formatUSD(totalSupplied)}</value>
      </div>
    </div>
  );
}
```

---

## 性能优化建议

### 虚拟滚动 (Virtual Scrolling)

**场景**: 资产列表超过 100 项时

```typescript
// components/virtualized-asset-list.tsx
import { FixedSizeList } from 'react-window';

export function VirtualizedAssetList({ banks }: { banks: ExtendedBankInfo[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <AssetRow bank={banks[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={banks.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

### 图表懒加载

**启用已注释的图表**:

```typescript
// components/portfolio/portfolio-charts.tsx (当前已注释)
import dynamic from 'next/dynamic';

// 懒加载图表组件
const PortfolioCharts = dynamic(() => import('./charts/portfolio-analytics'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // 图表不需要 SSR
});

export function AnalyticsTab() {
  const [showCharts, setShowCharts] = useState(false);

  useEffect(() => {
    // 用户切换到 Analytics 标签页时才加载
    setShowCharts(true);
  }, []);

  return showCharts ? <PortfolioCharts /> : <ChartSkeleton />;
}
```

### Web Worker 计算

**场景**: 复杂的投资组合计算

```typescript
// workers/portfolio-calculator.worker.ts
self.addEventListener('message', (e) => {
  const { balances, banks, oraclePrices } = e.data;

  // 复杂计算逻辑
  const result = calculatePortfolioMetrics(balances, banks, oraclePrices);

  self.postMessage(result);
});

// hooks/use-portfolio-worker.ts
import { useEffect, useState } from 'react';

export function usePortfolioCalculation(balances, banks, prices) {
  const [result, setResult] = useState(null);

  useEffect(() => {
    const worker = new Worker(new URL('../workers/portfolio-calculator.worker.ts', import.meta.url));

    worker.postMessage({ balances, banks, oraclePrices: prices });
    worker.onmessage = (e) => setResult(e.data);

    return () => worker.terminate();
  }, [balances, banks, prices]);

  return result;
}
```

---

## 技术实现路径

### Phase 1 实现步骤 (2-3 周)

**Week 1: 清算风险 + 24h 数据**
1. Day 1-2: 实现清算价格计算逻辑
2. Day 3-4: 构建风险可视化组件
3. Day 5: 集成到投资组合页面
4. Day 6-7: 添加 24h 数据到 API 和 UI

**Week 2: 交易历史**
1. Day 1-3: 实现交易解析逻辑
2. Day 4-5: 构建历史表格组件
3. Day 6-7: 添加筛选和导出功能

**Week 3: APY 计算器**
1. Day 1-2: 实现计算逻辑
2. Day 3-4: 构建交互式 UI
3. Day 5: 集成到主页和投资组合页
4. Day 6-7: 测试和优化

### Phase 2 实现步骤 (3-4 周)

**Week 4-5: 数据可视化**
1. 资产分布饼图
2. 迷你价格图表
3. 优化现有图表性能

**Week 6: 搜索和筛选**
1. 实现高级筛选器
2. 构建全局搜索 (Cmd+K)
3. 添加筛选预设保存

**Week 7: 通知中心**
1. 构建通知系统基础设施
2. 实现通知 UI 组件
3. 集成清算警告逻辑

### Phase 3 实现步骤 (4-6 周)

**Week 8-9: Dashboard**
1. 设计和实现 Dashboard 布局
2. 数据聚合和计算
3. 快速操作集成

**Week 10-11: 高级功能**
1. 资产对比工具
2. 风险模拟器

**Week 12: 多语言和收尾**
1. 实现 i18n 基础设施
2. 翻译核心文案
3. 性能优化和测试

---

## 验收标准 (Acceptance Criteria)

### Phase 1

- [ ] 清算价格在投资组合页面正确显示
- [ ] 健康度低于 1.5 时显示警告
- [ ] 24h 变化数据在所有相关位置正确显示
- [ ] 交易历史可以加载最近 100 条记录
- [ ] 交易历史可以按类型和时间筛选
- [ ] APY 计算器可以计算 1天/7天/30天/1年 收益
- [ ] 计算结果考虑复利

### Phase 2

- [ ] 资产分布饼图正确显示抵押和借款分布
- [ ] 迷你价格图表在资产列表中显示
- [ ] 高级筛选器可以按 APY 范围筛选
- [ ] 全局搜索 (Cmd+K) 可以搜索资产
- [ ] 通知中心可以显示清算警告
- [ ] 通知可以标记已读和删除

### Phase 3

- [ ] Dashboard 显示关键指标卡片
- [ ] 加权平均 APY 计算正确
- [ ] 本月收益统计准确
- [ ] 资产对比工具可以对比 2-4 个资产
- [ ] 多语言切换功能正常
- [ ] 至少支持中文和英文

---

## 成功指标 (Success Metrics)

### 用户体验指标

- **页面加载时间**: < 3 秒 (初始加载)
- **交互响应时间**: < 100ms (按钮点击到反馈)
- **移动端适配**: 100% 功能在移动端可用

### 业务指标

- **用户留存率**: 提升 20% (通过更好的工具留住用户)
- **清算率**: 降低 15% (通过更好的风险管理)
- **日活跃用户**: 提升 30% (通过 Dashboard 增加访问频率)

### 技术指标

- **代码覆盖率**: > 70% (关键功能单元测试)
- **Lighthouse 分数**:
  - Performance: > 90
  - Accessibility: > 95
  - Best Practices: > 90
  - SEO: > 95

---

## 依赖和风险

### 技术依赖

- **API 扩展**: 需要后端提供 24h 数据端点
- **索引服务**: 交易历史需要索引服务 (或 RPC 轮询)
- **图表库**: 需要选择合适的图表库 (推荐 Recharts,已在项目中)

### 潜在风险

1. **性能风险**:
   - 大量历史数据可能影响加载速度
   - 缓解: 虚拟滚动 + 分页加载

2. **数据准确性风险**:
   - 清算价格计算依赖预言机数据
   - 缓解: 显示价格更新时间戳,添加免责声明

3. **兼容性风险**:
   - 新功能可能与现有代码冲突
   - 缓解: 充分的集成测试,渐进式发布

---

## 文件位置快速索引

### 需要修改的现有文件

| 文件路径 | 修改内容 |
|---------|---------|
| `apps/fluxor-ui-v3/src/components/common/GlobalStatistics/global-statistics.tsx` | 添加 24h 变化数据 |
| `apps/fluxor-ui-v3/src/components/common/Portfolio/lending-portfolio.tsx` | 集成清算风险组件 |
| `apps/fluxor-ui-v3/src/components/desktop/AssetList/components/AssetCells.tsx` | 添加迷你价格图表 |
| `apps/fluxor-ui-v3/src/components/desktop/AssetList/utils/columnDataUtils.tsx` | 新增 24h 变化列 |
| `apps/fluxor-ui-v3/src/components/desktop/AssetList/components/AssetListNav.tsx` | 添加高级筛选器 |
| `apps/fluxor-ui-v3/src/pages/portfolio.tsx` | 新增 History 标签页 |
| `apps/fluxor-ui-v3/src/store/uiStore.ts` | 添加通知状态管理 |

### 需要新建的文件/目录

| 文件/目录路径 | 用途 |
|-------------|------|
| `apps/fluxor-ui-v3/src/components/common/liquidation-risk/` | 清算风险管理组件 |
| `apps/fluxor-ui-v3/src/components/common/transaction-history/` | 交易历史组件 |
| `apps/fluxor-ui-v3/src/components/common/apy-calculator/` | APY 计算器组件 |
| `apps/fluxor-ui-v3/src/components/common/asset-distribution/` | 资产分布图表 |
| `apps/fluxor-ui-v3/src/components/common/notifications/` | 通知中心组件 |
| `apps/fluxor-ui-v3/src/components/common/asset-comparison/` | 资产对比工具 |
| `apps/fluxor-ui-v3/src/pages/dashboard.tsx` | Dashboard 页面 |
| `apps/fluxor-ui-v3/src/hooks/use-transaction-history.ts` | 交易历史 Hook |
| `apps/fluxor-ui-v3/src/hooks/use-liquidation-alerts.ts` | 清算警告 Hook |
| `apps/fluxor-ui-v3/src/workers/portfolio-calculator.worker.ts` | Portfolio 计算 Worker |
| `apps/fluxor-ui-v3/locales/` | 多语言文件 |

---

## 参考资源

### 行业最佳实践

- **Aave Interface**: [github.com/aave/interface](https://github.com/aave/interface)
- **Kamino Finance**: [app.kamino.finance](https://app.kamino.finance)
- **NAVI Protocol**: [naviprotocol.io](https://naviprotocol.io)
- **Scallop**: [scallop.io](https://scallop.io)

### 技术文档

- **Next.js 14 App Router**: [nextjs.org/docs/app](https://nextjs.org/docs/app)
- **React Query v5**: [tanstack.com/query/v5](https://tanstack.com/query/v5)
- **Zustand**: [docs.pmnd.rs/zustand](https://docs.pmnd.rs/zustand)
- **Radix UI**: [radix-ui.com/primitives](https://radix-ui.com/primitives)

### 数据来源

- **Birdeye API**: 价格历史数据
- **Pyth Network**: 实时价格预言机
- **Solana RPC**: 交易历史
- **Fluxor Backend API**: TVL/APY 数据

---

## 总结

本计划提供了一个全面的 Fluxor UI v3 重构路线图,基于对当前实现的深入分析和 DeFi 行业最佳实践的研究。通过三个阶段的实施:

1. **Phase 1**: 补齐关键缺失功能 (清算风险、24h 数据、交易历史、APY 计算器)
2. **Phase 2**: 提升整体用户体验 (数据可视化、搜索筛选、通知中心)
3. **Phase 3**: 添加差异化功能 (Dashboard、资产对比、多语言)

Fluxor UI v3 将达到甚至超越行业领先水平,为用户提供安全、透明、高效的 DeFi 借贷体验。

---

**下一步**: 请选择以下选项之一:

1. **开始实施 Phase 1** - 使用 `/work` 命令
2. **评审计划** - 使用 `/plan_review` 命令获取专家反馈
3. **调整计划** - 提出具体修改意见
4. **简化计划** - 减少功能范围,聚焦核心价值
