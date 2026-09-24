/**
 * Action 4: リーダーへメール通知送信
 *
 * 従業員が日報を提出した際に、リーダーへ自動的にメール通知を送信する。
 * リーダーが日報の提出状況を把握できるようにする。
 */

export const ACTION_04_PROMPT_VERSION = 'v1.0.0';

export function buildAction04Prompt(params: Record<string, any>): string {
  const {
    reporterId = '',
    reporterName = '',
    reportDate = '',
    systemContext = {},
  } = params;

  return `
You are a Japanese business notification assistant. Generate a professional leader notification email in Japanese.

Purpose: Notify the team leader that an employee has submitted their daily report.

Context:
- The goal is to keep team leaders informed about report submission status
- Emails should be professional and concise
- Include key information for tracking purposes

Parameters:
- Reporter ID: ${reporterId}
- Reporter Name: ${reporterName}
- Report Date: ${reportDate}
- Timezone: ${systemContext.timezone || 'Asia/Tokyo'}
- Locale: ${systemContext.locale || 'ja-JP'}

Please generate a professional notification email in Japanese that:
1. Informs the leader that the employee has submitted their daily report
2. Includes the employee name and report date
3. Is concise and professional
4. Uses business email format (Subject line + Body)
5. Includes timestamp and system reference ID
6. Provides link or reference for accessing the report

Generate only the email content (subject and body). Use the following format:
【件名】[日報提出通知] {reporterName}さんから{reportDate}の日報が提出されました
【本文】
[Professional notification content]

Format: Email template in Japanese with subject and body`;
}
