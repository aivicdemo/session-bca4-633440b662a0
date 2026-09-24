/**
 * Action 3: リーダー通知送信
 * チームリーダー・マネージャーに未提出者情報を通知
 */

export const ACTION_03_PROMPT_VERSION = 'v1.0.0';

export function buildAction03Prompt(params: Record<string, any>): string {
  const {
    nonSubmittedCount = 0,
    leaderName = '管理者',
    departmentName = '部門',
    nonSubmittedReporters = [],
    targetDate = '',
    deadline = '18:00',
    systemContext = {},
  } = params;

  const reportersList = Array.isArray(nonSubmittedReporters)
    ? nonSubmittedReporters
        .map(
          (r: any) =>
            `  - ${r.reporterName || r.userName || 'Unknown'} (${r.emailAddress || 'unknown@example.com'})`
        )
        .join('\n')
    : '';

  return `
You are a Japanese business communication specialist. Generate a professional leader notification message.

Purpose: Notify team leaders and managers about employees who have not submitted their daily reports.

Notification Parameters:
- Non-Submitted Employee Count: ${nonSubmittedCount}
- Leader Name: ${leaderName}
- Department Name: ${departmentName}
- Target Report Date: ${targetDate}
- Submission Deadline: ${deadline}
- Timezone: ${systemContext.timezone || 'Asia/Tokyo'}

Non-Submitted Employees:
${reportersList || 'None'}

Please generate a professional leader notification message in Japanese that:
1. Clearly states the number of employees who have not submitted
2. Lists the non-submitted employees with their contact information
3. Includes the deadline and urgency level
4. Provides action items for the leader
5. Maintains a professional, respectful tone appropriate for management communication
6. Includes timestamp and report date for record-keeping

Format your response as JSON with fields:
{
  "notificationType": "leader_alert",
  "subject": string (in Japanese, suitable for email subject),
  "body": string (in Japanese, formatted for professional notification),
  "priorityLevel": "urgent" | "high" | "normal",
  "actionItems": [string] (in Japanese),
  "generatedAt": string (ISO timestamp)
}
`;
}
