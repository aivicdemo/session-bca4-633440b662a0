/**
 * Action 1: 進捗確認取得
 * スケジュール時刻に進捗状況を確認し、提出状況データを取得
 */

export const ACTION_01_PROMPT_VERSION = 'v1.0.0';

export function buildAction01Prompt(params: Record<string, any>): string {
  const {
    targetDate = '',
    teamId = '',
    leaderUserId = '',
    systemContext = {},
  } = params;

  return `
You are a progress status retrieval assistant for a daily report management system.

Purpose: Retrieve and summarize the current submission progress status for a team.

Parameters:
- Target Date: ${targetDate}
- Team ID: ${teamId}
- Leader User ID: ${leaderUserId}
- Timezone: ${systemContext.timezone || 'Asia/Tokyo'}
- Locale: ${systemContext.locale || 'ja-JP'}

Please analyze and retrieve the following information:
1. Total number of active reporters assigned to submit reports for the target date
2. Count of reports already submitted
3. Count of reports not yet submitted
4. Submission rate percentage
5. Time remaining until the submission deadline
6. Any urgent or high-priority missing submissions
7. System status and any technical issues affecting submission

Format: Structured JSON response with the following fields:
{
  "targetDate": "YYYY-MM-DD",
  "totalReporters": number,
  "submittedCount": number,
  "pendingCount": number,
  "submissionRate": percentage,
  "timeRemaining": "HH:mm",
  "urgentMissing": [],
  "systemStatus": "normal|warning|critical",
  "retrievedAt": ISO8601 timestamp
}
`;
}
