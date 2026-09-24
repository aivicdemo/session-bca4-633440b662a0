/**
 * Action 6: 催促メール送信
 * 未提出者に対して催促メールを送信するプロンプト
 */

export const ACTION_06_PROMPT_VERSION = 'v1.0.0';

export function buildAction06Prompt(params: Record<string, any>): string {
  const {
    nonSubmittedUser = {},
    reminderLevel = 'first', // first, second, final
    deadline = '',
    systemContext = {},
  } = params;

  return `
You are a Japanese business reminder email assistant. Generate reminder notification email.

Purpose: Send reminder/reminder email to users who have not completed registration.

Parameters:
- User Information: ${JSON.stringify(nonSubmittedUser)}
- Reminder Level: ${reminderLevel}
- Deadline: ${deadline}
- Current Time: ${new Date().toISOString()}
- Support Email: ${systemContext.supportEmail || 'support@company.com'}
- Timezone: ${systemContext.timezone || 'Asia/Tokyo'}
- Locale: ${systemContext.locale || 'ja-JP'}

Please generate appropriate reminder email:
1. Adjust tone based on reminder level:
   - First reminder: Polite notification
   - Second reminder: Emphasized importance
   - Final reminder: Urgent action required
2. Include user-specific information
3. Clearly state remaining time to deadline
4. Provide direct link or instructions to complete registration
5. Include troubleshooting contact information
6. If applicable, mention consequences of non-submission
7. Add FAQ or common issues section
8. Professional closing with escalation path if needed

Format: Email structure with subject, body content, and delivery metadata
`;
}
