import { Elysia } from "elysia";
import { env } from "./config/env";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { store } from "./plugins/store";
import { computer } from "./routes/api/user";
import { groupRouter } from "./routes/api/group";
import { loggerMiddleware } from "./middleware/logger";
import { logger } from "./config/logger";
import { startGroupDataRefreshTask } from "./tasks/groupDataTask";
// import { marginfiClient } from "./marginfi";
// import { redisClient } from "./store";
import { cron } from "@elysiajs/cron";

// Create main app
const app = new Elysia()
  // Add plugins
  .use(swagger())
  .use(
    cors({
      //   exposeHeaders: ["X-Request-Id"],
      //   allowedHeaders: ["X-Request-Id"],
    })
  )
  .use(
    cron({
      name: "heartbeat",
      pattern: "*/10 * * * * *",
      run() {
        startGroupDataRefreshTask();
      },
    })
  )
  .use(store)
  .use(loggerMiddleware)

  // Add route groups
  .get("/health_check", () => {
    return {
      message: "ok",
    };
  })
  .use(computer)
  .use(groupRouter);

// Start server
const startServer = async () => {
  try {
    // 启动后台数据刷新任务
    // await startGroupDataRefreshTask();
    // logger.info("Started group data refresh task");

    // const clientBanks = [...marginfiClient.banks.values()];

    // clientBanks.forEach((bank) => {
    //   console.log(bank.address.toBase58());
    //   console.log(bank);
    //   redisClient.set(bank.address.toBase58(), JSON.stringify(bank));
    // });
    // Start actual application server
    app.listen({
      port: env.PORT,
      hostname: env.HOST,
    });

    logger.info(`🦊 Server is running at ${app.server?.hostname}:${app.server?.port}`);
  } catch (err) {
    const error = err as { code?: string };
    if (error.code === "EADDRINUSE") {
      logger.error(`Port ${env.PORT} is already in use. Please choose a different port.`);
      process.exit(1);
    }
    logger.error("Failed to start server:", err);
    process.exit(1);
  }
};

// 优雅关闭
process.on("SIGINT", () => {
  logger.info("Shutting down server...");
  if (app.server) {
    app.server.stop();
  }
  process.exit(0);
});

// Start server
startServer();

// Export for testing
export default app;
