import pino from "pino";
import pretty from "pino-pretty";
import fs from "fs";
import path from "path";
import { env } from "./env";

// 日志文件配置
const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "app.log");
const ERROR_LOG_FILE = path.join(LOG_DIR, "error.log");

// 确保日志目录存在
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

// 创建日志实例
export const logger = pino(
  {
    level: env.NODE_ENV === "development" ? "debug" : "info",
    timestamp: true,
  },
  pino.multistream([
    // 开发环境下的控制台美化输出
    {
      level: "debug",
      stream: pretty({
        colorize: true,
        translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
        ignore: "hostname,pid",
      }),
    },
    // 普通日志文件流
    {
      level: "info",
      stream: fs.createWriteStream(LOG_FILE, { flags: "a" }),
    },
    // 错误日志文件流
    {
      level: "error",
      stream: fs.createWriteStream(ERROR_LOG_FILE, { flags: "a" }),
    },
  ])
);
