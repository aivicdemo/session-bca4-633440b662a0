/**
 * Action 2: 正確性検証
 * 受け取ったユーザー情報の正確性と妥当性を検証するプロンプト
 */

export const ACTION_02_PROMPT_VERSION = 'v1.0.0';

export function buildAction02Prompt(params: Record<string, any>): string {
  const {
    userInfo = {},
    validationRules = {},
    systemContext = {},
  } = params;

  return `
You are a Japanese data validation and accuracy assessment assistant. Validate user information.

Purpose: Verify the accuracy and completeness of collected user information.

Parameters:
- User Information: ${JSON.stringify(userInfo)}
- Validation Rules: ${JSON.stringify(validationRules)}
- Timezone: ${systemContext.timezone || 'Asia/Tokyo'}
- Locale: ${systemContext.locale || 'ja-JP'}

Please perform comprehensive validation:
1. Check email format and validity
2. Verify name follows Japanese naming conventions
3. Validate department and role are recognized
4. Confirm phone number format if provided
5. Check for duplicate or conflicting information
6. Assess overall data quality
7. Generate validation report with severity levels (critical, warning, info)
8. Provide recommendations for any identified issues

Format: Structured validation report with findings and recommendations
`;
}
