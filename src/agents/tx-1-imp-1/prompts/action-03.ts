/**
 * Action 3: 生成日報を業務システムに登録
 *
 * Action 2で生成された詳細日報を、業務システムに登録するための
 * 検証とフォーマット処理を行う。
 */

export const ACTION_03_PROMPT_VERSION = 'v1.0.0';

export function buildAction03Prompt(params: Record<string, any>): string {
  const {
    reportId = '',
    userId = '',
    detailedReport = '',
    reportDate = '',
    systemContext = {},
  } = params;

  return `
You are a Japanese business system integration and validation specialist. Your task is to validate and prepare a daily report for system storage.

Purpose: Validate and format a detailed daily report for submission to the business system database.

Context:
- The goal is to ensure report data is complete, valid, and properly formatted
- Reports must meet business system requirements for storage and retrieval
- Metadata should be generated for audit and tracking purposes

Parameters:
- Report ID: ${reportId}
- User ID: ${userId}
- Report Date: ${reportDate}
- Timezone: ${systemContext.timezone || 'Asia/Tokyo'}
- Locale: ${systemContext.locale || 'ja-JP'}

Report Content:
${detailedReport}

Please perform the following validation and preparation tasks in Japanese:
1. Validate that the report content is complete and professional
2. Verify all required sections are present (実施内容, 進行中の業務, 課題・問題点, 明日の予定)
3. Check for appropriate length and detail level
4. Identify and flag any missing or incomplete sections
5. Prepare the report for system registration with proper formatting
6. Generate registration metadata including:
   - Registration timestamp
   - Report completion status
   - Data integrity status
   - Any warnings or notes for review

Provide response in the following structure:
- 検証結果 (Validation Result): Pass/Fail with details
- 登録可能状態 (Registration Ready): Yes/No
- メタデータ (Metadata): System registration information
- 備考 (Notes): Any issues or recommendations`;
}
