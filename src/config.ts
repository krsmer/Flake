type AppConfig = {
  clearnodeWsUrl: string;
  privateKey: string;
  rpcUrl: string;
  appName: string;
};

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function loadConfig(): AppConfig {
  return {
    clearnodeWsUrl: getEnv("CLEARNODE_WS_URL"),
    privateKey: getEnv("PRIVATE_KEY"),
    rpcUrl: getEnv("RPC_URL"),
    appName: getEnv("APP_NAME")
  };
}
