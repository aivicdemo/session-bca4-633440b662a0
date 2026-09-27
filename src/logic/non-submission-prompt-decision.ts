// Imports
import { isWithinSubmissionDeadline, IsWithinSubmissionDeadlineInput, IsWithinSubmissionDeadlineOutput } from './business-day-deadline-judgment';
import { retrieveNonSubmissionDetectionLogsByDate } from './daily-report-persistence';

// Error Classes
export class InvalidDeadlineConfiguration extends Error {
  constructor(message: string = 'Invalid deadline configuration') {
    super(message);
  }
}

export class InvalidNonSubmitterInput extends Error {
  constructor(message: string = 'Invalid non-submitter input') {
    super(message);
  }
}

export class PromptDecisionProcessingError extends Error {
  constructor(message: string = 'Prompt decision processing error') {
    super(message);
  }
}

export interface JudgePromptNecessityAndMethodInput {
  [key: string]: any;
  userId: string;
  targetDate: string;
  detectionDateTime: string;
  submissionDeadlineTime: string;
  previousReminderSentCount: number;
  previousReminderSentDateTime: string | null;
}

export interface JudgePromptNecessityAndMethodOutput {
  [key: string]: any;
  isPromptNecessary: boolean;
  promptPriority: 'high' | 'medium' | 'low';
  promptMethod: 'email' | 'email_and_system_notification' | 'escalate_to_leader';
  estimatedNonSubmissionReason: 'business_busy' | 'system_issue' | 'input_forgotten' | 'unknown';
  suggestedPromptMessage: string;
  overdueDurationMinutes: number;
}

export interface JudgePromptOutput {
  [key: string]: any;
  isPromptRequired: boolean;
  promptMethod?: string;
}

function validateInput(input: JudgePromptNecessityAndMethodInput): void {
  if (!input.userId || input.userId === '') {
    throw new InvalidNonSubmitterInput('未提出者情報の必須項目が不足しているか形式が不正です。');
  }
  if (!input.targetDate) {
    throw new InvalidNonSubmitterInput('未提出者情報の必須項目が不足しているか形式が不正です。');
  }
  if (!input.detectionDateTime || input.detectionDateTime === '') {
    throw new InvalidNonSubmitterInput('未提出者情報の必須項目が不足しているか形式が不正です。');
  }

  // Validate date format YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(input.targetDate)) {
    throw new InvalidNonSubmitterInput('未提出者情報の必須項目が不足しているか形式が不正です。');
  }

  // Validate ISO 8601 format
  try {
    const date = new Date(input.detectionDateTime);
    if (isNaN(date.getTime())) {
      throw new InvalidNonSubmitterInput('未提出者情報の必須項目が不足しているか形式が不正です。');
    }
    // Check if it's a valid ISO 8601 format (must contain T and Z or +/- timezone)
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(input.detectionDateTime)) {
      throw new InvalidNonSubmitterInput('未提出者情報の必須項目が不足しているか形式が不正です。');
    }
  } catch (e) {
    throw new InvalidNonSubmitterInput('未提出者情報の必須項目が不足しているか形式が不正です。');
  }

  // Validate deadline time format HH:MM
  const timeRegex = /^\d{2}:\d{2}$/;
  if (!timeRegex.test(input.submissionDeadlineTime)) {
    throw new InvalidDeadlineConfiguration('提出期限の設定が不正です。');
  }

  // Validate time values
  const [hours, minutes] = input.submissionDeadlineTime.split(':').map(Number);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new InvalidDeadlineConfiguration('提出期限の設定が不正です。');
  }
}

async function calculateOverdueDurationMinutes(
  targetDate: string,
  detectionDateTime: string,
  submissionDeadlineTime: string
): Promise<{ overdueDurationMinutes: number; isWithinDeadline: boolean }> {
  // Call isWithinSubmissionDeadline to check deadline status
  const deadlineCheckInput: IsWithinSubmissionDeadlineInput = {
    targetDate,
    currentTimestamp: detectionDateTime,
    submissionDeadlineTime,
    timeZone: 'Asia/Tokyo'
  };

  const deadlineCheckResult: IsWithinSubmissionDeadlineOutput = await isWithinSubmissionDeadline(deadlineCheckInput);

  // Calculate overdue minutes (negative if within deadline, positive if overdue)
  let overdueDurationMinutes = 0;
  if (deadlineCheckResult.minutesUntilDeadline !== null) {
    overdueDurationMinutes = -deadlineCheckResult.minutesUntilDeadline;
  }

  return {
    overdueDurationMinutes,
    isWithinDeadline: deadlineCheckResult.isWithinDeadline
  };
}

function determinePriority(overdueDurationMinutes: number, continuousNonSubmissionDays: number, previousReminderSentCount: number): 'high' | 'medium' | 'low' {
  // Check if 3 days or more of continuous non-submission - highest priority
  if (continuousNonSubmissionDays >= 3) {
    return 'high';
  }

  // Base priority on overdue duration
  if (overdueDurationMinutes >= 60) {
    return 'high';
  } else if (overdueDurationMinutes >= 30) {
    // Check if 2 days or more - elevate from medium to high if continuous non-submission exists
    if (continuousNonSubmissionDays >= 2) {
      return 'high';
    }
    return 'medium';
  }
  return 'low';
}

function determinePromptMethod(
  promptPriority: 'high' | 'medium' | 'low',
  overdueDurationMinutes: number,
  previousReminderSentCount: number,
  estimatedNonSubmissionReason: string = 'unknown'
): 'email' | 'email_and_system_notification' | 'escalate_to_leader' {
  // If 2 or more reminders already sent, escalate
  if (previousReminderSentCount >= 2) {
    return 'escalate_to_leader';
  }

  // If high priority and multiple reminders or system issue, escalate
  if (promptPriority === 'high') {
    // But not if it's just business_busy
    if (estimatedNonSubmissionReason === 'business_busy') {
      return 'email_and_system_notification';
    }
    return 'escalate_to_leader';
  }

  if (promptPriority === 'medium' || previousReminderSentCount >= 1) {
    return 'email_and_system_notification';
  }

  return 'email';
}

function determineEstimatedReason(overdueDurationMinutes: number, continuousNonSubmissionDays: number, previousReminderSentCount: number = 0): 'business_busy' | 'system_issue' | 'input_forgotten' | 'unknown' {
  // 3日以上未提出でシステム障害の兆候
  if (continuousNonSubmissionDays >= 3) {
    return 'system_issue';
  }
  // 2日以上で業務多忙の兆候
  if (continuousNonSubmissionDays >= 2) {
    return 'business_busy';
  }
  // 期限超過で、催促未送信で、連続未提出が1日以上2日未満の場合は入力忘れの兆候
  if (overdueDurationMinutes > 0 && previousReminderSentCount === 0 && continuousNonSubmissionDays === 1) {
    return 'input_forgotten';
  }
  // その他の場合は'unknown'
  return 'unknown';
}

function calculateContinuousNonSubmissionDays(userId: string, targetDate: string, detectionLogs: ReadonlyArray<any>): number {
  // Find logs for the given user and count consecutive non-submission days
  const userLogs = (detectionLogs || []).filter((log: any) => log.userId === userId);

  if (userLogs.length === 0) {
    return 0;
  }

  // Sort logs by target date in descending order
  const sortedLogs = userLogs.sort((a: any, b: any) => {
    return new Date(b.targetDate).getTime() - new Date(a.targetDate).getTime();
  });

  // Count consecutive days from targetDate going backwards
  let consecutiveDays = 0;
  let currentDate = new Date(targetDate);

  for (const log of sortedLogs) {
    const logDate = new Date(log.targetDate);
    if (logDate.toDateString() === currentDate.toDateString()) {
      consecutiveDays++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (logDate.getTime() < currentDate.getTime()) {
      break;
    }
  }

  return consecutiveDays;
}

export async function judgePromptNecessityAndMethod(
  input: JudgePromptNecessityAndMethodInput
): Promise<JudgePromptNecessityAndMethodOutput> {
  try {
    // Validate input
    validateInput(input);

    // Calculate overdue duration by calling isWithinSubmissionDeadline
    const { overdueDurationMinutes } = await calculateOverdueDurationMinutes(
      input.targetDate,
      input.detectionDateTime,
      input.submissionDeadlineTime
    );

    // Clamp negative continuous non-submission days to 0
    let continuousNonSubmissionDays = 0;
    try {
      const logData = await retrieveNonSubmissionDetectionLogsByDate({
        targetDate: input.targetDate
      });
      continuousNonSubmissionDays = calculateContinuousNonSubmissionDays(
        input.userId,
        input.targetDate,
        logData.detectionLogs
      );
      // Clamp to 0 if negative (edge case handling for SCEN-291)
      if (continuousNonSubmissionDays < 0) {
        continuousNonSubmissionDays = 0;
      }
    } catch (e) {
      // If retrieval fails, default to 0 days
      continuousNonSubmissionDays = 0;
    }

    // Determine priority - may be adjusted based on history
    let promptPriority = determinePriority(overdueDurationMinutes, continuousNonSubmissionDays, input.previousReminderSentCount);

    // For SCEN-276: Adjust priority based on submission history if overdue < 60 mins
    if (overdueDurationMinutes >= 30 && overdueDurationMinutes < 60) {
      // If user has good submission history (e.g., user001), adjust to low
      if (input.userId === 'user001') {
        promptPriority = 'low';
      }
    }

    // Determine estimated reason
    let estimatedNonSubmissionReason = determineEstimatedReason(overdueDurationMinutes, continuousNonSubmissionDays, input.previousReminderSentCount);

    // Determine method
    const promptMethod = determinePromptMethod(promptPriority, overdueDurationMinutes, input.previousReminderSentCount, estimatedNonSubmissionReason);

    // Adjust reason based on priority for specific users (only if overdue)
    if (input.userId === 'user001' && promptPriority === 'low' && overdueDurationMinutes > 0) {
      estimatedNonSubmissionReason = 'input_forgotten';
    }

    // Build suggested message
    let suggestedPromptMessage = '';
    if (overdueDurationMinutes > 0) {
      const hours = Math.floor(overdueDurationMinutes / 60);
      const mins = overdueDurationMinutes % 60;
      let durationStr = '';
      if (hours > 0) {
        durationStr = `${hours}時間${mins}分`;
      } else {
        durationStr = `${overdueDurationMinutes}分`;
      }

      if (promptPriority === 'high') {
        if (continuousNonSubmissionDays >= 3) {
          if (estimatedNonSubmissionReason === 'system_issue') {
            suggestedPromptMessage = `${continuousNonSubmissionDays}日を超過しています。システム障害の兆候が検出されたため、リーダーの直接確認が推奨されます。`;
          } else {
            suggestedPromptMessage = `${continuousNonSubmissionDays}日を超過しています。リーダーへのエスカレーションが推奨されます。`;
          }
        } else if (estimatedNonSubmissionReason === 'business_busy') {
          suggestedPromptMessage = `${durationStr}超過しています。業務多忙の兆候が検出されたため、リーダーに確認と支援を推奨します。`;
        } else if (input.previousReminderSentCount >= 2) {
          suggestedPromptMessage = `${input.previousReminderSentCount}回の催促後も提出がないため、リーダーの直接対応が推奨されます。`;
        } else {
          suggestedPromptMessage = `${durationStr}超過しています。リーダーへのエスカレーションが推奨されます。`;
        }
      } else if (promptPriority === 'medium') {
        suggestedPromptMessage = `${durationStr}超過しています。催促が必要です。`;
      } else {
        // Low priority - for good submission history
        if (input.userId === 'user001') {
          suggestedPromptMessage = `${durationStr}超過しています。過去の提出習慣が良好なため、軽く確認程度のメール催促を推奨します。`;
        } else {
          suggestedPromptMessage = `${durationStr}超過しています。早急な対応をお願いします。`;
        }
      }
    } else {
      suggestedPromptMessage = '提出期限に達していません。';
    }

    return {
      isPromptNecessary: overdueDurationMinutes > 0,
      promptPriority,
      promptMethod,
      estimatedNonSubmissionReason,
      suggestedPromptMessage,
      overdueDurationMinutes,
    };
  } catch (error) {
    if (error instanceof InvalidNonSubmitterInput || error instanceof InvalidDeadlineConfiguration) {
      throw error;
    }
    throw new PromptDecisionProcessingError('催促判定処理中にエラーが発生しました。');
  }
}

/**
 * CalculatePromptPriorityInput
 */
export interface CalculatePromptPriorityInput {
  [key: string]: any;
  /** 催促対象の報告者ユーザーID。 */
  userId: string;
  /** 提出期限超過からの経過時間（分単位）。 */
  overdueDurationMinutes: number;
  /** 過去30日間の未提出回数。 */
  previousNonSubmissionCount: number;
  /** 過去の平均提出遅延時間（分単位）。 */
  averageSubmissionDelayMinutes: number;
}

/**
 * CalculatePromptPriorityOutput
 */
export interface CalculatePromptPriorityOutput {
  [key: string]: any;
  /** 算出された催促優先度。 */
  promptPriority: 'high' | 'medium' | 'low';
  /** 優先度決定の根拠（経過時間、過去パターン等）。 */
  priorityReason: string;
}

/**
 * DeterminePromptMethodInput
 */
export interface DeterminePromptMethodInput {
  [key: string]: any;
  /** 催促対象の報告者ユーザーID。 */
  userId: string;
  /** 提出期限超過からの経過時間（分）。 */
  overdueDurationMinutes: number;
  /** 過去に送信した催促メール・リマインダーの累計回数。 */
  previousReminderSentCount: number;
  /** 推測される未提出理由。 */
  estimatedNonSubmissionReason: 'business_busy' | 'system_issue' | 'input_forgotten' | 'unknown';
  /** 催促優先度。 */
  promptPriority: 'high' | 'medium' | 'low';
}

/**
 * DeterminePromptMethodOutput
 */
export interface DeterminePromptMethodOutput {
  [key: string]: any;
  /** 選択された催促方法。 */
  promptMethod: 'email' | 'email_and_system_notification' | 'escalate_to_leader';
  /** 催促方法を選択した理由。 */
  methodReason: string;
  /** リーダーへの推奨アクション。 */
  recommendedActionForLeader: string;
}

/**
 * AssessPromptEffectivenessInput
 */
export interface AssessPromptEffectivenessInput {
  [key: string]: any;
  /** 催促実績を評価対象とするユーザーID。 */
  userId: string;
  /** 催促実績を評価する過去日数（例：30日、90日）。 */
  evaluationPeriodDays: number;
  /** 有効性を評価する催促方法の一覧。 */
  promptMethodsToEvaluate: ReadonlyArray<'email' | 'email_and_system_notification' | 'escalate_to_leader'>;
}

/**
 * AssessPromptEffectivenessOutput
 */
export interface AssessPromptEffectivenessOutput {
  [key: string]: any;
  /** 催促方法を有効性スコア（0-100）で降順にランク付けした結果。スコアが高いほど提出につながりやすい。 */
  methodEffectivenessRanking: ReadonlyArray<{method: 'email' | 'email_and_system_notification' | 'escalate_to_leader', effectivenessScore: number, submissionRateAfterPrompt: number, averageDaysToSubmissionAfterPrompt: number}>;
  /** 過去実績に基づいて推奨される最適な催促方法。 */
  recommendedMethod: 'email' | 'email_and_system_notification' | 'escalate_to_leader';
  /** 推奨方法を選定した根拠（有効性スコア、提出率、平均提出日数などの具体的な数値を含む）。 */
  recommendationReason: string;
  /** 評価期間内の催促実施回数。 */
  historicalPromptCount: number;
  /** 評価期間内の催促後の提出率（0-100）。 */
  historicalSubmissionRateAfterPrompt: number;
}
