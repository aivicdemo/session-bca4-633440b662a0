/**
 * Action 5: 提出状況レポート生成
 * 提出状況の集計結果をリーダーに報告するレポートを生成
 */

export const ACTION_05_PROMPT_VERSION = 'v1.0.0';

export function buildAction05Prompt(params: Record<string, any>): string {
  const {
    totalEmployees = 0,
    submittedCount = 0,
    nonSubmittedCount = 0,
    nonSubmittedEmployees = [],
    remindersInitial = 0,
    remindersSecond = 0,
    remindersEscalated = 0,
    remindersCritical = 0,
    targetDate = new Date(),
    systemContext = {},
  } = params;

  const tgtDate = targetDate instanceof Date
    ? targetDate.toISOString().split('T')[0]
    : targetDate;

  const submissionRate = totalEmployees > 0
    ? ((submittedCount / totalEmployees) * 100).toFixed(1)
    : '0.0';

  const nonSubmittedList = nonSubmittedEmployees
    .map((emp: any) => `- ${emp.employeeName} (${emp.employeeId}): リマインダー${emp.remindCount}回 (レベル: ${emp.reminderLevel})`)
    .join('\n');

  return `
You are a professional business report generation assistant. Create a comprehensive daily report submission status report for leaders.

Purpose: Generate an executive summary report of daily report submission status for management/team leaders.

Parameters:
- Report Date: ${tgtDate}
- Total Employees: ${totalEmployees}
- Submitted Count: ${submittedCount}
- Non-submitted Count: ${nonSubmittedCount}
- Submission Rate: ${submissionRate}%
- Initial Reminders Sent: ${remindersInitial}
- Second Reminders Sent: ${remindersSecond}
- Escalated Reminders Sent: ${remindersEscalated}
- Critical Reminders Sent: ${remindersCritical}
- Timezone: ${systemContext.timezone || 'Asia/Tokyo'}
- Locale: ${systemContext.locale || 'ja-JP'}

Non-submitted Employees:
${nonSubmittedList || '(All employees have submitted)'}

Please generate a professional executive summary report in Japanese that includes:

1. Report Title and Date
   - Clear date reference: ${tgtDate}
   - Report type identification

2. Executive Summary
   - Key metrics overview
   - Submission rate and trend
   - Outstanding issues summary

3. Submission Statistics
   - Total employees: ${totalEmployees}
   - Submitted: ${submittedCount} (${submissionRate}%)
   - Non-submitted: ${nonSubmittedCount}

4. Reminder Activity Summary
   - Initial reminders sent: ${remindersInitial}
   - Second reminders sent: ${remindersSecond}
   - Escalated reminders sent: ${remindersEscalated}
   - Critical reminders sent: ${remindersCritical}
   - Total reminders: ${remindersInitial + remindersSecond + remindersEscalated + remindersCritical}

5. Non-submitted Employees Details
   - List of non-submitted employees with IDs
   - Reminder history for each employee
   - Current escalation level

6. Recommendations
   - Immediate actions required
   - Follow-up procedures
   - Risk mitigation strategies
   - Timeline for next check-in

7. Appendices
   - Detailed employee status breakdown
   - Historical comparison (if available)
   - Process notes

Format the report professionally with:
- Clear section headers
- Use of bullet points for readability
- Japanese language throughout
- Business-appropriate tone
- Ready for presentation to leadership

The report should be suitable for distribution to team leaders and management.
`;
}
