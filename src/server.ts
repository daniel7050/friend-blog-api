import app from "./app";
import { ENV } from "./generated/config/env";
import { createServer } from "http";
import { initSocket } from "./generated/config/socket";

const server = createServer(app);

// Initialize Socket.IO
initSocket(server);

server.listen(ENV.PORT, () => {
  console.log(`🚀 Server running on port ${ENV.PORT}`);
});
