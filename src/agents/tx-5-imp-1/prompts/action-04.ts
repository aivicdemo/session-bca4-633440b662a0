/**
 * Action 4: 催促判定
 * 催促の必要性、方法、タイミングを判断
 */

export const ACTION_04_PROMPT_VERSION = 'v1.0.0';

export function buildAction04Prompt(params: Record<string, any>): string {
  const {
    nonSubmittedReporters = [],
    previousPromptAttempts = [],
    reporterHistoryData = {},
    currentTime = '',
    deadline = '',
    systemContext = {},
  } = params;

  return `
You are a smart decision-making assistant for escalation and reminder management.

Purpose: Judge whether prompting is necessary and recommend the optimal method and timing.

Parameters:
- Non-Submitted Reporters: ${JSON.stringify(nonSubmittedReporters)}
- Previous Prompt Attempts: ${JSON.stringify(previousPromptAttempts)}
- Reporter History Data: ${JSON.stringify(reporterHistoryData)}
- Current Time: ${currentTime}
- Submission Deadline: ${deadline}
- Timezone: ${systemContext.timezone || 'Asia/Tokyo'}
- Locale: ${systemContext.locale || 'ja-JP'}

Please make the following determinations:
1. For EACH non-submitted reporter, assess:
   - Is prompting necessary? (YES/NO with confidence score 0-100)
   - Have they been prompted before? How many times and when?
   - Are they chronically late or first-time late?
   - What is their historical response pattern to prompts?
   - What is the optimal communication method? (email/chat/phone/escalate_to_leader)
   - What is the optimal timing? (immediate/after_X_minutes/before_deadline)
2. Consider factors:
   - Time remaining until deadline
   - Reporter's past responsiveness
   - Technical issues (if any)
   - Team workload patterns
   - Previous prompt effectiveness
3. For each reporter, provide:
   - Prompt recommendation (YES/NO)
   - Method: email, instant_message, phone_call, leader_escalation
   - Timing: immediate, delayed_X_minutes, before_deadline_alert
   - Message tone: urgent, gentle, firm, supportive
   - Expected compliance probability

Format: Structured JSON response with fields:
{
  "analysisTimestamp": ISO8601,
  "overallPromptingRequired": boolean,
  "urgencyLevel": "critical|high|medium|low",
  "reporters": [
    {
      "reporterId": string,
      "promptRequired": boolean,
      "confidence": number,
      "method": "email|chat|phone|escalate",
      "timing": "immediate|delayed",
      "delayMinutes": number,
      "messageTone": "urgent|gentle|firm|supportive",
      "complianceProbability": number,
      "rationale": string
    }
  ],
  "recommendedApproach": "parallel_prompting|sequential_prompting|leader_involvement|escalation",
  "riskAssessment": {
    "riskOfNonSubmission": "high|medium|low",
    "estimatedCompliance": percentage,
    "potentialIssues": [string]
  }
}
`;
}
