/**
 * Action 5: 進捗追跡
 * 未提出者の通知状況や提出状況を追跡・記録
 */

export const ACTION_05_PROMPT_VERSION = 'v1.0.0';

export function buildAction05Prompt(params: Record<string, any>): string {
  const {
    trackingRecords = [],
    reportDate = '',
    totalReporters = 0,
    notificationsSentCount = 0,
    systemContext = {},
  } = params;

  const recordsJson = Array.isArray(trackingRecords)
    ? trackingRecords
        .map(
          (r: any) =>
            `  {
    "reporterId": "${r.reporterId}",
    "status": "${r.status}",
    "notificationCount": ${r.notificationCount},
    "lastNotifiedAt": "${r.lastNotifiedAt || 'N/A'}",
    "escalationRequired": ${r.escalationRequired}
  }`
        )
        .join(',\n')
    : '';

  return `
You are a Japanese business process tracking specialist. Generate a comprehensive progress tracking summary.

Purpose: Track and record the status of non-submission notifications and follow-up actions.

Tracking Parameters:
- Report Date: ${reportDate}
- Total Active Reporters: ${totalReporters}
- Notifications Sent: ${notificationsSentCount}
- Timezone: ${systemContext.timezone || 'Asia/Tokyo'}

Tracking Records:
[
${recordsJson || '  /* No records */'}
]

Please analyze and generate a progress tracking report that includes:
1. Current tracking status for all non-submitted reporters
2. Notification delivery status and timestamps
3. escalation requirement assessment for each reporter
4. Recommendation for next actions (follow-up timing, escalation level)
5. Statistical summary (submission rate, response rate, escalation rate)

Format your response as JSON with fields:
{
  "trackingPeriodStart": string (ISO timestamp),
  "trackingPeriodEnd": string (ISO timestamp),
  "reportDate": string,
  "totalTrackingRecords": number,
  "stats": {
    "pending": number,
    "notified": number,
    "escalated": number,
    "submitted": number
  },
  "recommendations": [string] (in Japanese),
  "nextCheckTime": string (ISO timestamp),
  "summary": string (in Japanese)
}
`;
}
