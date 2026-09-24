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
  userId: string;
  targetDate: string;
  detectionDateTime: string;
  submissionDeadlineTime: string;
  previousReminderSentCount: number;
  previousReminderSentDateTime: string | null;
}

export interface JudgePromptNecessityAndMethodOutput {
  isPromptNecessary: boolean;
  promptPriority: 'high' | 'medium' | 'low';
  promptMethod: 'email' | 'email_and_system_notification' | 'escalate_to_leader';
  estimatedNonSubmissionReason: 'business_busy' | 'system_issue' | 'input_forgotten' | 'unknown';
  suggestedPromptMessage: string;
  overdueDurationMinutes: number;
}

export interface JudgePromptOutput {
  isPromptRequired: boolean;
  promptMethod?: string;
}

export async function judgePromptNecessityAndMethod(
  input: JudgePromptNecessityAndMethodInput
): Promise<JudgePromptNecessityAndMethodOutput> {
  // Calculate overdue duration
  const deadline = new Date(`${input.targetDate}T${input.submissionDeadlineTime}:00Z`);
  const detection = new Date(input.detectionDateTime);
  const overdueDurationMinutes = Math.floor((detection.getTime() - deadline.getTime()) / 60000);

  let promptPriority: 'high' | 'medium' | 'low' = 'low';
  if (overdueDurationMinutes >= 60) {
    promptPriority = 'high';
  } else if (overdueDurationMinutes >= 30) {
    promptPriority = 'medium';
  }

  let promptMethod: 'email' | 'email_and_system_notification' | 'escalate_to_leader' = 'email';
  if (promptPriority === 'high' || input.previousReminderSentCount >= 2) {
    promptMethod = 'escalate_to_leader';
  } else if (input.previousReminderSentCount >= 1) {
    promptMethod = 'email_and_system_notification';
  }

  return {
    isPromptNecessary: overdueDurationMinutes > 0,
    promptPriority,
    promptMethod,
    estimatedNonSubmissionReason: 'unknown',
    suggestedPromptMessage: `${overdueDurationMinutes}分超過しています。早急な対応をお願いします。`,
    overdueDurationMinutes,
  };
}

export async function calculatePromptPriority(
  nonSubmittedReporters: any[]
): Promise<any> {
  return { priority: 'normal' };
}

export async function determinePromptMethod(
  reporter: any
): Promise<any> {
  return { method: 'email' };
}

export async function assessPromptEffectiveness(
  input: any
): Promise<any> {
  return { effectiveness: 0 };
}

/**
 * CalculatePromptPriorityInput
 */
export interface CalculatePromptPriorityInput {
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
  /** 算出された催促優先度。 */
  promptPriority: 'high' | 'medium' | 'low';
  /** 優先度決定の根拠（経過時間、過去パターン等）。 */
  priorityReason: string;
}

/**
 * DeterminePromptMethodInput
 */
export interface DeterminePromptMethodInput {
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
