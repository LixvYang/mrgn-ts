import { Elysia } from "elysia";
import { env } from "./config/env";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { store } from "./plugins/store";
import { computer } from "./routes/api/user";
import { loggerMiddleware } from "./middleware/logger";
import { logger } from "./config/logger";

// Create main app
const app = new Elysia()
  // Add plugins
  .use(swagger())
  .use(cors())
  .use(store)
  .use(loggerMiddleware)

  // Add route groups
  .get("/health_check", () => {
    return {
      message: "ok",
    };
  })
  .use(computer);

// Start server
const startServer = async () => {
  try {
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
