/**
 * Action 6: 追加通知判定
 * 初回通知後も未提出の場合、エスカレーション判定と追加通知の必要性を判断
 */

export const ACTION_06_PROMPT_VERSION = 'v1.0.0';

export function buildAction06Prompt(params: Record<string, any>): string {
  const {
    nonSubmittedReporters = [],
    reportDate = '',
    initialNotificationTime = '',
    currentTime = new Date().toISOString(),
    escalationConfig = {
      hoursBeforeFirstEscalation: 2,
      hoursBeforeSecondEscalation: 4,
      hoursBeforeDirectorAlert: 8,
    },
    systemContext = {},
  } = params;

  const reportersList = Array.isArray(nonSubmittedReporters)
    ? nonSubmittedReporters
        .map(
          (r: any) =>
            `  {
    "reporterId": "${r.reporterId}",
    "reporterName": "${r.reporterName || 'Unknown'}",
    "notificationCount": ${r.notificationCount || 0},
    "lastNotifiedAt": "${r.lastNotifiedAt || 'N/A'}",
    "escalationRequired": ${r.escalationRequired || false}
  }`
        )
        .join(',\n')
    : '';

  return `
You are a Japanese business escalation decision specialist. Generate an escalation judgment for unsubmitted reports.

Purpose: Determine whether additional notifications or escalations are required based on time elapsed and notification history.

Escalation Decision Parameters:
- Report Date: ${reportDate}
- Initial Notification Time: ${initialNotificationTime}
- Current Time: ${currentTime}
- Hours Before 1st Escalation: ${escalationConfig.hoursBeforeFirstEscalation}
- Hours Before 2nd Escalation: ${escalationConfig.hoursBeforeSecondEscalation}
- Hours Before Director Alert: ${escalationConfig.hoursBeforeDirectorAlert}
- Timezone: ${systemContext.timezone || 'Asia/Tokyo'}

Non-Submitted Reporters:
[
${reportersList || '  /* No reporters */'}
]

Please analyze and generate escalation judgments that include:
1. For each reporter, determine escalation level based on:
   - Time elapsed since initial notification
   - Number of notifications already sent
   - Reporter's historical submission patterns (if available)
2. Recommend notification type for each reporter:
   - 'reminder': Follow-up reminder email
   - 'escalation': Team lead notification
   - 'director_alert': Department head notification
   - 'none': No additional action needed at this time
3. Calculate optimal timing for next notification
4. Identify reporters requiring immediate escalation
5. Provide rationale for each decision

Format your response as JSON with fields:
{
  "evaluationTimestamp": string (ISO timestamp),
  "evaluationPeriod": {
    "start": string (ISO timestamp),
    "end": string (ISO timestamp),
    "elapsedMinutes": number
  },
  "judgments": [
    {
      "reporterId": string,
      "reporterName": string,
      "shouldNotify": boolean,
      "notificationType": "reminder" | "escalation" | "director_alert" | "none",
      "reason": string (in Japanese),
      "urgencyLevel": "critical" | "high" | "medium" | "low",
      "recommendedNextCheckMinutes": number
    }
  ],
  "summary": string (in Japanese),
  "criticalReportersCount": number
}
`;
}
