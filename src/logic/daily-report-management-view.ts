import { NonSubmittedReporterInfo } from '../agents/tx-1-imp-1/orchestrator';
import { DetectionLogSummary } from '../agents/tx-3-imp-1/orchestrator';

// Error Classes
export class DataRetrievalError extends Error {
  constructor(message: string = 'Data retrieval error') {
    super(message);
  }
}

export class DataRetrievalFailedError extends Error {
  constructor(message: string = 'Data retrieval failed') {
    super(message);
  }
}

export class DetectionLogNotFound extends Error {
  constructor(message: string = 'Detection log not found') {
    super(message);
  }
}

export class InvalidDetectionLogId extends Error {
  constructor(message: string = 'Invalid detection log ID') {
    super(message);
  }
}

export class InvalidFilterCriteriaError extends Error {
  constructor(message: string = 'Invalid filter criteria') {
    super(message);
  }
}

export class LeaderAuthorizationError extends Error {
  constructor(message: string = 'Leader authorization error') {
    super(message);
  }
}

export class LeaderAuthorizationFailedError extends Error {
  constructor(message: string = 'Leader authorization failed') {
    super(message);
  }
}

export class NoEmailHistoryFoundError extends Error {
  constructor(message: string = 'No email history found') {
    super(message);
  }
}

export class TargetDateInvalidError extends Error {
  constructor(message: string = 'Target date invalid') {
    super(message);
  }
}

export class UnauthorizedLeaderAccess extends Error {
  constructor(message: string = 'Unauthorized leader access') {
    super(message);
  }
}

// Types and Interfaces
export interface EmailHistoryDetail {
  id?: string;
  sentAt?: string;
  recipient?: string;
  subject?: string;
}

export interface RetrieveEmailSendingHistoryDetailsInput {
  dateFrom?: string;
  dateTo?: string;
  reporterId?: string;
}

export interface RetrieveEmailSendingHistoryDetailsOutput {
  details: EmailHistoryDetail[];
}

export interface RetrieveNonSubmissionDetectionDetailsOutput {
  detectionDetails: any[];
}

// Existing interfaces
export interface DashboardOutput {
  progressSummary: string;
  submittedCount: number;
  nonSubmittedCount: number;
}

// Functions
export async function formatEmailHistoryForDisplay(
  data: any
): Promise<string> {
  return '';
}

export async function retrieveEmailSendingHistoryDetails(
  input: RetrieveEmailSendingHistoryDetailsInput
): Promise<RetrieveEmailSendingHistoryDetailsOutput> {
  return { details: [] };
}

export async function retrieveNonSubmissionDetectionDetails(
  detectionLogId: string
): Promise<RetrieveNonSubmissionDetectionDetailsOutput> {
  return { detectionDetails: [] };
}

export async function retrieveLeaderDashboardData(
  targetDate: string,
  leaderUserId: string
): Promise<DashboardOutput> {
  return {
    progressSummary: '',
    submittedCount: 0,
    nonSubmittedCount: 0,
  };
}

/**
 * RetrieveLeaderDashboardDataInput
 */
export interface RetrieveLeaderDashboardDataInput {
  /** リーダーのユーザーID。 */
  leaderId: string;
  /** 管理画面で表示する対象日付（ISO 8601形式: YYYY-MM-DD）。 */
  targetDate: string;
}

/**
 * RetrieveLeaderDashboardDataOutput
 */
export interface RetrieveLeaderDashboardDataOutput {
  /** 本日提出済みの日報一覧（統一フォーマットで整形済み）。 */
  submittedReports: Array<SubmittedDailyReportSummary>;
  /** 本日未提出の報告者一覧。 */
  nonSubmittedReporters: Array<NonSubmittedReporterInfo>;
  /** 本日の未提出者検知ログ。 */
  detectionLogs: Array<DetectionLogSummary>;
  /** 本日のメール送信履歴。 */
  emailSendingHistory: Array<EmailHistorySummary>;
  /** 本日の提出状況サマリー（提出者数、未提出者数、催促済み数など）。 */
  submissionStatusSummary: SubmissionStatusSummary;
}

/**
 * SubmittedDailyReportSummary
 */
export interface SubmittedDailyReportSummary {
  /** 日報ID。 */
  reportId: string;
  /** 報告者のユーザーID。 */
  reporterId: string;
  /** 報告者の氏名。 */
  reporterName: string;
  /** 日報提出日時（ISO 8601形式）。 */
  submissionTime: string;
  /** 業務内容（統一フォーマットで整形済み）。 */
  businessContent: string;
  /** 成果（統一フォーマットで整形済み）。 */
  achievements: string;
  /** 課題（統一フォーマットで整形済み）。 */
  issues: string;
  /** 明日の予定（統一フォーマットで整形済み）。 */
  tomorrowPlan: string;
}

/**
 * EmailHistorySummary
 */
export interface EmailHistorySummary {
  /** メール送信履歴ID。 */
  historyId: string;
  /** 受信者のユーザーID。 */
  recipientId: string;
  /** 受信者のメールアドレス。 */
  recipientEmail: string;
  /** メールタイプ（提出通知、催促通知、など）。 */
  emailType: string;
  /** メール件名。 */
  subject: string;
  /** 送信日時（ISO 8601形式）。 */
  sentTime: string;
  /** 送信ステータス（成功、失敗、など）。 */
  sendingStatus: string;
  /** 送信失敗時のエラーメッセージ、成功時はnull。 */
  errorMessage: string | null;
}

/**
 * SubmissionStatusSummary
 */
export interface SubmissionStatusSummary {
  /** 対象報告者の総数。 */
  totalReporters: number;
  /** 提出済みの報告者数。 */
  submittedCount: number;
  /** 未提出の報告者数。 */
  nonSubmittedCount: number;
  /** リマインダー催促を送信した報告者数。 */
  reminderSentCount: number;
  /** 提出率（0～100の数値）。 */
  submissionRate: number;
}

/**
 * RetrieveNonSubmissionDetectionDetailsInput
 */
export interface RetrieveNonSubmissionDetectionDetailsInput {
  /** 詳細を確認する検知ログの一意識別子。 */
  detectionLogId: string;
  /** アクセス権限を検証するリーダーの一意識別子。 */
  leaderId: string;
}

/**
 * NonSubmittedReporterDetail
 */
export interface NonSubmittedReporterDetail {
  /** 未提出者の一意識別子。 */
  reporterId: string;
  /** 未提出者の氏名。 */
  reporterName: string;
  /** 未提出者のメールアドレス。 */
  reporterEmail: string;
  /** 未提出者の所属部門。 */
  department: string;
  /** 検知時点での提出状況（未提出、遅延など）。 */
  detectionStatus: string;
}

/**
 * ReminderSendingStatus
 */
export interface ReminderSendingStatus {
  /** リマインダー通知が送信されたかどうか。 */
  reminderSent: boolean;
  /** リマインダー送信日時（ISO 8601形式）、未送信の場合はnull。 */
  reminderSentDateTime: string | null;
  /** リマインダー送信方法（メール、システム通知など）、未送信の場合はnull。 */
  reminderSendingMethod: string | null;
  /** リマインダー送信対象者数。 */
  reminderDeliveryCount: number;
  /** リマインダー送信成功数。 */
  reminderDeliverySuccessCount: number;
}

/**
 * SubmissionStatusAfterReminder
 */
export interface SubmissionStatusAfterReminder {
  /** リマインダー送信後に提出した者の数。 */
  submittedAfterReminderCount: number;
  /** リマインダー送信後も未提出のままの者の数。 */
  stillNonSubmittedCount: number;
  /** 提出状況を最後に確認した日時（ISO 8601形式）。 */
  lastConfirmedDateTime: string;
}

/**
 * AggregateDailyReportSubmissionStatusInput
 */
export interface AggregateDailyReportSubmissionStatusInput {
  /** 集計を要求したリーダーのユーザーID。 */
  leaderId: string;
  /** 集計対象日付（ISO 8601形式: YYYY-MM-DD）。 */
  targetDate: string;
}

/**
 * FormatDailyReportForDisplayInput
 */
export interface FormatDailyReportForDisplayInput {
  /** 日報ID。 */
  reportId: string;
  /** 報告者のユーザーID。 */
  reporterId: string;
  /** 報告者の氏名。 */
  reporterName: string;
  /** 日報の提出日時（ISO 8601形式）。 */
  submissionTime: string;
  /** 業務内容。 */
  businessContent: string;
  /** 成果。 */
  achievements?: string;
  /** 課題。 */
  issues?: string;
  /** 明日の予定。 */
  tomorrowPlan?: string;
}

/**
 * FormatNonSubmittedReportersListInput
 */
export interface FormatNonSubmittedReportersListInput {
  /** 未提出者の検知結果リスト。 */
  nonSubmittedReporters: Array<{reporterId: string, reporterName: string, reporterEmail: string, department: string, detectionDateTime: string, reminderSentDateTime?: string | null, reminderSendingMethod?: string | null}>;
  /** 本日の日報提出期限時刻（HH:mm 形式）。 */
  submissionDeadlineTime: string;
  /** 現在の日時（ISO 8601 形式）。期限超過時間の計算に使用。 */
  currentDateTime: string;
}

/**
 * NonSubmittedReporterSummary
 */
export interface NonSubmittedReporterSummary {
  /** 報告者のユーザーID。 */
  reporterId: string;
  /** 報告者の氏名。 */
  reporterName: string;
  /** 報告者のメールアドレス。 */
  reporterEmail: string;
  /** 報告者の所属部門。 */
  department: string;
  /** 未提出が検知された日時（ISO 8601 形式）。 */
  detectionDateTime: string;
  /** 期限超過時間（分単位）。負の値は期限前を示す。 */
  overdueDurationMinutes: number;
  /** 催促状況。値: 'not_sent', 'sent', 'sent_multiple'。 */
  reminderStatus: string;
  /** 最後に催促メールが送信された日時（ISO 8601 形式）。未送信の場合は null。 */
  lastReminderSentDateTime?: string | null;
  /** 催促メールの送信方法。値: 'email', 'system_notification', null（未送信時）。 */
  reminderDeliveryMethod?: string | null;
}

/**
 * FormatDetectionLogForDisplayInput
 */
export interface FormatDetectionLogForDisplayInput {
  /** 整形対象の検知ログを特定するID。 */
  detectionLogId: string;
  /** 未提出者のユーザーID。 */
  userId: string;
  /** 未提出者の氏名。 */
  userName: string;
  /** 日報の対象日付（YYYY-MM-DD形式）。 */
  targetDate: string;
  /** 未提出者を検知した日時（ISO 8601形式）。 */
  detectionDateTime: string;
  /** リマインダー通知が送信済みであるかを示すフラグ。 */
  reminderSent: boolean;
  /** リマインダー通知を送信した日時（ISO 8601形式）。送信されていない場合はnull。 */
  reminderSentDateTime?: string | null;
  /** リマインダー通知の送信方法（メール等）。送信されていない場合はnull。 */
  reminderSendingMethod?: string | null;
  /** 検知時点での提出状況（未提出、提出済み等）。 */
  submissionStatus: string;
  /** 日報が提出された日時（ISO 8601形式）。未提出の場合はnull。 */
  submissionDateTime?: string | null;
}

/**
 * FormatEmailHistoryForDisplayInput
 */
export interface FormatEmailHistoryForDisplayInput {
  /** メール送信履歴の一意識別子。 */
  historyId: string;
  /** 受信者のユーザーID。 */
  recipientId: string;
  /** 受信者のメールアドレス。 */
  recipientEmail: string;
  /** 受信者の氏名。 */
  recipientName: string;
  /** メールの種別（DAILY_REPORT_SUBMISSION, NON_SUBMISSION_PROMPT, REMINDER_NOTIFICATION, USER_INFORMATION_APPROVAL）。 */
  emailType: string;
  /** メールの件名。 */
  subject: string;
  /** メール送信日時（ISO 8601形式）。 */
  sentTime: string;
  /** 送信ステータス（SUCCESS, FAILED, PENDING, RETRY）。 */
  sendingStatus: string;
  /** 送信失敗時のエラーメッセージ。 */
  errorMessage?: string | null;
  /** 関連する日報ID（日報提出通知の場合）。 */
  relatedReportId?: string | null;
  /** 関連するリマインダー設定ID（リマインダー通知の場合）。 */
  relatedReminderSettingId?: string | null;
  /** 再送信フラグ。 */
  retryFlag: boolean;
}
