// Error Classes
export class DuplicateEmailAddressError extends Error {
  constructor(message: string = 'Duplicate email address') {
    super(message);
  }
}

export class DuplicateReporterEmailError extends Error {
  constructor(message: string = 'Duplicate reporter email') {
    super(message);
  }
}

export class InvalidLeaderUserIdError extends Error {
  constructor(message: string = 'Invalid leader user ID') {
    super(message);
  }
}

export class InvalidNotificationMethodError extends Error {
  constructor(message: string = 'Invalid notification method') {
    super(message);
  }
}

export class InvalidReminderSettingsError extends Error {
  constructor(message: string = 'Invalid reminder settings') {
    super(message);
  }
}

export class InvalidReporterInformationError extends Error {
  constructor(message: string = 'Invalid reporter information') {
    super(message);
  }
}

export class InvalidReporterStatusError extends Error {
  constructor(message: string = 'Invalid reporter status') {
    super(message);
  }
}

export class PersistenceFailureError extends Error {
  constructor(message: string = 'Persistence failure') {
    super(message);
  }
}

export class ReporterAlreadyInactiveError extends Error {
  constructor(message: string = 'Reporter already inactive') {
    super(message);
  }
}

export class ReporterNotFoundError extends Error {
  constructor(message: string = 'Reporter not found') {
    super(message);
  }
}

export class ReporterRegistrationFailedError extends Error {
  constructor(message: string = 'Reporter registration failed') {
    super(message);
  }
}

export class UnauthorizedUpdateError extends Error {
  constructor(message: string = 'Unauthorized update') {
    super(message);
  }
}

export class UserNotFoundError extends Error {
  constructor(message: string = 'User not found') {
    super(message);
  }
}

// Types and Interfaces
export interface RetrieveReporterByUserIdOutput {
  reporterId?: string;
  userId?: string;
  name?: string;
  email?: string;
}

export interface SaveReminderNotificationSettingsInput {
  userId?: string;
  settings?: any;
}

export interface SaveReminderNotificationSettingsOutput {
  saved: boolean;
  settingId?: string;
}


export interface PersistResult {
  persisted: boolean;
  recordId?: string;
}

export async function persistUserMasterUpdate(
  userInfo: any
): Promise<PersistResult> {
  return {
    persisted: true,
    recordId: `rec-${Date.now()}`,
  };
}

export async function registerReporterToMaster(input: any): Promise<any> {
  return { success: true };
}

export async function updateReporterInMaster(input: any): Promise<any> {
  return { success: true };
}

export async function deactivateReporterInMaster(input: any): Promise<any> {
  return { success: true };
}

export async function persistReporterMasterChangeHistory(input: any): Promise<any> {
  return { success: true };
}

export async function saveReminderNotificationSettings(
  input: any
): Promise<any> {
  return { saved: true };
}

export async function retrieveActiveReportersForDate(
  date: string
): Promise<any> {
  return [];
}

export async function retrieveReporterByUserId(
  userId: string
): Promise<any> {
  return {};
}

export async function retrieveReminderNotificationSettingsByUserId(
  userId: string
): Promise<any> {
  return {};
}

export async function saveDailyReportRecord(
  input: any
): Promise<any> {
  return { saved: true };
}

export async function retrieveDailyReportByUserIdAndDate(
  userId: string,
  date: string
): Promise<any> {
  return null;
}

export async function retrieveNonSubmissionDetectionLogsByTargetDate(
  date: string
): Promise<any> {
  return [];
}

export async function saveEmailSendingHistory(
  input: any
): Promise<any> {
  return { saved: true };
}

export async function retrieveEmailSendingHistoryByDateRange(
  startDate: string,
  endDate: string
): Promise<any> {
  return [];
}

/**
 * RegisterReporterToMasterInput
 */
export interface RegisterReporterToMasterInput {
  /** 登録する報告者の氏名。 */
  reporterName: string;
  /** 登録する報告者のメールアドレス。 */
  emailAddress: string;
  /** 報告者が属する部門。 */
  department: string;
  /** 登録操作を実行するチームリーダーのユーザーID。 */
  leaderUserId: string;
  /** 報告者マスタへの登録日時。 */
  registrationTimestamp: Date;
}

/**
 * RegisterReporterToMasterOutput
 */
export interface RegisterReporterToMasterOutput {
  /** 報告者マスタへの登録が成功したかどうか。 */
  success: boolean;
  /** 登録された報告者に割り当てられたユーザーID。登録失敗時はnull。 */
  reporterId: string | null;
  /** 登録結果を示すメッセージ。 */
  message: string;
}

/**
 * UpdateReporterInMasterInput
 */
export interface UpdateReporterInMasterInput {
  /** 更新対象の報告者ID。 */
  reporterId: string;
  /** 更新後の報告者名。 */
  reporterName?: string | undefined;
  /** 更新後のメールアドレス。 */
  emailAddress?: string | undefined;
  /** 更新後の部門。 */
  department?: string | undefined;
  /** 更新後のステータス（active/inactive等）。 */
  status?: string | undefined;
  /** 更新を実行するチームリーダーのユーザーID。 */
  leaderUserId: string;
  /** 更新日時。 */
  updateTimestamp: Date;
}

/**
 * UpdateReporterInMasterOutput
 */
export interface UpdateReporterInMasterOutput {
  /** 更新が成功したかどうか。 */
  success: boolean;
  /** 更新された報告者ID。失敗時はnull。 */
  reporterId: string | null;
  /** 更新結果のメッセージ。 */
  message: string;
}

/**
 * DeactivateReporterInMasterInput
 */
export interface DeactivateReporterInMasterInput {
  /** 無効化対象の報告者ID。 */
  reporterId: string;
  /** 無効化操作を実行するチームリーダーのユーザーID。 */
  leaderUserId: string;
  /** 無効化操作の実行日時。 */
  deactivationTimestamp: Date;
  /** 無効化の理由（退職、異動、プロジェクト配置変更など）。 */
  deactivationReason?: string;
}

/**
 * DeactivateReporterInMasterOutput
 */
export interface DeactivateReporterInMasterOutput {
  /** 無効化処理の成功可否。 */
  success: boolean;
  /** 無効化された報告者ID。失敗時はnull。 */
  reporterId: string | null;
  /** 処理結果のメッセージ。 */
  message: string;
}

/**
 * RetrieveActiveReportersForDateInput
 */
export interface RetrieveActiveReportersForDateInput {
  /** 有効な報告者を検索する対象日付（ISO 8601形式）。 */
  targetDate: string;
  /** 検索対象を特定部門に限定する場合の部門ID。 */
  departmentFilter?: string | undefined;
}

/**
 * RetrieveActiveReportersForDateOutput
 */
export interface RetrieveActiveReportersForDateOutput {
  /** 検索処理の成功可否。 */
  success: boolean;
  /** 指定日付において有効な報告者の一覧。 */
  reporters: Array<{reporterId: string; userId: string; reporterName: string; emailAddress: string; department: string; status: string}>;
  /** 検索結果の報告者総数。 */
  totalCount: number;
  /** 処理結果に関する補足メッセージ。 */
  message?: string;
}

/**
 * RetrieveReporterByUserIdInput
 */
export interface RetrieveReporterByUserIdInput {
  /** 検索対象のユーザーID。 */
  userId: string;
}

/**
 * PersistReporterMasterChangeHistoryInput
 */
export interface PersistReporterMasterChangeHistoryInput {
  /** 変更対象の報告者ID。 */
  reporterId: string;
  /** 実行された操作の種別（登録、更新、削除）。 */
  operationType: 'register' | 'update' | 'delete';
  /** 変更前の値（登録時はnull、更新・削除時に記録）。 */
  previousValues?: { reporterName?: string; emailAddress?: string; department?: string; status?: string } | null;
  /** 変更後の値（削除時はnull、登録・更新時に記録）。 */
  newValues?: { reporterName?: string; emailAddress?: string; department?: string; status?: string } | null;
  /** 操作を実行したチームリーダーのユーザーID。 */
  leaderUserId: string;
  /** 操作が実行された日時。 */
  operationTimestamp: Date;
  /** 変更理由（人事異動、退職、配置変更など）。 */
  changeReason?: string;
}

/**
 * PersistReporterMasterChangeHistoryOutput
 */
export interface PersistReporterMasterChangeHistoryOutput {
  /** 変更履歴の記録が成功したかどうか。 */
  success: boolean;
  /** 記録された変更履歴のID（失敗時はnull）。 */
  changeHistoryId: string | null;
  /** 処理結果のメッセージ。 */
  message: string;
}

/**
 * RetrieveReminderNotificationSettingsByUserIdInput
 */
export interface RetrieveReminderNotificationSettingsByUserIdInput {
  /** リマインダー設定を検索するユーザーID。 */
  userId: string;
}

/**
 * RetrieveReminderNotificationSettingsByUserIdOutput
 */
export interface RetrieveReminderNotificationSettingsByUserIdOutput {
  /** 検索処理の成功可否。 */
  success: boolean;
  /** 検索されたリマインダー設定レコード、存在しない場合はnull。 */
  reminderSetting: {reminderSettingId: string; userId: string; enabledFlag: boolean; sendingTime: string; sendingDaysOfWeek: string[]; sendingMethod: string; createdAt: Date; updatedAt: Date} | null;
  /** 処理結果のメッセージ。 */
  message?: string | undefined;
}

/**
 * SaveDailyReportRecordInput
 */
export interface SaveDailyReportRecordInput {
  /** 日報を提出したユーザーの一意識別子。 */
  userId: string;
  /** 日報の対象日付（YYYY-MM-DD形式）。 */
  reportDate: string;
  /** 当日実施した業務内容。 */
  businessContent: string;
  /** 当日の成果・完了事項。 */
  achievements?: string;
  /** 当日発生した課題・懸念事項。 */
  challenges?: string;
  /** 翌日の予定・計画。 */
  tomorrowPlan?: string;
  /** 日報レコードの作成日時（システムが記録）。 */
  createdAt: Date;
}

/**
 * SaveDailyReportRecordOutput
 */
export interface SaveDailyReportRecordOutput {
  /** 日報レコードの保存が成功したかどうか。 */
  success: boolean;
  /** 保存された日報レコードの一意識別子。失敗時は null。 */
  dailyReportId: string | null;
  /** 処理結果の詳細メッセージ（成功時は確認、失敗時はエラー理由）。 */
  message: string;
}

/**
 * RetrieveDailyReportByUserIdAndDateInput
 */
export interface RetrieveDailyReportByUserIdAndDateInput {
  /** 日報を検索する対象ユーザーの一意識別子。 */
  userId: string;
  /** 検索対象の報告日付（ISO 8601形式: YYYY-MM-DD）。 */
  reportDate: string;
}

/**
 * RetrieveDailyReportByUserIdAndDateOutput
 */
export interface RetrieveDailyReportByUserIdAndDateOutput {
  /** 日報レコードの検索が成功したかどうかを示す。 */
  success: boolean;
  /** 検索された日報レコード。存在しない場合はnull。 */
  dailyReport: {dailyReportId: string; userId: string; reportDate: string; businessContent: string; achievements?: string; challenges?: string; tomorrowPlan?: string; createdAt: Date; updatedAt: Date} | null;
  /** 検索結果に関する補足メッセージ。 */
  message?: string | undefined;
}

/**
 * RetrieveNonSubmissionDetectionLogsByTargetDateInput
 */
export interface RetrieveNonSubmissionDetectionLogsByTargetDateInput {
  /** 検索対象の日付（YYYY-MM-DD 形式）。 */
  targetDate: string;
  /** 部門でフィルタリングする場合の部門名。指定しない場合は全部門を対象とする。 */
  departmentFilter?: string | undefined;
  /** 検知後に提出済みとなったレコードを含めるかどうか。デフォルトは false。 */
  includeSubmittedAfterDetection?: boolean | undefined;
}

/**
 * RetrieveNonSubmissionDetectionLogsByTargetDateOutput
 */
export interface RetrieveNonSubmissionDetectionLogsByTargetDateOutput {
  /** 検索が成功したかどうか。 */
  success: boolean;
  /** 検索条件に合致した未提出者検知ログの一覧。 */
  detectionLogs: Array<{detectionLogId: string; userId: string; reporterName: string; emailAddress: string; department: string; targetDate: string; detectionDateTime: Date; reminderSentFlag: boolean; reminderSentDateTime: Date | null; submissionStatus: 'not_submitted' | 'submitted'; createdAt: Date; updatedAt: Date}>;
  /** 検索条件に合致したログの総件数。 */
  totalCount: number;
  /** 処理結果に関する補足メッセージ。 */
  message?: string | undefined;
}

/**
 * SaveEmailSendingHistoryInput
 */
export interface SaveEmailSendingHistoryInput {
  /** メール受信者のユーザーID。 */
  userId: string;
  /** メールの種別（日報提出通知、未提出者催促、リマインダー通知、ユーザー情報承認通知）。 */
  emailType: 'daily_report_submission' | 'non_submission_prompt' | 'reminder_notification' | 'user_information_approval';
  /** メール送信先のメールアドレス。 */
  recipientEmailAddress: string;
  /** メールの件名。 */
  subject: string;
  /** メールの本文。 */
  body: string;
  /** メール送信日時。 */
  sentDateTime: Date;
  /** メール送信ステータス（成功、失敗、保留中）。 */
  sendingStatus: 'success' | 'failure' | 'pending';
  /** 送信失敗時のエラーメッセージ。成功時はnull。 */
  errorMessage?: string | null;
  /** 関連する日報ID（日報提出通知の場合に設定）。 */
  relatedDailyReportId?: string | null;
  /** 関連するリマインダー設定ID（リマインダー通知の場合に設定）。 */
  relatedReminderSettingId?: string | null;
  /** 再送信フラグ（初回送信時はfalse、再送信時はtrue）。 */
  resendFlag?: boolean;
}

/**
 * SaveEmailSendingHistoryOutput
 */
export interface SaveEmailSendingHistoryOutput {
  /** メール送信履歴の保存成功の可否。 */
  success: boolean;
  /** 保存されたメール送信履歴レコードのID。失敗時はnull。 */
  emailSendingHistoryId: string | null;
  /** 処理結果のメッセージ（成功時は確認、失敗時は理由）。 */
  message: string;
}

/**
 * RetrieveEmailSendingHistoryByDateRangeInput
 */
export interface RetrieveEmailSendingHistoryByDateRangeInput {
  /** 検索対象期間の開始日時。 */
  startDateTime: Date;
  /** 検索対象期間の終了日時。 */
  endDateTime: Date;
  /** メールタイプでフィルタリングする場合の対象タイプ一覧。 */
  emailTypeFilter?: ('daily_report_submission' | 'non_submission_prompt' | 'reminder_notification' | 'user_information_approval')[];
  /** 送信ステータスでフィルタリングする場合の対象ステータス一覧。 */
  sendingStatusFilter?: ('success' | 'failure' | 'pending')[];
  /** 特定ユーザーのメール送信履歴に限定する場合のユーザーID。 */
  userIdFilter?: string;
  /** ページネーション用のページ番号（デフォルト: 1）。 */
  pageNumber?: number;
  /** 1ページあたりの件数（デフォルト: 50、最大: 500）。 */
  pageSize?: number;
}

/**
 * RetrieveEmailSendingHistoryByDateRangeOutput
 */
export interface RetrieveEmailSendingHistoryByDateRangeOutput {
  /** 検索処理の成功可否。 */
  success: boolean;
  /** 検索条件に合致したメール送信履歴レコード一覧。 */
  emailSendingHistories: Array<{emailSendingHistoryId: string; userId: string; emailType: 'daily_report_submission' | 'non_submission_prompt' | 'reminder_notification' | 'user_information_approval'; recipientEmailAddress: string; subject: string; body: string; sentDateTime: Date; sendingStatus: 'success' | 'failure' | 'pending'; errorMessage: string | null; relatedDailyReportId: string | null; relatedReminderSettingId: string | null; resendFlag: boolean; createdAt: Date}>;
  /** 検索条件に合致した全メール送信履歴の総件数。 */
  totalCount: number;
  /** 返却されたページ番号。 */
  pageNumber: number;
  /** 返却されたページサイズ。 */
  pageSize: number;
  /** 処理結果に関する補足メッセージ。 */
  message?: string | undefined;
}
