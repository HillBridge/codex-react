import { createApp } from "./app";

const port = Number(process.env.PORT ?? 3001);

createApp({ serveStatic: true }).listen(port, () => {
  console.log(`Koa API listening on http://localhost:${port}`);
});
