/**
 * Action 4: 催促メール送信
 * 未提出者に対して自動送信される催促メール
 */

export const ACTION_04_PROMPT_VERSION = 'v1.0.0';

export function buildAction04Prompt(params: Record<string, any>): string {
  const {
    reporterName = '従業員',
    targetDate = '',
    deadline = '18:00',
    submissionUrl = 'https://system.example.com/report',
    escalationInfo = '',
    systemContext = {},
  } = params;

  return `
You are a Japanese business communication specialist. Generate a professional reminder email message.

Purpose: Send a polite but firm reminder to employees who have not submitted their daily reports.

Email Parameters:
- Employee Name: ${reporterName}
- Target Report Date: ${targetDate}
- Submission Deadline: ${deadline}
- Submission System URL: ${submissionUrl}
- Escalation Information: ${escalationInfo || 'None'}
- Timezone: ${systemContext.timezone || 'Asia/Tokyo'}

Please generate a professional reminder email in Japanese that:
1. Addresses the employee respectfully by name
2. Clearly states that the report for ${targetDate} has not been submitted
3. Reminds them of the deadline (${deadline})
4. Provides the submission URL and step-by-step instructions
5. Explains the importance of timely submission
6. If escalation info is provided, mentions the escalation consequences
7. Includes a clear call to action
8. Maintains a professional, non-accusatory tone
9. Is formatted as a complete email with subject line

Format your response as JSON with fields:
{
  "emailType": "reminder",
  "to": string (employee email),
  "subject": string (in Japanese),
  "body": string (in Japanese, HTML formatted),
  "priority": "high" | "normal",
  "retryCount": number (suggested resend count),
  "retryIntervalMinutes": number,
  "generatedAt": string (ISO timestamp)
}
`;
}
