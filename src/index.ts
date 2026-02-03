import "dotenv/config";

import { loadConfig } from "./config";
import { seedProviders } from "./seed";

loadConfig();
seedProviders();
