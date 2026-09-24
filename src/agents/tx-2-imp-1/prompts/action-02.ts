/**
 * Action 2: 未提出者リスト生成
 * 提出期限を過ぎた未提出者を自動検出し、リストを生成
 */

export const ACTION_02_PROMPT_VERSION = 'v1.0.0';

export function buildAction02Prompt(params: Record<string, any>): string {
  const {
    nonSubmittedEmployees = [],
    targetDate = new Date(),
    systemContext = {},
  } = params;

  const tgtDate = targetDate instanceof Date
    ? targetDate.toISOString().split('T')[0]
    : targetDate;

  const employeeList = nonSubmittedEmployees
    .map((emp: any) => `- ${emp.employeeName} (${emp.employeeId}): ${emp.emailAddress}`)
    .join('\n');

  return `
You are a business report generation assistant. Create a comprehensive list of non-submitted employees.

Purpose: Generate a detailed analysis of employees who have not submitted their daily reports past the deadline.

Parameters:
- Target Date: ${tgtDate}
- Timezone: ${systemContext.timezone || 'Asia/Tokyo'}
- Locale: ${systemContext.locale || 'ja-JP'}
- Business Day Deadline Hour: ${systemContext.businessDayDeadlineHour || 18}

Non-submitted Employees:
${employeeList || '(No non-submitted employees)'}

Please generate a comprehensive analysis report that includes:

1. Executive Summary
   - Total non-submitted count
   - Percentage of non-submitted employees
   - Current date and time

2. Non-submitted Employee Details
   - Employee ID and name
   - Email address
   - Days overdue
   - Submission history for past 7 days

3. Categorization by Risk Level
   - High Risk: 3+ days overdue
   - Medium Risk: 1-2 days overdue
   - Low Risk: Same day overdue

4. Recommendations
   - Immediate action items
   - Follow-up procedures
   - Escalation criteria

Please provide the analysis in a structured, professional format in Japanese.
`;
}
