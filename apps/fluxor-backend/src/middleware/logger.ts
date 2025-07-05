import { Elysia } from "elysia";
import { logger } from "../config/logger";

type LoggerStore = {
  startTime: number;
  requestId: string;
};

export const loggerMiddleware = new Elysia()
  .decorate("logger", logger)
  .state("loggerStore", {
    startTime: 0,
    requestId: "",
  } as LoggerStore)
  .onBeforeHandle(({ request, set, store }) => {
    store.loggerStore = {
      startTime: Date.now(),
      requestId: crypto.randomUUID(),
    };

    set.headers["X-Request-Id"] = store.loggerStore.requestId;

    logger.info({
      requestId: store.loggerStore.requestId,
      method: request.method,
      url: request.url,
      msg: "Incoming request",
    });
  })
  .onAfterHandle(({ request, set, store }) => {
    const duration = Date.now() - store.loggerStore.startTime;

    logger.info({
      requestId: store.loggerStore.requestId,
      method: request.method,
      url: request.url,
      status: 200,
      duration: `${duration}ms`,
      msg: "Request completed",
    });
  })
  .onError(({ error, request, store }) => {
    const duration = Date.now() - store.loggerStore.startTime;

    logger.error({
      requestId: store.loggerStore.requestId,
      method: request.method,
      url: request.url,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
      msg: "Request failed",
    });

    // 返回错误响应
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  });
