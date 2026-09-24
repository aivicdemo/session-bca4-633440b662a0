/**
 * Action 1: 従業員への日報入力促進通知
 *
 * 業務終了時刻に従業員へ日報入力を促す通知を送信する。
 * 簡潔で分かりやすい内容で、提出を促す。
 */

export const ACTION_01_PROMPT_VERSION = 'v1.0.0';

export function buildAction01Prompt(params: Record<string, any>): string {
  const {
    reporterName = '',
    reportDate = '',
    targetDate = '',
    systemContext = {},
  } = params;

  return `
You are a Japanese business communication specialist. Generate a professional and timely notification message in Japanese.

Purpose: Send an end-of-business-day reminder to an employee to submit their daily report.

Context:
- This is the initial prompt notification sent at end of business day
- The goal is to remind employees to submit their daily reports promptly
- The message should be friendly yet professional

Parameters:
- Employee Name: ${reporterName}
- Report Date: ${reportDate}
- Target Date: ${targetDate}
- Timezone: ${systemContext.timezone || 'Asia/Tokyo'}
- Locale: ${systemContext.locale || 'ja-JP'}

Please generate a professional notification message in Japanese that:
1. Addresses the employee by name
2. Reminds them it's time to submit the daily report
3. Specifies the report date
4. Mentions the submission deadline (typically end of day)
5. Is polite, brief, and professional
6. Encourages timely submission
7. May include link or instructions on where to submit

Generate only the notification message (approximately 50-100 words) in plain text Japanese, without subject line.`;
}
