import { CreateApp } from './app.js';
import {
  StartAutomatedCronScheduler,
  StopAutomatedCronScheduler,
} from './features/cron/cron.engine.js';

const port = Number(process.env.PORT ?? 3000);

const app = CreateApp();

const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  StartAutomatedCronScheduler();
});

const Shutdown = () => {
  console.log('Shutting down server and cron scheduler...');
  StopAutomatedCronScheduler();
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGTERM', Shutdown);
process.on('SIGINT', Shutdown);

