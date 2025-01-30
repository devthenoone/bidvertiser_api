import { Router } from "express";
import db from "../config";
import express, { Request, Response } from 'express';
import * as mysql from 'mysql2/promise';


const router = Router();




// Route to fetch campaigns and related data
router.get("/", async (req:Request, res:Response) => {
    try {
      const [campaigns] = await db.query("SELECT * FROM campaigns");
      res.status(200).json({ campaigns });
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns", error });
    }
  });
  
  
  // Helper function to validate date format
  const isValidDate = (date: string): boolean => {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime()); // Use getTime() to get the timestamp
  };
  
  // API to get all data within a date range
  router.get('/allDataTime', async (req, res) => {
    const { startDate, endDate } = req.query;
  
    // Ensure startDate and endDate are valid strings or fallback to empty string if invalid
    const startDateStr = Array.isArray(startDate) ? startDate[0] : (startDate as string) || '';
    const endDateStr = Array.isArray(endDate) ? endDate[0] : (endDate as string) || '';
  
    // // Validate the date format using native JavaScript Date object
    // if (!startDateStr || !endDateStr || !isValidDate(startDateStr) || !isValidDate(endDateStr)) {
    //   return res.status(400).json({ message: "Please provide both startDate and endDate in the format YYYY-MM-DD" });
    // }
  
    try {
      // Query for campaigns
      const [campaigns] = await db.execute(`
        SELECT c.id, c.campaign_name, c.ad_format, c.geo, c.traffic_source_type,
               b.bid, b.daily_cap, b.cost,
               p.impressions, p.clicks, p.conversions, p.win_rate, p.video_impressions
        FROM campaigns c
        JOIN bidding b ON c.id = b.campaign_id
        JOIN performancemetrics p ON c.id = p.campaign_id
      `);
  
      // Query for daily metrics within the date range
      const [dailyMetrics] = await db.execute(
        `
        SELECT id, campaign_id, date, visitors, bid_requests, cost, cpc
        FROM daily_metrics
        WHERE date BETWEEN ? AND ?
      `,
        [startDateStr, endDateStr] // Use the validated startDate and endDate
      );
  
      // Return the response with campaigns and dailyMetrics
      res.json({ campaigns, dailyMetrics });
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ message: 'Failed to fetch data', error });
    }
  });



  
router.get('/allDataCombined', async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  // Ensure startDate and endDate are valid strings or fallback to empty string if invalid
  const startDateStr = Array.isArray(startDate) ? startDate[0] : (startDate as string) || '';
  const endDateStr = Array.isArray(endDate) ? endDate[0] : (endDate as string) || '';

  try {
    // Query parameters for optional date filtering
    const queryParams: string[] = [];
    let dateFilter = '';

    if (startDateStr && endDateStr) {
      dateFilter = `WHERE dm.date BETWEEN ? AND ?`;
      queryParams.push(startDateStr.toString(), endDateStr.toString());
    }

    // Query for campaigns, bidding, performance metrics, and daily metrics
    const campaignsQuery = `
      SELECT c.id AS campaign_id, c.campaign_name, c.ad_format, c.geo, c.traffic_source_type,
             b.bid, b.daily_cap, b.cost,
             p.impressions, p.clicks, p.conversions, p.win_rate, p.video_impressions,
             dm.date, dm.visitors, dm.bid_requests, dm.cost AS daily_cost, dm.cpc
      FROM campaigns c
      LEFT JOIN bidding b ON c.id = b.campaign_id
      LEFT JOIN performancemetrics p ON c.id = p.campaign_id
      LEFT JOIN daily_metrics dm ON c.id = dm.campaign_id
      ${dateFilter}
    `;

    const [campaignsData]: any[] = await db.execute(campaignsQuery, queryParams);

    // Query for creatives (no date filtering required here)
    const [creativesData]: any[] = await db.execute(`
      SELECT c.id AS creative_id, c.campaign_id, c.ad_name, c.title, c.description_1, c.description_2, c.display_url, c.destination_url
      FROM creativedetails c
    `);

    // Query for daily metrics separately if needed
    let dailyMetrics: any[] = [];
    if (startDateStr && endDateStr) {
      const [dailyMetricsData]: any[] = await db.execute(
        `
        SELECT id, campaign_id, date, visitors, bid_requests, cost, cpc
        FROM daily_metrics
        WHERE date BETWEEN ? AND ?
      `,
        [startDateStr, endDateStr]
      );
      dailyMetrics = dailyMetricsData;
    }

    // Return the combined response
    res.json({ campaigns: campaignsData, creatives: creativesData, dailyMetrics });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ message: 'Failed to fetch data', error });
  }
});

  export default router;
