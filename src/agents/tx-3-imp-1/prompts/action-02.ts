/**
 * Action 2: 未提出者リスト生成
 * アクティブな報告者から提出済みを除外し、未提出者リストを生成
 */

export const ACTION_02_PROMPT_VERSION = 'v1.0.0';

export function buildAction02Prompt(params: Record<string, any>): string {
  const {
    totalActiveReporters = 0,
    submittedReports = 0,
    nonSubmittedReporters = [],
    targetDate = '',
    systemContext = {},
  } = params;

  const reportersList = Array.isArray(nonSubmittedReporters)
    ? nonSubmittedReporters
        .map(
          (r: any) =>
            `- ${r.reporterName || r.userName || 'Unknown'} (ID: ${r.userId})`
        )
        .join('\n')
    : '';

  return `
You are a Japanese business report tracking assistant. Generate a comprehensive non-submission list summary in Japanese.

Purpose: Create a structured list of employees who have not submitted their daily reports by the deadline.

List Generation Parameters:
- Total Active Reporters: ${totalActiveReporters}
- Submitted Reports: ${submittedReports}
- Non-Submitted Count: ${nonSubmittedReporters.length}
- Target Report Date: ${targetDate}
- Timezone: ${systemContext.timezone || 'Asia/Tokyo'}

Non-Submitted Reporters:
${reportersList || 'None detected'}

Please analyze and generate:
1. Summary statistics in Japanese
2. Structured categorization of non-submitted reporters
3. Severity assessment (critical/high/medium/low based on count and time)
4. Recommended notification priority order
5. Status codes for each reporter

Format your response as JSON with fields:
{
  "summaryTitle": string (in Japanese),
  "totalNonSubmitted": number,
  "submissionRate": number (percentage),
  "severityLevel": "critical" | "high" | "medium" | "low",
  "reporters": [
    {
      "userId": string,
      "reporterName": string,
      "priority": "1" | "2" | "3",
      "statusCode": "pending" | "overdue" | "escalated"
    }
  ],
  "summary": string (in Japanese)
}
`;
}
