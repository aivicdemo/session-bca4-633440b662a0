/**
 * Action 1: 全従業員の提出状況確認
 * 全従業員の日報提出状況を一括確認し、提出済み/未提出を判定
 */

export const ACTION_01_PROMPT_VERSION = 'v1.0.0';

export function buildAction01Prompt(params: Record<string, any>): string {
  const {
    executionTimestamp = new Date(),
    targetDate = new Date(),
    systemContext = {},
  } = params;

  const execTime = executionTimestamp instanceof Date
    ? executionTimestamp.toISOString()
    : executionTimestamp;
  const tgtDate = targetDate instanceof Date
    ? targetDate.toISOString().split('T')[0]
    : targetDate;

  return `
You are a business data analyst assistant. Analyze employee daily report submission status.

Purpose: Check and verify the submission status of all employees for the daily report.

Parameters:
- Execution Timestamp: ${execTime}
- Target Date: ${tgtDate}
- Timezone: ${systemContext.timezone || 'Asia/Tokyo'}
- Locale: ${systemContext.locale || 'ja-JP'}
- Business Day Deadline Hour: ${systemContext.businessDayDeadlineHour || 18}

Please retrieve and analyze the daily report submission status for all active employees and return a JSON array containing:

1. employeeId: Unique employee identifier
2. employeeName: Employee name
3. emailAddress: Employee email address
4. isSubmitted: Boolean indicating submission status (true/false)
5. submissionCount: Number of days submitted this month
6. lastRemindedAt: ISO 8601 timestamp of last reminder sent (null if not reminded yet)
7. remindCount: Number of reminders already sent (0 for new entries)
8. reminderLevel: Current reminder level (initial/second/escalated/critical)

Return format: Valid JSON array of employee submission status objects.
Example:
[
  {
    "employeeId": "EMP001",
    "employeeName": "山田太郎",
    "emailAddress": "yamada@company.com",
    "isSubmitted": true,
    "submissionCount": 15,
    "lastRemindedAt": null,
    "remindCount": 0,
    "reminderLevel": "initial"
  },
  {
    "employeeId": "EMP002",
    "employeeName": "鈴木花子",
    "emailAddress": "suzuki@company.com",
    "isSubmitted": false,
    "submissionCount": 10,
    "lastRemindedAt": "2026-09-23T14:30:00Z",
    "remindCount": 1,
    "reminderLevel": "second"
  }
]

Ensure the response is valid, parseable JSON only without any additional text.
`;
}
