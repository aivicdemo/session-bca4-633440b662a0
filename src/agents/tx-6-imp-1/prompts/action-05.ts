/**
 * Action 5: 未提出者自動抽出
 * 期限内に登録を完了していないユーザーを自動検出するプロンプト
 */

export const ACTION_05_PROMPT_VERSION = 'v1.0.0';

export function buildAction05Prompt(params: Record<string, any>): string {
  const {
    allUsers = [],
    submittedUsers = [],
    deadline = '',
    systemContext = {},
  } = params;

  return `
You are a Japanese data analysis assistant. Identify users with incomplete registration.

Purpose: Automatically extract and categorize users who have not completed registration by deadline.

Parameters:
- Total Users Count: ${(allUsers as any[]).length}
- Submitted Users Count: ${(submittedUsers as any[]).length}
- Deadline: ${deadline}
- Current Time: ${new Date().toISOString()}
- Timezone: ${systemContext.timezone || 'Asia/Tokyo'}
- Locale: ${systemContext.locale || 'ja-JP'}

Please analyze and extract:
1. Identify all users who did not submit by deadline
2. Categorize by department/team
3. Check if they received initial notification
4. Analyze submission patterns and timing
5. Identify users requiring immediate follow-up
6. Generate summary statistics:
   - Total non-submitters
   - By department breakdown
   - By days overdue
7. Flag any high-priority cases (executives, critical roles)
8. Create extraction report with recommendations

Format: Structured non-submitter list with categorization and analysis
`;
}
