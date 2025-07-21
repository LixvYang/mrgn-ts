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

    const requestId = store.loggerStore.requestId;
    set.headers["X-Request-Id"] = requestId;

    logger.info({
      requestId,
      method: request.method,
      url: request.url,
      msg: "Incoming request",
    });
  })
  .onAfterHandle(({ request, set, store }) => {
    const duration = Date.now() - store.loggerStore.startTime;
    const requestId = store.loggerStore.requestId;

    set.headers["X-Request-Id"] = requestId;

    logger.info({
      requestId,
      method: request.method,
      url: request.url,
      status: 200,
      duration: `${duration}ms`,
      msg: "Request completed",
    });

    return {
      headers: {
        "X-Request-Id": requestId,
      },
    };
  })
  .onError(({ error, request, set, store }) => {
    const duration = Date.now() - store.loggerStore.startTime;
    const requestId = store.loggerStore.requestId;

    set.headers["X-Request-Id"] = requestId;

    logger.error({
      requestId,
      method: request.method,
      url: request.url,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
      msg: "Request failed",
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      headers: {
        "X-Request-Id": requestId,
      },
    };
  });
