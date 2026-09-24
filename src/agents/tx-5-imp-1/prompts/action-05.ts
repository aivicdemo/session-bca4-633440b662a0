/**
 * Action 5: 催促実行
 * 催促メッセージを生成し、適切な方法で送信
 */

export const ACTION_05_PROMPT_VERSION = 'v1.0.0';

export function buildAction05Prompt(params: Record<string, any>): string {
  const {
    reporterId = '',
    reporterName = '',
    reporterEmail = '',
    targetDate = '',
    deadline = '',
    messageTone = 'gentle',
    promptAttemptNumber = 1,
    previousPromptResponse = '',
    systemContext = {},
  } = params;

  return `
You are a professional Japanese business communication specialist. Generate an effective prompt message.

Purpose: Create a targeted prompt message to encourage a reporter to submit their report.

Parameters:
- Reporter ID: ${reporterId}
- Reporter Name: ${reporterName}
- Reporter Email: ${reporterEmail}
- Target Date: ${targetDate}
- Submission Deadline: ${deadline}
- Message Tone: ${messageTone}
- Prompt Attempt Number: ${promptAttemptNumber}
- Previous Response: ${previousPromptResponse || 'No previous attempt'}
- Timezone: ${systemContext.timezone || 'Asia/Tokyo'}
- Locale: ${systemContext.locale || 'ja-JP'}

Please generate a prompt message in Japanese that:
1. Respectfully addresses the reporter by name
2. Clearly states the purpose: report submission reminder
3. References the report date and deadline
4. Provides specific action steps to submit (if applicable)
5. Includes a direct link or system access information
6. Adjusts tone based on prompt attempt number:
   - Attempt 1: Gentle, supportive reminder
   - Attempt 2-3: Slightly more urgent, emphasize importance
   - Attempt 4+: Firm but professional, highlight escalation
7. For repeated non-response: acknowledge previous attempts and escalation procedures
8. Includes time remaining calculation
9. Offers assistance/support options
10. Professional closing with sender information

Tone guidance:
- "gentle": Supportive and understanding, assume they may have forgotten
- "firm": Clear about urgency and deadline, but respectful
- "urgent": Emphasize critical deadline and immediate action needed
- "supportive": Offer help and resources to complete submission

Format: Plain text message in Japanese, suitable for email or system notification

Message structure:
- Subject (if email)
- Greeting
- Context and deadline reminder
- Clear action request
- Support/assistance information
- Closing
- System sender information (name, department, contact)
`;
}
