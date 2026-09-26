import { app } from './app.js';
import { config } from './lib/config.js';

const server = app.listen(config.port, () => {
  console.log(`🚀 StockSense Server running at http://localhost:${config.port}`);
  console.log(`⚙️  Environment: ${config.nodeEnv}`);
  console.log(`🩺 Health check: http://localhost:${config.port}/api/health`);
});

const shutdown = () => {
  console.log('Shutting down server gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
