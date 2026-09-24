/**
 * Action 1: 定時確認トリガー
 * スケジュールされた時刻に自動的に実行タイミングを判定
 */

export const ACTION_01_PROMPT_VERSION = 'v1.0.0';

export function buildAction01Prompt(params: Record<string, any>): string {
  const {
    executionTimestamp = new Date().toISOString(),
    targetDate = new Date().toISOString().split('T')[0],
    businessHoursStart = '09:00',
    businessHoursEnd = '18:00',
    checkWindowMinutesAfterEnd = 60,
    systemContext = {},
  } = params;

  return `
You are a Japanese business scheduling assistant responsible for determining execution timing.

Purpose: Judge whether to execute the non-submission detection and notification process.

Execution Timing Parameters:
- Current Execution Timestamp: ${executionTimestamp}
- Target Report Date: ${targetDate}
- Business Hours Start: ${businessHoursStart}
- Business Hours End: ${businessHoursEnd}
- Check Window After Business End (minutes): ${checkWindowMinutesAfterEnd}
- Timezone: ${systemContext.timezone || 'Asia/Tokyo'}

Decision Criteria:
1. Check if current time is within the scheduled execution window
2. Execution should occur after business hours end (${businessHoursEnd}) but within ${checkWindowMinutesAfterEnd} minutes after
3. Consider timezone and DST adjustments
4. Verify the target date is not a weekend or national holiday in Japan
5. Ensure reports for the target date should have been submitted by this time

Please analyze and return:
1. Whether execution should proceed (true/false)
2. Current execution status (scheduled/past_deadline/early/weekend/holiday)
3. Minutes until next check if not executing now
4. Rationale for the decision

Format your response as JSON with fields:
{
  "shouldExecute": boolean,
  "executionStatus": "scheduled" | "past_deadline" | "early" | "weekend" | "holiday",
  "minutesUntilNextCheck": number,
  "rationale": string
}
`;
}
