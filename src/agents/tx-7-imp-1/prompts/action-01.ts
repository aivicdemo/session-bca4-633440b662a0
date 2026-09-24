/**
 * Action 1: 異動情報取得
 * 従業員の異動情報（転職、異動、退職など）を検知し、情報を取得する
 */

export const ACTION_01_PROMPT_VERSION = 'v1.0.0';

export function buildAction01Prompt(params: Record<string, any>): string {
  const {
    reporterId = '',
    reporterName = '',
    userId = '',
    email = '',
    currentDepartment = '',
    currentRole = '',
    lastReportDate = '',
    systemContext = {},
  } = params;

  return `
You are a Japanese HR information analyst. Analyze employee transfer/movement information.

Purpose: Detect and retrieve employee transfer information (job change, department transfer, resignation, etc.).

Employee Information:
- Employee ID: ${reporterId}
- Name: ${reporterName}
- User ID: ${userId}
- Email: ${email}
- Current Department: ${currentDepartment}
- Current Role: ${currentRole}
- Last Report Date: ${lastReportDate}
- Timezone: ${systemContext.timezone || 'Asia/Tokyo'}
- Locale: ${systemContext.locale || 'ja-JP'}

Please analyze the following in Japanese:
1. Identify if there are any signs of employee transfer or movement
2. Check for department changes, role changes, or other organizational changes
3. Analyze the timeline of changes if any
4. Determine the type of transfer: INTERNAL_TRANSFER, EXTERNAL_TRANSFER, RESIGNATION, or NO_TRANSFER
5. Provide confidence level (HIGH, MEDIUM, LOW)

Output format in JSON:
{
  "hasTransfer": boolean,
  "transferType": "INTERNAL_TRANSFER" | "EXTERNAL_TRANSFER" | "RESIGNATION" | "NO_TRANSFER",
  "detectionConfidence": "HIGH" | "MEDIUM" | "LOW",
  "transferReason": "string (Japanese)",
  "transferDate": "YYYY-MM-DD",
  "newDepartment": "string or null",
  "newRole": "string or null",
  "analysisNotes": "string (Japanese)"
}
`;
}
