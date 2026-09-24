/**
 * 日報リマインダー通知ロジック
 */

// Error Classes
export class DailyReportNotFoundError extends Error {
  constructor(message: string = 'Daily report not found') {
    super(message);
  }
}

export class EmailDeliveryFailureError extends Error {
  constructor(message: string = 'Email delivery failure') {
    super(message);
  }
}

export class InvalidExecutionTimingError extends Error {
  constructor(message: string = 'Invalid execution timing') {
    super(message);
  }
}

export class InvalidReporterIdError extends Error {
  constructor(message: string = 'Invalid reporter ID') {
    super(message);
  }
}

export class InvalidSettingParametersError extends Error {
  constructor(message: string = 'Invalid setting parameters') {
    super(message);
  }
}

export class LeaderNotFoundError extends Error {
  constructor(message: string = 'Leader not found') {
    super(message);
  }
}

export class NonSubmittedReportersNotFoundError extends Error {
  constructor(message: string = 'Non-submitted reporters not found') {
    super(message);
  }
}

export class NotificationBuildFailureError extends Error {
  constructor(message: string = 'Notification build failure') {
    super(message);
  }
}

export class PersistenceFailureError extends Error {
  constructor(message: string = 'Persistence failure') {
    super(message);
  }
}

export class ReminderNotificationSendingResultRecordingFailed extends Error {
  constructor(message: string = 'Reminder notification sending result recording failed') {
    super(message);
  }
}

export class ReminderSettingNotConfiguredError extends Error {
  constructor(message: string = 'Reminder setting not configured') {
    super(message);
  }
}

export class ReporterNotFoundError extends Error {
  constructor(message: string = 'Reporter not found') {
    super(message);
  }
}

export class SettingNotFoundError extends Error {
  constructor(message: string = 'Setting not found') {
    super(message);
  }
}

// Types and Interfaces
export interface ManageReminderNotificationSettingsInput {
  userId?: string;
  settings?: any;
}

export interface ManageReminderNotificationSettingsOutput {
  success: boolean;
}

export interface SendReporterReminderNotificationInput {
  reporterId?: string;
  deadline?: string;
}

export interface SendLeaderNotificationOutput {
  sent: number;
}

export interface SendLeaderSubmissionNotificationInput {
  reporterId: string;
  userId?: string;
}

export interface SendLeaderSubmissionNotificationOutput {
  success: boolean;
  notificationId: string;
  sentAt: Date;
  deliveryMethod: string;
  errorDetails: string | null;
}

export async function sendLeaderNonSubmissionPromptNotification(
  input: any
): Promise<SendLeaderNotificationOutput> {
  return { sent: input?.promptCount || 0 };
}

/**
 * リーダーへ提出通知を送信する
 */
export async function sendLeaderSubmissionNotification(
  input: SendLeaderSubmissionNotificationInput
): Promise<SendLeaderSubmissionNotificationOutput> {
  // このメソッドはテスト時にモックされる
  throw new Error('Not implemented');
}

export async function sendReporterReminderNotification(
  input: any
): Promise<any> {
  return { sent: true };
}

export async function manageReminderNotificationSettings(
  input: any
): Promise<any> {
  return { managed: true };
}

export async function determineReminderNotificationEligibility(
  reporter: any
): Promise<any> {
  return { eligible: true };
}

export async function buildReminderNotificationContent(
  reporter: any,
  deadline: string
): Promise<any> {
  return { content: '' };
}

export async function selectNotificationDeliveryMethod(
  reporter: any
): Promise<any> {
  return { method: 'email' };
}

export async function recordReminderNotificationSendingResult(
  input: any
): Promise<any> {
  return { recorded: true };
}

/**
 * SendReporterReminderNotificationOutput
 */
export interface SendReporterReminderNotificationOutput {
  /** リマインダー通知の送信が成功したかどうか。 */
  success: boolean;
  /** 送信されたリマインダー通知の一意識別子。失敗時はnull。 */
  notificationId: string | null;
  /** リマインダー通知が実際に送信された日時。失敗時はnull。 */
  sentAt: Date | null;
  /** 選択された通知配信方法（例：email）。失敗時はnull。 */
  deliveryMethod: string | null;
  /** 送信失敗時のエラー詳細。成功時はnull。 */
  errorDetails: string | null;
}

/**
 * SendLeaderNonSubmissionPromptNotificationInput
 */
export interface SendLeaderNonSubmissionPromptNotificationInput {
  /** 催促通知を受け取るリーダーのユーザーID。 */
  leaderId: string;
  /** 未提出者を検知した対象日付。 */
  targetDate: Date;
  /** 対象日付に日報を提出していないレポーターのユーザーID配列。 */
  nonSubmittedReporterIds: string[];
  /** リーダーのリマインダー設定ID。 */
  reminderSettingId: string;
  /** 催促通知を実行する日時。 */
  executionTimestamp: Date;
}

/**
 * SendLeaderNonSubmissionPromptNotificationOutput
 */
export interface SendLeaderNonSubmissionPromptNotificationOutput {
  /** 催促通知の送信が成功したかどうか。 */
  success: boolean;
  /** 送信された通知の一意識別子。失敗時はnull。 */
  notificationId: string | null;
  /** 催促通知が実際に送信された日時。失敗時はnull。 */
  sentAt: Date | null;
  /** 使用された配信方法（例：email、in-app）。失敗時はnull。 */
  deliveryMethod: string | null;
  /** 催促通知に含まれた未提出者の人数。 */
  nonSubmittedReporterCount: number;
  /** 送信失敗時のエラー詳細。成功時はnull。 */
  errorDetails: string | null;
}

/**
 * DetermineReminderNotificationEligibilityInput
 */
export interface DetermineReminderNotificationEligibilityInput {
  /** 通知の種別（報告者向けリマインダー、リーダー向け提出通知、リーダー向け未提出催促）。 */
  notificationType: 'reporter_reminder' | 'leader_submission' | 'leader_non_submission_prompt';
  /** 報告者ID（notificationTypeが'reporter_reminder'の場合は必須）。 */
  reporterId?: string | null;
  /** リーダーID（notificationTypeが'leader_submission'または'leader_non_submission_prompt'の場合は必須）。 */
  leaderId?: string | null;
  /** リマインダー設定ID（notificationTypeが'reporter_reminder'の場合は必須）。 */
  reminderSettingId?: string | null;
  /** 対象日付（営業日判定に使用）。 */
  targetDate: Date;
  /** 判定実行時刻。 */
  executionTimestamp: Date;
}

/**
 * DetermineReminderNotificationEligibilityOutput
 */
export interface DetermineReminderNotificationEligibilityOutput {
  /** 通知送信対象として適格であるか。 */
  isEligible: boolean;
  /** 判定対象の通知種別。 */
  notificationType: 'reporter_reminder' | 'leader_submission' | 'leader_non_submission_prompt';
  /** 判定対象の報告者ID（該当する場合）。 */
  reporterId?: string | null;
  /** 判定対象のリーダーID（該当する場合）。 */
  leaderId?: string | null;
  /** 適格でない場合の理由（isEligibleがfalseの場合に設定）。 */
  ineligibilityReason?: string | null;
  /** 判定実行時刻。 */
  evaluatedAt: Date;
}

/**
 * BuildReminderNotificationContentInput
 */
export interface BuildReminderNotificationContentInput {
  /** 生成する通知の種別。 */
  notificationType: 'reporter_reminder' | 'leader_submission' | 'leader_non_submission_prompt';
  /** 報告者ID（reporter_reminder または leader_submission の場合に必須）。 */
  reporterId?: string | null;
  /** リーダー名（leader_submission または leader_non_submission_prompt の場合に使用）。 */
  leaderName?: string | null;
  /** 報告者名（leader_submission または leader_non_submission_prompt の場合に使用）。 */
  reporterName?: string | null;
  /** 通知対象の日報日付。 */
  targetDate: Date;
  /** 未提出者数（leader_non_submission_prompt の場合に使用）。 */
  nonSubmittedReporterCount?: number | null;
  /** 通知内容生成の実行時刻。 */
  executionTimestamp: Date;
}

/**
 * BuildReminderNotificationContentOutput
 */
export interface BuildReminderNotificationContentOutput {
  /** 生成された通知の件名。 */
  subject: string;
  /** 生成された通知の本文。 */
  body: string;
  /** 生成された通知の種別。 */
  notificationType: 'reporter_reminder' | 'leader_submission' | 'leader_non_submission_prompt';
  /** 通知内容の生成完了時刻。 */
  generatedAt: Date;
}

/**
 * SelectNotificationDeliveryMethodInput
 */
export interface SelectNotificationDeliveryMethodInput {
  /** 通知の種類を指定し、配信方法選択の判定基準となる。 */
  notificationType: 'reporter_reminder' | 'leader_submission' | 'leader_non_submission_prompt';
  /** 報告者への通知の場合、対象報告者のユーザーIDを指定する。 */
  reporterId?: string | null;
  /** リーダーへの通知の場合、対象リーダーのユーザーIDを指定する。 */
  leaderId?: string | null;
  /** リマインダー設定IDを指定し、配信方法の設定値を取得する際に使用する。 */
  reminderSettingId?: string | null;
  /** 配信方法選択処理の実行時刻を記録し、監査ログと送信履歴の基準時刻となる。 */
  executionTimestamp: Date;
}

/**
 * SelectNotificationDeliveryMethodOutput
 */
export interface SelectNotificationDeliveryMethodOutput {
  /** 選択された配信方法（例：email、in_app_notification）を返す。 */
  deliveryMethod: string;
  /** リマインダー設定の有効フラグに基づき、配信実行の可否を判定する。 */
  isDeliveryEnabled: boolean;
  /** 使用されたリマインダー設定IDを返し、送信履歴記録時の参照情報となる。 */
  reminderSettingId?: string | null;
  /** 配信方法の選択時刻を記録する。 */
  selectedAt: Date;
  /** 配信方法選択に失敗した場合、エラーの詳細情報を返す。 */
  errorDetails?: string | null;
}

/**
 * RecordReminderNotificationSendingResultInput
 */
export interface RecordReminderNotificationSendingResultInput {
  /** リマインダー通知の送信結果を記録する対象の日報未提出者検知ログID。 */
  detectionLogId: string;
  /** リマインダー通知の送信ステータス（sent: 送信完了、failed: 送信失敗、skipped: スキップ）。 */
  notificationStatus: 'sent' | 'failed' | 'skipped';
  /** リマインダー通知の実際の送信日時。送信失敗またはスキップの場合はnull。 */
  sentAt: Date | null;
  /** リマインダー通知がスキップされた場合の理由（例：リマインダー設定が無効、送信対象者が不在など）。 */
  skipReason?: string | null;
  /** リマインダー通知の送信失敗時のエラー詳細メッセージ。 */
  errorDetails?: string | null;
  /** この記録操作の実行日時。監査ログと処理順序の追跡に使用。 */
  executionTimestamp: Date;
}

/**
 * RecordReminderNotificationSendingResultOutput
 */
export interface RecordReminderNotificationSendingResultOutput {
  /** リマインダー通知の送信結果の記録が成功したかどうか。 */
  success: boolean;
  /** 記録対象の日報未提出者検知ログID。記録失敗時はnull。 */
  detectionLogId: string | null;
  /** 記録されたリマインダー通知の送信ステータス。記録失敗時はnull。 */
  notificationStatus: 'sent' | 'failed' | 'skipped' | null;
  /** 送信結果がログに記録された日時。記録失敗時はnull。 */
  recordedAt: Date | null;
  /** 記録処理が失敗した場合のエラー詳細メッセージ。 */
  errorDetails?: string | null;
}
