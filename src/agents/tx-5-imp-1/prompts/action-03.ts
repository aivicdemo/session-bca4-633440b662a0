/**
 * Action 3: リーダー通知
 * チームリーダーに未提出・遅延状況を通知
 */

export const ACTION_03_PROMPT_VERSION = 'v1.0.0';

export function buildAction03Prompt(params: Record<string, any>): string {
  const {
    leaderName = '',
    leaderEmail = '',
    teamName = '',
    submissionStatus = {},
    targetDate = '',
    systemContext = {},
  } = params;

  return `
You are a professional Japanese business communication specialist. Generate a leader notification message.

Purpose: Notify a team leader about current report submission status and non-submitted reporters.

Parameters:
- Leader Name: ${leaderName}
- Leader Email: ${leaderEmail}
- Team Name: ${teamName}
- Submission Status: ${JSON.stringify(submissionStatus)}
- Target Date: ${targetDate}
- Timezone: ${systemContext.timezone || 'Asia/Tokyo'}
- Locale: ${systemContext.locale || 'ja-JP'}

Please generate a professional notification email in Japanese that:
1. Addresses the leader respectfully by title and name
2. Provides clear summary of submission status (submitted count vs. pending count)
3. Lists non-submitted reporters by priority category (OVERDUE, CRITICAL, WARNING)
4. For each non-submitted reporter, include name and time status
5. Recommends specific actions the leader should take
6. Includes the deadline and current time
7. Maintains professional and courteous tone throughout
8. Suggests escalation procedures if needed
9. Provides a clear call-to-action

Format: Professional email template in Japanese that can be sent via email system

Email structure:
- Subject line
- Greeting
- Executive summary (submission rate, pending count)
- Detailed list of non-submitted reporters
- Recommended actions
- Escalation guidance
- Closing remarks
`;
}
