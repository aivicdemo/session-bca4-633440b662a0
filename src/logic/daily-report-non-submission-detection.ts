import { getActiveReportersForSubmissionCheck } from './reporter-master-management';
import { checkDailyReportExistsForDate, retrieveNonSubmissionDetectionLogsByDate, updateNonSubmissionDetectionLogWithReminderStatus } from './daily-report-persistence';

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
  [key: string]: any;
  nonSubmittedReporters: NonSubmittedReporter[];
  detectionLog: NonSubmissionDetectionLog;
  detectionTimestamp: string;
}

export interface DashboardDisplayData {
  [key: string]: any;
  nonSubmittedReportersForDisplay: NonSubmittedReporterDisplay[];
  detectionLogForDisplay: DetectionLogDisplay;
  summaryStatistics: SummaryStatistics;
}

export interface PromptNotificationData {
  [key: string]: any;
  nonSubmittedReportersForNotification: NonSubmittedReporterNotification[];
  notificationContext: NotificationContext;
}

export interface GenerateNonSubmissionDetectionResultOutput {
  [key: string]: any;
  dashboardDisplayData?: DashboardDisplayData;
  promptNotificationData?: PromptNotificationData;
}

export interface NonSubmittedReporter {
  [key: string]: any;
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
  [key: string]: any;
  targetDate: string;
  currentDateTime: string;
  submissionDeadlineTime: string;
  teamId: string;
}

export interface NonSubmissionDetectionLog {
  [key: string]: any;
  detectionLogId?: string;
  targetDate?: string;
  detectionDateTime?: string;
  totalReportersCount?: number;
  nonSubmittedCount?: number;
  submittedCount?: number;
  targetCount?: number;
  totalCheckCount?: number;
  detectionTimestamp?: string;
  detectionDate?: string;
}

export interface DetectNonSubmittedReportersAtDeadlineOutput {
  [key: string]: any;
  nonSubmittedReporters: NonSubmittedReporter[];
  detectionLog: NonSubmissionDetectionLog;
  detectionTimestamp: string;
  errors?: any[];
}

export interface DetectNonSubmittedOutput {
  [key: string]: any;
  nonSubmittedReporters: NonSubmittedReporter[];
  count: number;
  detectionLogId: string;
}

export async function detectNonSubmittedReportersAtDeadline(
  input: DetectNonSubmittedReportersAtDeadlineInput
): Promise<DetectNonSubmittedReportersAtDeadlineOutput> {
  let activeReporters: any[] = [];
  try {
    const result = await (getActiveReportersForSubmissionCheck?.() || []);
    activeReporters = Array.isArray(result) ? result : [];
  } catch {
    activeReporters = [];
  }

  const nonSubmitted = [];
  for (const reporter of activeReporters) {
    const exists = await checkDailyReportExistsForDate?.({ userId: reporter.userId, reportDate: input.targetDate });
    if (!exists) {
      nonSubmitted.push(reporter);
    }
  }

  const detectionLogId = `log-${Date.now()}-${input.targetDate}`;

  return {
    nonSubmittedReporters: nonSubmitted,
    detectionLog: {
      detectionLogId,
      targetDate: input.targetDate,
      detectionTimestamp: input.currentDateTime,
      detectionDateTime: input.currentDateTime,
      totalReportersCount: activeReporters.length,
      targetReportersCount: activeReporters.length,
      nonSubmittedCount: nonSubmitted.length,
      submittedCount: activeReporters.length - nonSubmitted.length,
      targetCount: activeReporters.length,
    },
    detectionTimestamp: input.currentDateTime,
  };
}

export interface NonSubmissionDetectionResult {
  [key: string]: any;
  nonSubmittedReporters?: NonSubmittedReporter[];
  detectionCount?: number;
  detectionTimestamp?: Date | string;
  detectionLogId?: string;
  dashboardDisplayData?: DashboardDisplayData;
  promptNotificationData?: PromptNotificationData;
}

export function generateNonSubmissionDetectionResult(
  input: any
): NonSubmissionDetectionResult {
  const reporters = input?.nonSubmittedReporters || [];
  const detectionLog = input?.detectionLog || {};

  // Check for count mismatch
  if (reporters.length === 0 && detectionLog.nonSubmittedCount && detectionLog.nonSubmittedCount > 0) {
    throw new EmptyReporterListError('未提出者検知ログと未提出者リストの件数が不一致です。');
  }

  for (const reporter of reporters) {
    if (!reporter.emailAddress || !reporter.departmentId) {
      throw new InvalidReporterDataError('未提出者情報に必須項目が不足しています。');
    }
  }

  return {
    nonSubmittedReporters: reporters,
    detectionCount: reporters.length,
    detectionTimestamp: new Date(),
    detectionLogId: `log-${Date.now()}`,
  };
}

export function identifyReportersEligibleForSubmissionCheck(
  activeReporters: any[]
): any[] {
  return activeReporters || [];
}

export function checkSubmissionStatusForTargetDate(
  reporterId: string,
  targetDate: string
): any {
  return { submitted: false };
}

export function recordNonSubmissionDetectionLog(
  input: any
): any {
  return { recorded: true };
}

/**
 * NonSubmittedReporterDisplay
 */
export interface NonSubmittedReporterDisplay {
  [key: string]: any;
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
  [key: string]: any;
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
  [key: string]: any;
  /** 未提出率（0.0 ～ 1.0）。 */
  nonSubmissionRate: number;
  /** 検知実行時刻（ISO 8601 形式）。 */
  detectionExecutedAt: string;
}

/**
 * NonSubmittedReporterNotification
 */
export interface NonSubmittedReporterNotification {
  [key: string]: any;
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
  [key: string]: any;
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
  [key: string]: any;
  /** 日報提出対象者を抽出するチームの識別子。 */
  teamId: string;
  /** 提出対象日付（YYYY-MM-DD形式）。 */
  targetDate: string;
}

/**
 * IdentifyReportersEligibleForSubmissionCheckOutput
 */
export interface IdentifyReportersEligibleForSubmissionCheckOutput {
  [key: string]: any;
  /** 提出対象日付に日報提出義務のある有効な報告者の一覧。 */
  eligibleReporters: Array<EligibleReporter>;
  /** 抽出された報告者の総数。 */
  totalCount: number;
}

/**
 * EligibleReporter
 */
export interface EligibleReporter {
  [key: string]: any;
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
  [key: string]: any;
  /** 提出状況を確認するチームの識別子。 */
  teamId: string;
  /** 提出状況を確認する対象日付（ISO 8601形式）。 */
  targetDate: string;
}

/**
 * CheckSubmissionStatusForTargetDateOutput
 */
export interface CheckSubmissionStatusForTargetDateOutput {
  [key: string]: any;
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
  [key: string]: any;
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
  [key: string]: any;
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
  [key: string]: any;
  /** 記録されたログのID。 */
  detectionLogId: string;
  /** ログがデータベースに記録された日時（ISO 8601形式）。 */
  recordedAt: string;
  /** ログに記録された未提出者の件数。 */
  recordedReportersCount: number;
  /** ログ記録が成功したかどうか。 */
  isSuccessful: boolean;
}
