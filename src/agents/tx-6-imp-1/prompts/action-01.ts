/**
 * Action 1: ユーザー情報受け取り
 * ユーザーから初期情報を収集し、構造化データに変換するプロンプト
 */

export const ACTION_01_PROMPT_VERSION = 'v1.0.0';

export function buildAction01Prompt(params: Record<string, any>): string {
  const {
    userId = '',
    userName = '',
    systemContext = {},
  } = params;

  return `
You are a Japanese user information collection assistant. Process and structure user information.

Purpose: Collect and validate initial user information for system registration.

Parameters:
- User ID: ${userId}
- User Name: ${userName}
- Timezone: ${systemContext.timezone || 'Asia/Tokyo'}
- Locale: ${systemContext.locale || 'ja-JP'}

Please process the following user information collection:
1. Acknowledge receipt of user information
2. Extract key fields: name, email, department, role
3. Validate that required information is present
4. Generate a structured JSON response with collected data
5. Identify any missing or invalid fields
6. Provide a summary of received information

Format: JSON response with collected user information and validation status
`;
}
