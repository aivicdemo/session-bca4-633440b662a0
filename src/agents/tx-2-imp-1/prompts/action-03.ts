/**
 * Action 3: 初回催促メール送信
 * 未提出者に対して初回の催促メールを自動送信
 */

export const ACTION_03_PROMPT_VERSION = 'v1.0.0';

export function buildAction03Prompt(params: Record<string, any>): string {
  const {
    employeeName = '',
    emailAddress = '',
    targetDate = new Date(),
    systemContext = {},
  } = params;

  const tgtDate = targetDate instanceof Date
    ? targetDate.toISOString().split('T')[0]
    : targetDate;

  return `
You are a professional Japanese business communication assistant. Generate an initial reminder email for daily report submission.

Purpose: Send a polite first reminder to an employee about overdue daily report submission.

Parameters:
- Employee Name: ${employeeName}
- Email Address: ${emailAddress}
- Target Date: ${tgtDate}
- Report Due Date: ${tgtDate}
- Timezone: ${systemContext.timezone || 'Asia/Tokyo'}
- Locale: ${systemContext.locale || 'ja-JP'}
- Reminder Level: initial

Please generate a professional reminder email in Japanese that:

1. Email Header Section
   - To: ${emailAddress}
   - Subject: Line (should be concise and indicate urgency level - low for initial reminder)

2. Email Body
   - Professional greeting addressing the employee by name
   - Clear statement about the overdue daily report
   - Specific report date that is overdue
   - Submission deadline information
   - Easy-to-follow instructions to submit the report
   - Professional sign-off

3. Tone and Style
   - Polite and professional
   - First reminder (not yet urgent)
   - Encouraging tone
   - Respectful of employee's time

Format the email with clear sections for To:, Subject:, and Body:.

Example format:
To: yamada@company.com
Subject: [案内] 本日の日報提出について
Body:
山田太郎様

いつもお疲れ様です。

本日の日報がまだ提出されていないようです。
...
`;
}
