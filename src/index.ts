import "dotenv/config";

import { loadConfig } from "./config";
import { seedProviders } from "./seed";
import { createYellowClient } from "./client";

loadConfig();
seedProviders();

createYellowClient();
