/**
 * Action 5: 翌営業日朝の未提出者自動抽出
 *
 * 前日に未提出だった従業員をリストアップし、翌営業日の朝に
 * 自動的に抽出して催促メールの対象者を特定する。
 */

export const ACTION_05_PROMPT_VERSION = 'v1.0.0';

export function buildAction05Prompt(params: Record<string, any>): string {
  const {
    nonSubmittedReporters = [],
    reportDate = '',
    systemContext = {},
  } = params;

  // 未提出者情報を整形
  const reportersInfo = Array.isArray(nonSubmittedReporters)
    ? nonSubmittedReporters
        .map(
          r =>
            `- ${r.reporterName || 'Unknown'} (ID: ${r.reporterId || 'N/A'}, Email: ${r.emailAddress || 'N/A'})`
        )
        .join('\n')
    : 'No data available';

  return `
You are a Japanese business report tracking and analysis assistant. Your task is to analyze non-submitting employees.

Purpose: Extract and analyze employees who have not submitted daily reports for follow-up action.

Context:
- The goal is to identify patterns in non-submissions and prioritize follow-up actions
- Analysis should help streamline reminder processes
- Generate actionable recommendations for team leaders

Parameters:
- Report Date: ${reportDate}
- Non-Submitted Reporters Count: ${Array.isArray(nonSubmittedReporters) ? nonSubmittedReporters.length : 0}
- Timezone: ${systemContext.timezone || 'Asia/Tokyo'}
- Locale: ${systemContext.locale || 'ja-JP'}

Non-Submitted Reporters List:
${reportersInfo}

Please perform the following analysis in Japanese:
1. List all non-submitting employees with their details
2. Identify if there are any recurring non-submitters in the data
3. Suggest priority order for sending follow-up reminders
4. Identify any potential issues or patterns (e.g., same department, specific time patterns)
5. Recommend escalation actions if needed

Format: Structured analysis report in Japanese with clear sections for:
- 未提出者一覧 (Non-Submitted Employee List)
- パターン分析 (Pattern Analysis)
- 催促優先度 (Reminder Priority)
- 推奨アクション (Recommended Actions)
`;
}
