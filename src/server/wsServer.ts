import ws from "ws";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { createContext } from "./router/context";
import { appRouter } from "./router";

const wss = new ws.Server({ port: 3001 });

const handler = applyWSSHandler({ wss, createContext, router: appRouter });

wss.on("connection", () => {
  console.log(`++ connected ${wss.clients.size}`);

  wss.on("close", () => {
    console.log(`-- connected ${wss.clients.size}`);
  });
});

console.log("ws server started");

process.on("SIGTERM", () => {
  console.log("SIGTERM");
  handler.broadcastReconnectNotification();
  wss.close();
});
