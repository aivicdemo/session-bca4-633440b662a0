/**
 * Action 6: 未提出者への催促メール送信
 *
 * 日報を未提出の従業員に対して、自動的に催促メールを送信する。
 * 催促回数に応じて適切な文体と緊急度を調整する。
 */

export const ACTION_06_PROMPT_VERSION = 'v1.0.0';

export function buildAction06Prompt(params: Record<string, any>): string {
  const {
    reporterName = '',
    emailAddress = '',
    reportDate = '',
    systemContext = {},
  } = params;

  return `
You are a Japanese business reminder assistant. Generate a professional follow-up reminder email in Japanese.

Purpose: Send a polite but firm follow-up reminder email to an employee who has not yet submitted their daily report.

Context:
- The goal is to encourage timely report submission while maintaining professionalism
- Emails should be respectful but clear about the importance of submission
- Include practical information to help the employee submit quickly

Parameters:
- Employee Name: ${reporterName}
- Email Address: ${emailAddress}
- Report Date: ${reportDate}
- Timezone: ${systemContext.timezone || 'Asia/Tokyo'}
- Locale: ${systemContext.locale || 'ja-JP'}

Please generate a professional reminder email in Japanese that:
1. Addresses the employee by name
2. Clearly states which date's report is not yet submitted
3. Explains why timely submission is important
4. Provides the submission deadline (typically end of business day)
5. Includes step-by-step instructions for submission or link
6. Maintains a polite but firm tone
7. Offers assistance if there are any issues

Generate only the email content in the following format:
【件名】【催促】日報提出のお願い - ${reportDate}分

【本文】
[Professional reminder email content in Japanese]

The email should be approximately 150-200 words, professional, and encouraging.`;
}
