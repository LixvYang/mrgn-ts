# fluxor-ui-v4 镜像：在 GitHub Actions 里构建，Coolify 只拉镜像运行
# 构建步骤对应 zbpack.json：根目录装依赖，turbo 只编译 fluxor-ui-v4 用到的包

FROM node:20-bookworm AS builder
WORKDIR /repo
RUN corepack enable

# NEXT_PUBLIC_* 在 next build 时写进前端代码，必须作为构建参数传入；
# 服务端变量（REDIS_URL、BIRDEYE_API_KEY 等）不进镜像，运行时由 Coolify 注入
ARG NEXT_PUBLIC_MARGINFI_ENVIRONMENT
ARG NEXT_PUBLIC_MARGINFI_RPC_ENDPOINT_OVERRIDE
ARG NEXT_PUBLIC_MARGINFI_PROGRAM_OVERRIDE
ARG NEXT_PUBLIC_MARGINFI_GROUP_OVERRIDE
ARG NEXT_PUBLIC_RPC_PROXY_KEY
ARG NEXT_PUBLIC_MIXIN_BOT_ID
ARG NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_MARGINFI_ENVIRONMENT=$NEXT_PUBLIC_MARGINFI_ENVIRONMENT \
    NEXT_PUBLIC_MARGINFI_RPC_ENDPOINT_OVERRIDE=$NEXT_PUBLIC_MARGINFI_RPC_ENDPOINT_OVERRIDE \
    NEXT_PUBLIC_MARGINFI_PROGRAM_OVERRIDE=$NEXT_PUBLIC_MARGINFI_PROGRAM_OVERRIDE \
    NEXT_PUBLIC_MARGINFI_GROUP_OVERRIDE=$NEXT_PUBLIC_MARGINFI_GROUP_OVERRIDE \
    NEXT_PUBLIC_RPC_PROXY_KEY=$NEXT_PUBLIC_RPC_PROXY_KEY \
    NEXT_PUBLIC_MIXIN_BOT_ID=$NEXT_PUBLIC_MIXIN_BOT_ID \
    NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS=--max-old-space-size=8192

COPY . .
RUN pnpm install --no-frozen-lockfile
RUN pnpm build \
      --filter=marginfi-client-v2 --filter=mrgn-state --filter=mrgn-toasts --filter=mrgn-ui \
      --filter=mrgn-utils --filter=fluxor-state --filter=fluxor-ui-v4 --filter=mrgn-common \
 && rm -rf apps/fluxor-ui-v4/.next/cache

# 运行镜像用 slim 底包，整个工作区原样带过去（workspace 包之间是软链接）
FROM node:20-bookworm-slim
WORKDIR /repo
RUN corepack enable
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000
COPY --from=builder /repo /repo
EXPOSE 3000
WORKDIR /repo/apps/fluxor-ui-v4
CMD ["pnpm", "start"]
