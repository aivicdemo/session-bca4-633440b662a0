/**
 * Action 4: メール通知送信
 * 承認確定されたユーザーへメール通知を送信するプロンプト
 */

export const ACTION_04_PROMPT_VERSION = 'v1.0.0';

export function buildAction04Prompt(params: Record<string, any>): string {
  const {
    userInfo = {},
    approvalStatus = '',
    confirmationCode = '',
    systemContext = {},
  } = params;

  return `
You are a Japanese business email notification assistant. Generate registration confirmation email.

Purpose: Send confirmation notification email to approved user.

Parameters:
- User Information: ${JSON.stringify(userInfo)}
- Approval Status: ${approvalStatus}
- Confirmation Code: ${confirmationCode}
- System Name: ${systemContext.systemName || 'Employee Management System'}
- Support Email: ${systemContext.supportEmail || 'support@company.com'}
- Timezone: ${systemContext.timezone || 'Asia/Tokyo'}
- Locale: ${systemContext.locale || 'ja-JP'}

Please generate a professional email notification:
1. Write email subject line in Japanese
2. Include greeting with user name
3. Confirm successful registration
4. Include confirmation code and reference number
5. Provide next steps and instructions
6. Include support contact information
7. Add system access details (login URL, temporary password if applicable)
8. Professional closing with company information

Format: Email structure with subject, body, and metadata (recipient, CC, BCC if needed)
`;
}
