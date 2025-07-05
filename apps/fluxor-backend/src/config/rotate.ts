import { createStream } from "rotating-file-stream";
import fs from "fs";
import path from "path";

export const LOG_DIR = path.join(process.cwd(), "logs");

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

export const rotateConfig = {
  interval: "1d",
  size: "10M",
  maxFiles: 15,
  compress: true,
};

const generator = (time: number | Date | null, index?: number): string => {
  if (!time) return "app.log";

  const date = time instanceof Date ? time : new Date(time);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return index ? `app-${year}${month}${day}-${index}.log` : `app-${year}${month}${day}.log`;
};

const errorGenerator = (time: number | Date | null, index?: number): string => {
  if (!time) return "error.log";

  const date = time instanceof Date ? time : new Date(time);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return index ? `error-${year}${month}${day}-${index}.log` : `error-${year}${month}${day}.log`;
};

export const rotator = createStream(generator, {
  size: "10M",
  interval: "1d",
  compress: "gzip",
  maxFiles: 15,
  path: LOG_DIR,
});

export const errorRotator = createStream(errorGenerator, {
  size: "10M",
  interval: "1d",
  compress: "gzip",
  maxFiles: 15,
  path: LOG_DIR,
});
