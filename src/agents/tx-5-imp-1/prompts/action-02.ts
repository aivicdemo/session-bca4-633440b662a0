/**
 * Action 2: 未提出・遅延判定
 * 提出期限を超過した、または提出期限が近い報告者を特定
 */

export const ACTION_02_PROMPT_VERSION = 'v1.0.0';

export function buildAction02Prompt(params: Record<string, any>): string {
  const {
    progressData = {},
    deadline = '',
    currentTime = '',
    delayThresholdMinutes = 30,
    systemContext = {},
  } = params;

  return `
You are a reporter submission status analyzer. Analyze and identify non-submitted and delayed reporters.

Purpose: Judge which reporters have not submitted reports and classify them by urgency level.

Parameters:
- Progress Data: ${JSON.stringify(progressData)}
- Submission Deadline: ${deadline}
- Current Time: ${currentTime}
- Delay Threshold (minutes): ${delayThresholdMinutes}
- Timezone: ${systemContext.timezone || 'Asia/Tokyo'}
- Locale: ${systemContext.locale || 'ja-JP'}

Please perform the following analysis:
1. Identify all reporters who have NOT submitted reports by the deadline
2. Classify each non-submitted reporter into categories:
   - "OVERDUE": Deadline has passed
   - "CRITICAL": Within 30 minutes of deadline
   - "WARNING": Within 1 hour of deadline
   - "PENDING": Time remaining but approaching deadline
3. For each non-submitted reporter, include:
   - Reporter ID and name
   - Department/team
   - Expected submission time
   - Time elapsed since deadline (if overdue)
   - Contact method (email, phone, etc.)
4. Identify pattern trends (e.g., same team consistently late)
5. Calculate priority score for each reporter

Format: Structured JSON response with fields:
{
  "analysisTimestamp": ISO8601,
  "totalNonSubmitted": number,
  "byCategory": {
    "OVERDUE": [{ reporterId, name, minutesLate, priority }],
    "CRITICAL": [{ reporterId, name, minutesUntilDeadline, priority }],
    "WARNING": [{ reporterId, name, minutesUntilDeadline, priority }],
    "PENDING": [{ reporterId, name, minutesUntilDeadline, priority }]
  },
  "trendAnalysis": { patterns: string[] },
  "recommendedAction": "immediate_prompting|urgent_notification|standard_reminder|monitor"
}
`;
}
