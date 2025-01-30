
import { Router } from "express";
import db from "../config";


const router = Router();



// Route to update daily metrics
router.post('/updateDailyMetrics', async (req, res) => {
    const { id, date, visitors, bid_requests, cost } = req.body;
  
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
  
      // Update or insert daily metrics in the database
      const updateMetricsQuery = `
        INSERT INTO daily_metrics (campaign_id, date, visitors, bid_requests, cost)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        visitors = VALUES(visitors),
        bid_requests = VALUES(bid_requests),
        cost = VALUES(cost)
      `;
      await connection.execute(updateMetricsQuery, [id, date, visitors, bid_requests, cost]);
  
      await connection.commit();
      res.status(200).json({ message: 'Daily metrics updated successfully' });
    } catch (error) {
      await connection.rollback();
      console.error('Error updating daily metrics:', error);
      res.status(500).json({ message: 'Failed to update daily metrics', error });
    } finally {
      connection.release();
    }
  });



  // Route to insert daily metrics
router.post("/insertDailyMetrics", async (req, res) => {
    const { id, date, visitors, bid_requests, cost } = req.body;
  
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
  
      // Calculate CPC (Cost Per Click)
      const cpc = visitors > 0 ? cost / visitors : 0;
  
      // Insert new daily metrics
      const insertMetricsQuery = `
        INSERT INTO daily_metrics (campaign_id, date, visitors, bid_requests, cost, cpc)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      await connection.execute(insertMetricsQuery, [id, date, visitors, bid_requests, cost, cpc]);
  
      await connection.commit();
      res.status(201).json({ message: "Daily metrics inserted successfully", cpc });
    } catch (error) {
      await connection.rollback();
      console.error("Error inserting daily metrics:", error);
      res.status(500).json({ message: "Failed to insert daily metrics", error });
    } finally {
      connection.release();
    }
  });
  

  export default router;