import express from "express";
import clc from "cli-color";
import cors from "cors";
import config from "./config";

const app = express();

app.set("trust proxy", true);

const requestCounts = new Map();

const limiter = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 10;

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }

  const timestamps = requestCounts.get(ip);
  const filteredTimestamps = timestamps.filter(
    (timestamp) => now - timestamp < windowMs
  );

  if (filteredTimestamps.length >= maxRequests) {
    return res.status(429).send("Too many requests, please try again later.");
  }

  filteredTimestamps.push(now);
  requestCounts.set(ip, filteredTimestamps);

  next();
};

app.use(cors());
app.use(express.json());
app.use(limiter);

for (const route of config.routes) {
  const module = require(`./routes/${route}`);
  app.use(`/${route}`, module.default);
}

app.listen(config.port, () => {
  console.log("-".repeat(40));
  console.log(clc.blue(`API running at http://${config.host}:${config.port}`));
  console.log("-".repeat(40));
  console.log(clc.blue(`Frontend available at http://${config.frontend}`));
  console.log("-".repeat(40));
  console.log(clc.yellow("Routes loaded:"));
  for (const route of config.routes) {
    const module = require(`./routes/${route}`);
    const availableRoutes = module.default.stack
      .filter((r: any) => r.route)
      .map((r: any) => {
        const methods = Object.keys(r.route.methods).map((method) =>
          method.toUpperCase()
        );
        return {
          path: r.route.path,
          methods: methods,
        };
      });

    console.log(clc.blue(`  Route /${route} loaded`));
    console.log(clc.yellow(`  ⤷ POSTS`));
    const posts = availableRoutes.filter((r) => r.methods.includes("POST"));
    for (const r of posts) {
      console.log(clc.green(`    ${r.methods.join(", ")} ${r.path}`));
      console.log(
        clc.red(
          `      ⤷ URL: http://${config.host}:${config.port}/${route}${r.path}`
        )
      );
    }
    console.log(clc.yellow(`  ⤷ GETS`));
    const gets = availableRoutes.filter((r: any) => r.methods.includes("GET"));
    for (const r of gets) {
      console.log(clc.green(`    ${r.methods.join(", ")} ${r.path}`));
      console.log(
        clc.red(
          `      ⤷ URL: http://${config.host}:${config.port}/${route}${r.path}`
        )
      );
    }
  }
  console.log("-".repeat(40));
});

process.on("unhandledRejection", (reason, promise) => {
  console.log("Unhandled Rejection at:", promise, "reason:", reason);
});
