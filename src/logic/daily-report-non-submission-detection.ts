// Error Classes
export class DeadlineNotReachedError extends Error {
  constructor(message: string = 'Deadline not reached') {
    super(message);
  }
}

export class DetectionLogRecordingFailureError extends Error {
  constructor(message: string = 'Detection log recording failure') {
    super(message);
  }
}

export class EmptyReporterListError extends Error {
  constructor(message: string = 'Empty reporter list') {
    super(message);
  }
}

export class InvalidDetectionResultError extends Error {
  constructor(message: string = 'Invalid detection result') {
    super(message);
  }
}

export class InvalidReporterDataError extends Error {
  constructor(message: string = 'Invalid reporter data') {
    super(message);
  }
}

export class NoActiveReportersError extends Error {
  constructor(message: string = 'No active reporters') {
    super(message);
  }
}

export class SubmissionStatusCheckFailureError extends Error {
  constructor(message: string = 'Submission status check failure') {
    super(message);
  }
}

// Types and Interfaces
export interface GenerateNonSubmissionDetectionResultInput {
  nonSubmittedReporters: NonSubmittedReporter[];
  detectionLog: NonSubmissionDetectionLog;
  detectionTimestamp: string;
}

export interface DashboardDisplayData {
  data?: any[];
  nonSubmittedReportersForDisplay?: any[];
  detectionLogForDisplay?: any;
}

export interface PromptNotificationData {
  reporters?: any[];
  timestamp?: string;
  promptTargets?: any[];
  nonSubmittedReportersForNotification?: any[];
  notificationContext?: any;
}

export interface GenerateNonSubmissionDetectionResultOutput {
  dashboardDisplayData: DashboardDisplayData;
  promptNotificationData: PromptNotificationData;
}

export interface NonSubmittedReporter {
  userId: string;
  userName?: string;
  reporterName?: string;
  name?: string;
  email?: string;
  emailAddress?: string;
  department?: string;
  departmentId?: string;
}

export interface DetectNonSubmittedReportersAtDeadlineInput {
  targetDate: string;
  currentDateTime: string;
  submissionDeadlineTime: string;
  teamId: string;
}

export interface NonSubmissionDetectionLog {
  detectionLogId: string;
  targetDate: string;
  detectionDateTime: string;
  totalReportersCount: number;
  nonSubmittedCount: number;
  submittedCount: number;
  targetCount?: number;
  totalCheckCount?: number;
  detectionTimestamp?: string;
  detectionDate?: string;
}

export interface DetectNonSubmittedReportersAtDeadlineOutput {
  nonSubmittedReporters: NonSubmittedReporter[];
  detectionLog: NonSubmissionDetectionLog;
  detectionTimestamp: string;
  errors?: any[];
}

export interface DetectNonSubmittedOutput {
  nonSubmittedReporters: NonSubmittedReporter[];
  count: number;
  detectionLogId: string;
}

export async function detectNonSubmittedReportersAtDeadline(
  inputOrActiveReporters: DetectNonSubmittedReportersAtDeadlineInput | any[],
  submittedReportsOrInput?: any[] | any,
  targetDateOrUndefined?: string
): Promise<any> {
  // Handle overloaded function: (input) or (activeReporters, submittedReports, targetDate)
  if (Array.isArray(inputOrActiveReporters)) {
    // Old signature: (activeReporters, submittedReports, targetDate)
    const activeReporters = inputOrActiveReporters;
    const submittedReports = submittedReportsOrInput || [];
    const submittedUserIds = new Set((submittedReports || []).map((r: any) => r.userId));
    const nonSubmitted = activeReporters.filter(
      (r: any) => !submittedUserIds.has(r.userId)
    );

    return {
      nonSubmittedReporters: nonSubmitted,
      count: nonSubmitted.length,
      detectionLogId: `log-${Date.now()}`,
    };
  } else {
    // New signature: (input, activeReporters?, submittedReports?)
    const input = inputOrActiveReporters as DetectNonSubmittedReportersAtDeadlineInput;
    const activeReporters = (submittedReportsOrInput as any[] | undefined) || [];
    const submitted = (targetDateOrUndefined as any as any[] | undefined) || [];

    const nonSubmitted = activeReporters.filter(
      (r: any) => !submitted.some((s: any) => s.userId === r.userId)
    );

    const detectionLogId = `log-${Date.now()}-${input.targetDate}`;

    return {
      nonSubmittedReporters: nonSubmitted,
      detectionLog: {
        detectionLogId,
        targetDate: input.targetDate,
        detectionDateTime: input.currentDateTime,
        totalReportersCount: activeReporters.length,
        nonSubmittedCount: nonSubmitted.length,
        submittedCount: activeReporters.length - nonSubmitted.length,
        targetCount: activeReporters.length,
      },
      detectionTimestamp: input.currentDateTime,
    };
  }
}

export interface NonSubmissionDetectionResult {
  nonSubmittedReporters: NonSubmittedReporter[];
  detectionCount: number;
  detectionTimestamp: Date;
  detectionLogId: string;
}

export async function generateNonSubmissionDetectionResult(
  input: any
): Promise<NonSubmissionDetectionResult> {
  return {
    nonSubmittedReporters: input?.nonSubmittedReporters || [],
    detectionCount: input?.nonSubmittedReporters?.length || 0,
    detectionTimestamp: new Date(),
    detectionLogId: `log-${Date.now()}`,
  };
}

export async function identifyReportersEligibleForSubmissionCheck(
  activeReporters: any[]
): Promise<any[]> {
  return activeReporters || [];
}

export async function checkSubmissionStatusForTargetDate(
  reporterId: string,
  targetDate: string
): Promise<any> {
  return { submitted: false };
}

export async function recordNonSubmissionDetectionLog(
  input: any
): Promise<any> {
  return { recorded: true };
}

/**
 * NonSubmittedReporterDisplay
 */
export interface NonSubmittedReporterDisplay {
  /** 未提出者のユーザーID。 */
  userId: string;
  /** 未提出者のユーザー名。 */
  userName: string;
  /** 未提出者のメールアドレス。 */
  emailAddress: string;
  /** 未提出者の部門ID。 */
  departmentId: string;
  /** 未提出対象日（YYYY-MM-DD 形式）。 */
  targetDate: string;
  /** リマインダー送信状態（'pending' | 'sent' | 'failed'）。 */
  reminderSentStatus: string;
}

/**
 * DetectionLogDisplay
 */
export interface DetectionLogDisplay {
  /** 検知ログID。 */
  detectionLogId: string;
  /** 検知対象日（YYYY-MM-DD 形式）。 */
  targetDate: string;
  /** 検知実行日時（ISO 8601 形式）。 */
  detectionDateTime: string;
  /** 対象報告者の総数。 */
  totalReportersCount: number;
  /** 未提出者数。 */
  nonSubmittedCount: number;
  /** 提出済み者数。 */
  submittedCount: number;
}

/**
 * SummaryStatistics
 */
export interface SummaryStatistics {
  /** 未提出率（0.0 ～ 1.0）。 */
  nonSubmissionRate: number;
  /** 検知実行時刻（ISO 8601 形式）。 */
  detectionExecutedAt: string;
}

/**
 * NonSubmittedReporterNotification
 */
export interface NonSubmittedReporterNotification {
  /** 未提出者のユーザーID。 */
  userId: string;
  /** 未提出者のメールアドレス。 */
  emailAddress: string;
  /** 未提出者のユーザー名。 */
  userName: string;
  /** 未提出対象日（YYYY-MM-DD 形式）。 */
  targetDate: string;
}

/**
 * NotificationContext
 */
export interface NotificationContext {
  /** 関連する検知ログID。 */
  detectionLogId: string;
  /** 未提出対象日（YYYY-MM-DD 形式）。 */
  targetDate: string;
  /** 検知実行時刻（ISO 8601 形式）。 */
  detectionTimestamp: string;
}

/**
 * IdentifyReportersEligibleForSubmissionCheckInput
 */
export interface IdentifyReportersEligibleForSubmissionCheckInput {
  /** 日報提出対象者を抽出するチームの識別子。 */
  teamId: string;
  /** 提出対象日付（YYYY-MM-DD形式）。 */
  targetDate: string;
}

/**
 * IdentifyReportersEligibleForSubmissionCheckOutput
 */
export interface IdentifyReportersEligibleForSubmissionCheckOutput {
  /** 提出対象日付に日報提出義務のある有効な報告者の一覧。 */
  eligibleReporters: Array<EligibleReporter>;
  /** 抽出された報告者の総数。 */
  totalCount: number;
}

/**
 * EligibleReporter
 */
export interface EligibleReporter {
  /** 報告者のユーザーID。 */
  userId: string;
  /** 報告者のユーザー名。 */
  userName: string;
  /** 報告者のメールアドレス。 */
  emailAddress: string;
  /** 報告者の所属部門ID。 */
  departmentId: string;
}

/**
 * CheckSubmissionStatusForTargetDateInput
 */
export interface CheckSubmissionStatusForTargetDateInput {
  /** 提出状況を確認するチームの識別子。 */
  teamId: string;
  /** 提出状況を確認する対象日付（ISO 8601形式）。 */
  targetDate: string;
}

/**
 * CheckSubmissionStatusForTargetDateOutput
 */
export interface CheckSubmissionStatusForTargetDateOutput {
  /** 対象日付に日報を提出済みの報告者一覧。 */
  submittedReporters: Array<SubmittedReporter>;
  /** 対象日付に日報を未提出の報告者一覧。 */
  nonSubmittedReporters: Array<NonSubmittedReporter>;
  /** 対象日付の提出対象者の総数。 */
  totalEligibleCount: number;
}

/**
 * SubmittedReporter
 */
export interface SubmittedReporter {
  /** 報告者のユーザーID。 */
  userId: string;
  /** 報告者の名前。 */
  userName: string;
  /** 日報の提出日時（ISO 8601形式）。 */
  submissionDateTime: string;
}

/**
 * RecordNonSubmissionDetectionLogInput
 */
export interface RecordNonSubmissionDetectionLogInput {
  /** 記録対象の検知ログ（検知ログID、対象日付、検知日時、集計情報を含む）。 */
  detectionLog: NonSubmissionDetectionLog;
  /** 検知された未提出者の一覧。 */
  nonSubmittedReporters: Array<NonSubmittedReporter>;
  /** 検知対象のチームID。 */
  teamId: string;
  /** リマインダー送信状態（未送信、送信済み、送信失敗など）。初期値は未送信。 */
  reminderSentStatus?: string;
}

/**
 * RecordNonSubmissionDetectionLogOutput
 */
export interface RecordNonSubmissionDetectionLogOutput {
  /** 記録されたログのID。 */
  detectionLogId: string;
  /** ログがデータベースに記録された日時（ISO 8601形式）。 */
  recordedAt: string;
  /** ログに記録された未提出者の件数。 */
  recordedReportersCount: number;
  /** ログ記録が成功したかどうか。 */
  isSuccessful: boolean;
}
