import WebSocket from "ws";

import { loadConfig } from "./config";

export type YellowClient = {
  ws: WebSocket;
  send: (payload: string) => void;
  close: () => void;
};

export function createYellowClient(): YellowClient {
  const config = loadConfig();
  const ws = new WebSocket(config.clearnodeWsUrl);

  return {
    ws,
    send: (payload: string) => ws.send(payload),
    close: () => ws.close()
  };
}
