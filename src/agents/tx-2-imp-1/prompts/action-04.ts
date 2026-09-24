/**
 * Action 4: 複数回催促ロジック
 * 複数回催促後も未提出の場合は段階的に通知レベルを上げる
 */

export const ACTION_04_PROMPT_VERSION = 'v1.0.0';

export function buildAction04Prompt(params: Record<string, any>): string {
  const {
    employeeName = '',
    emailAddress = '',
    targetDate = new Date(),
    reminderCount = 0,
    reminderLevel = 'second',
    systemContext = {},
  } = params;

  const tgtDate = targetDate instanceof Date
    ? targetDate.toISOString().split('T')[0]
    : targetDate;

  // 催促レベルに応じた説明を作成
  let levelDescription = '';
  let urgencyIndicator = '';

  if (reminderLevel === 'second') {
    levelDescription = '2回目の催促メール';
    urgencyIndicator = '【重要】';
  } else if (reminderLevel === 'escalated') {
    levelDescription = 'エスカレーション通知';
    urgencyIndicator = '【至急】';
  } else if (reminderLevel === 'critical') {
    levelDescription = 'クリティカル通知（管理職への報告予定）';
    urgencyIndicator = '【緊急】';
  }

  return `
You are a professional Japanese business communication assistant. Generate an escalated reminder notification for persistent non-submission of daily reports.

Purpose: Send an escalated reminder to an employee who has not submitted their daily report despite previous reminders.

Parameters:
- Employee Name: ${employeeName}
- Email Address: ${emailAddress}
- Target Date: ${tgtDate}
- Reminder Count: ${reminderCount}
- Reminder Level: ${reminderLevel}
- Level Description: ${levelDescription}
- Timezone: ${systemContext.timezone || 'Asia/Tokyo'}
- Locale: ${systemContext.locale || 'ja-JP'}

Please generate an escalated reminder notification in Japanese that:

1. Email Header Section
   - To: ${emailAddress}
   - Subject: Line with urgency indicator: ${urgencyIndicator}

2. Email Body
   - Professional but firm greeting
   - Clear statement about repeated non-submission
   - Specific days/dates overdue (${reminderCount} reminders already sent)
   - Explanation of consequences for continued non-submission
   - Clear deadline for submission
   - Steps to submit the report

3. Tone and Style (varies by reminder level)
   ${reminderLevel === 'second' ? '- More firm than initial reminder' : ''}
   ${reminderLevel === 'escalated' ? '- Urgent tone, mentioning escalation to management' : ''}
   ${reminderLevel === 'critical' ? '- Very urgent, mentioning formal consequences and management notification' : ''}
   - Professional and respectful
   - Clear accountability messaging

4. Additional Elements for Escalation
   ${reminderLevel !== 'second' ? '- Reference to previous reminders sent' : ''}
   ${reminderLevel === 'escalated' || reminderLevel === 'critical' ? '- Mention of management involvement' : ''}
   ${reminderLevel === 'critical' ? '- Clear statement of formal consequences' : ''}

Format the notification with clear sections for To:, Subject:, and Body:.

Example format:
To: yamada@company.com
Subject: ${urgencyIndicator} ${reminderCount}回目のご連絡：日報提出のお願い
Body:
山田太郎様

いつもお疲れ様です。

本日の日報がまだご提出いただいていないようです。
既に${reminderCount}度のご連絡させていただいておりますが...
`;
}
