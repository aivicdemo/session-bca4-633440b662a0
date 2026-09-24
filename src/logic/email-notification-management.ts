// Error Classes
export class AdminNotificationFailedError extends Error {
  constructor(message: string = 'Admin notification failed') {
    super(message);
  }
}

export class AllEmailSendingFailureError extends Error {
  constructor(message: string = 'All email sending failure') {
    super(message);
  }
}

export class DailyReportContentInvalidError extends Error {
  constructor(message: string = 'Daily report content invalid') {
    super(message);
  }
}

export class EmailSendingFailedError extends Error {
  constructor(message: string = 'Email sending failed') {
    super(message);
  }
}

export class EmailSendingFailureError extends Error {
  constructor(message: string = 'Email sending failure') {
    super(message);
  }
}

export class EmailSendingPermanentFailureError extends Error {
  constructor(message: string = 'Email sending permanent failure') {
    super(message);
  }
}

export class EmailServiceUnavailableError extends Error {
  constructor(message: string = 'Email service unavailable') {
    super(message);
  }
}

export class InvalidLeaderEmailAddressError extends Error {
  constructor(message: string = 'Invalid leader email address') {
    super(message);
  }
}

export class InvalidLeaderEmailError extends Error {
  constructor(message: string = 'Invalid leader email') {
    super(message);
  }
}

export class InvalidPromptTargetListError extends Error {
  constructor(message: string = 'Invalid prompt target list') {
    super(message);
  }
}

export class LeaderEmailAddressInvalidError extends Error {
  constructor(message: string = 'Leader email address invalid') {
    super(message);
  }
}

export class LeaderEmailAddressNotFoundError extends Error {
  constructor(message: string = 'Leader email address not found') {
    super(message);
  }
}

export class LeaderNotFoundError extends Error {
  constructor(message: string = 'Leader not found') {
    super(message);
  }
}

export class PartialEmailSendingFailureError extends Error {
  constructor(message: string = 'Partial email sending failure') {
    super(message);
  }
}

export class ReporterNotValidError extends Error {
  constructor(message: string = 'Reporter not valid') {
    super(message);
  }
}

// Types and Interfaces
export interface SendDailyReportSubmissionNotificationInput {
  reporterId?: string;
  reportDate?: string;
  content?: string;
}

export interface SendDailyReportSubmissionNotificationOutput {
  success: boolean;
  notificationId?: string;
}

export interface SendUserInformationApprovalNotificationInput {
  userId?: string;
  approvalStatus?: string;
}

export interface SendUserInformationApprovalNotificationOutput {
  success: boolean;
  notificationId?: string;
}

export interface SendPromptOutput {
  sent: number;
  failed: number;
}

export async function sendNonSubmissionPromptNotification(
  reporters: any[]
): Promise<SendPromptOutput> {
  return { sent: reporters?.length || 0, failed: 0 };
}

export async function sendUserInformationApprovalNotification(input: any): Promise<any> {
  return { success: true };
}

export async function sendDailyReportSubmissionNotification(
  input: any
): Promise<any> {
  return { sent: true };
}

export async function validateEmailAddressForDelivery(
  email: string
): Promise<any> {
  return { valid: true };
}

export async function recordEmailSendingHistory(
  input: any
): Promise<any> {
  return { recorded: true };
}

export async function buildNotificationContent(
  input: any
): Promise<any> {
  return { content: '' };
}

/**
 * SendNonSubmissionPromptNotificationInput
 */
export interface SendNonSubmissionPromptNotificationInput {
  /** 催促対象の未提出者リスト（ユーザーID、名前、メールアドレス、対象日付を含む）。 */
  nonSubmittedReporters: Array<{userId: string, userName: string, userEmailAddress: string, targetDate: string}>;
  /** 催促メール送信を指示するチームリーダーのユーザーID。 */
  leaderUserId: string;
  /** チームリーダーのメールアドレス（CC/BCC対象）。 */
  leaderEmailAddress: string;
  /** この催促に紐づく日報未提出者検知ログのID。 */
  detectionLogId: string;
  /** 催促の理由（例：定時リマインダー、手動催促）。 */
  promptReason: string;
  /** 催促対象の日報提出期限日（YYYY-MM-DD形式）。 */
  targetDate: string;
}

/**
 * SendNonSubmissionPromptNotificationOutput
 */
export interface SendNonSubmissionPromptNotificationOutput {
  /** 全ての催促メール送信が成功したかどうか。 */
  success: boolean;
  /** 催促対象者の総数。 */
  totalTargets: number;
  /** メール送信に成功した対象者の数。 */
  successCount: number;
  /** メール送信に失敗した対象者の数。 */
  failureCount: number;
  /** 記録された送信履歴のIDリスト（成功・失敗を問わず全件）。 */
  emailSendingHistoryIds: Array<string>;
  /** 催促メール送信処理の実行日時（ISO 8601形式）。 */
  sentAt: string;
  /** メール送信に失敗した対象者のユーザーIDリスト（失敗がない場合はnull）。 */
  failedReporterIds?: Array<string> | null;
  /** エラーが発生した場合のエラーメッセージ（成功時はnull）。 */
  errorMessage?: string | null;
}

/**
 * ValidateEmailAddressForDeliveryInput
 */
export interface ValidateEmailAddressForDeliveryInput {
  /** 検証対象のメールアドレス。 */
  emailAddress: string;
  /** 受信者の役割（リーダー、報告者、管理者）。 */
  recipientType: 'leader' | 'reporter' | 'admin';
}

/**
 * ValidateEmailAddressForDeliveryOutput
 */
export interface ValidateEmailAddressForDeliveryOutput {
  /** メールアドレスが配信可能な場合は true。 */
  isValid: boolean;
  /** 配信不可の場合、その理由。配信可能な場合は null。 */
  reason: string | null;
  /** 配信不可の場合、エラーコード。配信可能な場合は null。 */
  errorCode: string | null;
}

/**
 * RecordEmailSendingHistoryInput
 */
export interface RecordEmailSendingHistoryInput {
  /** メール受信者のユーザーID。 */
  userId: string;
  /** メールの種別（日報提出通知、未提出催促、ユーザー情報承認、リマインダー）。 */
  emailType: 'daily_report_submission' | 'non_submission_prompt' | 'user_information_approval' | 'reminder_notification';
  /** メール送信先のメールアドレス。 */
  recipientEmailAddress: string;
  /** メールの件名。 */
  subject: string;
  /** メールの本文。 */
  body: string;
  /** メール送信日時（ISO 8601形式）。 */
  sentAt: string;
  /** メール送信ステータス。 */
  sendingStatus: 'success' | 'failure' | 'pending';
  /** 送信失敗時のエラーメッセージ。成功時はnull。 */
  errorMessage?: string | null;
  /** 関連する日報ID（日報提出通知の場合）。 */
  relatedDailyReportId?: string | null;
  /** 関連するリマインダー設定ID（リマインダー通知の場合）。 */
  relatedReminderSettingId?: string | null;
  /** 再送信フラグ。 */
  retryFlag?: boolean;
}

/**
 * RecordEmailSendingHistoryOutput
 */
export interface RecordEmailSendingHistoryOutput {
  /** メール送信履歴の記録が成功したかどうか。 */
  success: boolean;
  /** 記録されたメール送信履歴ID。失敗時はnull。 */
  emailSendingHistoryId: string | null;
  /** 履歴がデータベースに記録された日時（ISO 8601形式）。失敗時はnull。 */
  recordedAt: string | null;
  /** 記録失敗時のエラーメッセージ。成功時はnull。 */
  errorMessage: string | null;
}

/**
 * BuildNotificationContentInput
 */
export interface BuildNotificationContentInput {
  /** 生成する通知の種別。 */
  notificationType: 'daily_report_submission' | 'non_submission_prompt' | 'user_information_approval';
  /** 報告者の氏名（日報提出通知・未提出催促で使用）。 */
  reporterName?: string;
  /** 対象日付（YYYY-MM-DD形式、日報提出通知・未提出催促で使用）。 */
  reportDate?: string;
  /** 日報の内容要約（日報提出通知で使用）。 */
  reportContent?: string;
  /** 未提出者の人数（未提出催促で使用）。 */
  nonSubmittedCount?: number;
  /** ユーザー情報の承認ステータス（ユーザー情報承認通知で使用）。 */
  approvalStatus?: 'approved' | 'rejected';
  /** 却下理由（approvalStatusが'rejected'の場合に使用）。 */
  rejectionReason?: string | null;
  /** チームリーダーの氏名（ユーザー情報承認通知で使用）。 */
  leaderName?: string;
}

/**
 * BuildNotificationContentOutput
 */
export interface BuildNotificationContentOutput {
  /** メール件名。 */
  subject: string;
  /** メール本文。 */
  body: string;
}
