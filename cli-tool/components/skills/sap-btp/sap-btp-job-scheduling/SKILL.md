---
name: sap-btp-job-scheduling
description: |
  SAP BTP Job Scheduling Service skill. Use when scheduling background jobs in BTP
  Cloud Foundry applications — creating job definitions, cron schedules, one-time
  runs, job monitoring, and integrating the Job Scheduler REST API or Node.js client
  library into CAP/Node.js applications.

  Keywords: job scheduling, job scheduler, cron, background jobs, btp scheduler,
  @sap/jobs-client, scheduled tasks, job monitor, job run, job action
license: MIT
metadata:
  author: btp-templates
  version: "1.0.0"
  last_verified: "2026-03-16"
  documentation: https://help.sap.com/docs/job-scheduling
---

# SAP BTP Job Scheduling Service Skill

## Service Setup
```bash
# Create Job Scheduling instance
cf create-service jobscheduler lite my-job-scheduler

# Bind to app
cf bind-service my-cap-srv my-job-scheduler
cf restage my-cap-srv

# mta.yaml resource
resources:
  - name: my-job-scheduler
    type: org.cloudfoundry.managed-service
    parameters:
      service: jobscheduler
      service-plan: lite
```

## Node.js Client Setup
```javascript
npm install @sap/jobs-client
```

```javascript
const { JobSchedulerClient } = require('@sap/jobs-client');
const xsenv = require('@sap/xsenv');

const services = xsenv.getServices({ scheduler: { tag: 'jobscheduler' } });
const schedulerClient = new JobSchedulerClient(services.scheduler);
```

## Create a Job
```javascript
// Create a scheduled job
async function createDailyReportJob() {
  const job = await schedulerClient.createJob({
    name: 'daily-sales-report',
    description: 'Generate daily sales summary and send to management',
    action: '/api/jobs/daily-report',   // endpoint in your app
    active: true,
    startTime: {
      dtype: 'cron',
      value: '0 6 * * *'              // every day at 06:00 UTC
    },
    httpMethod: 'POST',
    body: JSON.stringify({ reportType: 'DAILY_SALES', format: 'PDF' })
  });
  console.log(`Job created: ${job.jobId}`);
  return job;
}

// Create a one-time job (runs once at specific time)
async function scheduleOneTimeJob(runAt) {
  return schedulerClient.createJob({
    name: 'quarter-close-processing',
    action: '/api/jobs/quarter-close',
    active: true,
    startTime: {
      dtype: 'date',
      value: runAt.toISOString()     // ISO 8601 datetime
    },
    httpMethod: 'POST'
  });
}
```

## Job Action Endpoint (Express/CAP)
```javascript
// Express route handling job execution
app.post('/api/jobs/daily-report', async (req, res) => {
  // Verify request from Job Scheduler (XSUAA token check)
  if (!isValidJobSchedulerToken(req.headers.authorization)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { reportType } = req.body;

    // Execute job logic
    const report = await generateSalesReport(reportType);
    await sendReportToManagement(report);

    // Respond with success (must respond within 30s for synchronous)
    res.status(200).json({
      message: 'Report generated and sent successfully',
      reportId: report.id,
      recordsProcessed: report.recordCount
    });
  } catch (error) {
    console.error('Job failed:', error);
    // Return 4xx/5xx to mark job run as failed
    res.status(500).json({ error: error.message });
  }
});
```

## Manage Jobs
```javascript
// List all jobs
const jobs = await schedulerClient.fetchAllJobs();
jobs.value.forEach(j => console.log(`${j.name}: ${j.active ? 'Active' : 'Inactive'}`));

// Fetch specific job
const job = await schedulerClient.fetchJob({ jobId: 'JOB_ID' });

// Update schedule
await schedulerClient.updateJob({
  jobId: job.jobId,
  active: true,
  startTime: { dtype: 'cron', value: '0 7 * * 1-5' }  // weekdays 07:00
});

// Fetch job run history
const runs = await schedulerClient.fetchJobRuns({ jobId: job.jobId, page: 0, pageSize: 10 });
runs.value.forEach(r =>
  console.log(`${r.runId}: ${r.status} at ${r.scheduledTime}`)
);

// Delete job
await schedulerClient.deleteJob({ jobId: job.jobId });
```

## Cron Expression Reference

| Expression | Meaning |
|---|---|
| `0 * * * *` | Every hour |
| `0 6 * * *` | Every day at 06:00 |
| `0 6 * * 1-5` | Weekdays at 06:00 |
| `0 0 1 * *` | First day of month at midnight |
| `*/15 * * * *` | Every 15 minutes |
| `0 8,12,16 * * 1-5` | Mon-Fri at 08:00, 12:00, 16:00 |

## Documentation Links
- Job Scheduling: https://help.sap.com/docs/job-scheduling
- Node.js Client: https://www.npmjs.com/package/@sap/jobs-client
- REST API: https://help.sap.com/docs/job-scheduling/sap-job-scheduling-service/rest-api
