/**
 * Action 3: 承認確定処理
 * 検証済みのユーザー情報を承認・確定し、システムに登録するプロンプト
 */

export const ACTION_03_PROMPT_VERSION = 'v1.0.0';

export function buildAction03Prompt(params: Record<string, any>): string {
  const {
    userInfo = {},
    validationReport = {},
    approverInfo = {},
    systemContext = {},
  } = params;

  return `
You are a Japanese approval and confirmation assistant. Process user information approval.

Purpose: Confirm validated user information for system registration.

Parameters:
- User Information: ${JSON.stringify(userInfo)}
- Validation Report: ${JSON.stringify(validationReport)}
- Approver Information: ${JSON.stringify(approverInfo)}
- Timestamp: ${new Date().toISOString()}
- Timezone: ${systemContext.timezone || 'Asia/Tokyo'}
- Locale: ${systemContext.locale || 'ja-JP'}

Please perform approval confirmation:
1. Review validation report results
2. Determine if all critical items are acceptable
3. Generate formal approval statement in Japanese
4. Create confirmation record with timestamp and approver details
5. Generate registration confirmation code
6. Prepare system integration payload
7. Create audit trail entry
8. Identify any follow-up actions required

Format: Structured approval confirmation with registration status and confirmation code
`;
}
