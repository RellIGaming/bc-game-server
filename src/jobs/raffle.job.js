
import { cron } from 'node-cron';
import { drawWinners } from '../service/raffleDraw.service';

// every minute check
cron.schedule("* * * * *", async () => {
  console.log("Checking raffle draw...");
  await drawWinners();
});