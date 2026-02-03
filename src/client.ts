import WebSocket from "ws";

import { loadConfig } from "./config";

type PendingRequest = {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
};

export type YellowClient = {
  ws: WebSocket;
  send: (payload: string) => void;
  sendAndWait: (payload: string) => Promise<any>;
  close: () => void;
};

export function createYellowClient(): YellowClient {
  const config = loadConfig();
  const ws = new WebSocket(config.clearnodeWsUrl);
  const pending = new Map<number, PendingRequest>();

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (Array.isArray(msg?.res)) {
        const requestId = msg.res[0];
        const handler = pending.get(requestId);
        if (handler) {
          pending.delete(requestId);
          handler.resolve(msg.res[2]);
        }
      }
    } catch {
      // ignore malformed messages
    }
  });

  return {
    ws,
    send: (payload: string) => ws.send(payload),
    sendAndWait: (payload: string) =>
      new Promise((resolve, reject) => {
        const requestId = (() => {
          try {
            const parsed = JSON.parse(payload);
            return parsed?.req?.[0];
          } catch {
            return null;
          }
        })();

        if (typeof requestId !== "number") {
          reject(new Error("Missing request id in payload"));
          return;
        }

        pending.set(requestId, { resolve, reject });
        ws.send(payload);
      }),
    close: () => ws.close()
  };
}
