import cron from "node-cron";
import { updateRatesFromAPI } from "../service/forex.service";


// run every 10 minutes
cron.schedule("*/10 * * * *", async () => {
  console.log("⏳ Updating forex rates...");
  await updateRatesFromAPI();
});