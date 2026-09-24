// Error Classes
export class ArchiveOperationFailedError extends Error {
  constructor(message: string = 'Archive operation failed') {
    super(message);
  }
}

export class DatabaseConnectionError extends Error {
  constructor(message: string = 'Database connection error') {
    super(message);
  }
}

export class DatabasePersistenceError extends Error {
  constructor(message: string = 'Database persistence error') {
    super(message);
  }
}

export class DuplicateSubmissionError extends Error {
  constructor(message: string = 'Duplicate submission') {
    super(message);
  }
}

export class EmptyContentError extends Error {
  constructor(message: string = 'Empty content') {
    super(message);
  }
}

export class InvalidDateRangeError extends Error {
  constructor(message: string = 'Invalid date range') {
    super(message);
  }
}

export class InvalidReportDateError extends Error {
  constructor(message: string = 'Invalid report date') {
    super(message);
  }
}

export class InvalidUserIdError extends Error {
  constructor(message: string = 'Invalid user ID') {
    super(message);
  }
}

export class NoReportsToArchiveError extends Error {
  constructor(message: string = 'No reports to archive') {
    super(message);
  }
}

export class UnauthorizedAccessError extends Error {
  constructor(message: string = 'Unauthorized access') {
    super(message);
  }
}

export class UserNotFoundError extends Error {
  constructor(message: string = 'User not found') {
    super(message);
  }
}

// Types and Interfaces
export interface ArchivePastDailyReportsInput {
  beforeDate?: string;
}

export interface SaveDailyReportInput {
  userId?: string;
  content?: string;
  date?: string;
}

export interface SaveDailyReportOutput {
  saved: boolean;
  reportId?: string;
}

export interface DailyReportForLeaderReview {
  id?: string;
  userId?: string;
  content?: string;
  submittedAt?: string;
}

export interface DailyReportRecord {
  userId: string;
  submissionTimestamp: string;
}

export interface RetrieveDailyReportsOutput {
  reports: DailyReportRecord[];
  count: number;
}

export async function retrieveDailyReportsForLeaderReview(
  targetDate: string,
  teamId: string
): Promise<RetrieveDailyReportsOutput> {
  return {
    reports: [],
    count: 0,
  };
}

export async function retrieveNonSubmissionDetectionLogsByDate(
  targetDate: string
): Promise<any> {
  return [];
}

export async function saveDailyReport(
  input: any
): Promise<any> {
  return { saved: true };
}

export async function archivePastDailyReports(
  input: any
): Promise<any> {
  return { archived: true };
}

export async function checkDailyReportExistsForDate(
  userId: string,
  date: string
): Promise<any> {
  return { exists: false };
}

export async function updateDailyReportSubmissionTimestamp(
  input: any
): Promise<any> {
  return { updated: true };
}

export async function updateNonSubmissionDetectionLogWithReminderStatus(
  input: any
): Promise<any> {
  return { updated: true };
}

export async function updateNonSubmissionDetectionLogWithSubmissionStatus(
  input: any
): Promise<any> {
  return { updated: true };
}

/**
 * RetrieveDailyReportsForLeaderReviewInput
 */
export interface RetrieveDailyReportsForLeaderReviewInput {
  /** 検索を実行するリーダーのユーザーID。 */
  leaderId: string;
  /** 検索対象期間の開始日（YYYY-MM-DD形式）。 */
  startDate: string;
  /** 検索対象期間の終了日（YYYY-MM-DD形式）。 */
  endDate: string;
  /** 特定のユーザーIDで絞り込む場合に指定。 */
  filterByUserId?: string | undefined;
  /** 提出状態でフィルター。'submitted'は提出済み、'all'は全件。 */
  filterBySubmissionStatus?: 'submitted' | 'all' | undefined;
  /** ソート対象フィールド。デフォルトは報告日の降順。 */
  sortBy?: 'reportDate' | 'submittedAt' | 'userId' | undefined;
  /** ページネーション用のページ番号（1から始まる）。 */
  pageNumber?: number | undefined;
  /** 1ページあたりの件数。デフォルトは50件。 */
  pageSize?: number | undefined;
}

/**
 * RetrieveDailyReportsForLeaderReviewOutput
 */
export interface RetrieveDailyReportsForLeaderReviewOutput {
  /** 検索条件に合致した日報レコードの配列。 */
  dailyReports: ReadonlyArray<DailyReportForLeaderReview>;
  /** フィルター条件に合致した全日報件数。 */
  totalCount: number;
  /** 返却されたページ番号。 */
  pageNumber: number;
  /** 返却されたページサイズ。 */
  pageSize: number;
  /** 検索実行時刻（ISO 8601形式）。 */
  retrievedAt: string;
}

/**
 * ArchivePastDailyReportsOutput
 */
export interface ArchivePastDailyReportsOutput {
  /** アーカイブ対象のユーザーID。 */
  userId: string;
  /** アーカイブされた日報レコード数。 */
  archivedReportCount: number;
  /** アーカイブ完了日時（ISO 8601形式）。 */
  archivedAt: string;
}

/**
 * CheckDailyReportExistsForDateInput
 */
export interface CheckDailyReportExistsForDateInput {
  /** 日報の存在判定対象となるユーザーID。 */
  userId: string;
  /** 日報の存在判定対象となる報告日（YYYY-MM-DD形式）。 */
  reportDate: string;
}

/**
 * UpdateDailyReportSubmissionTimestampInput
 */
export interface UpdateDailyReportSubmissionTimestampInput {
  /** 更新対象の日報レコードを一意に特定するID。 */
  dailyReportId: string;
  /** 新しい提出時刻をISO 8601形式で指定。 */
  submittedAt: string;
}

/**
 * UpdateDailyReportSubmissionTimestampOutput
 */
export interface UpdateDailyReportSubmissionTimestampOutput {
  /** 更新された日報レコードのID。 */
  dailyReportId: string;
  /** 更新前の提出時刻。 */
  previousSubmittedAt: string;
  /** 更新後の提出時刻。 */
  updatedSubmittedAt: string;
  /** 更新操作が完了した日時。 */
  updatedAt: string;
}

/**
 * RetrieveNonSubmissionDetectionLogsByDateInput
 */
export interface RetrieveNonSubmissionDetectionLogsByDateInput {
  /** 検索対象の日付（ISO 8601形式：YYYY-MM-DD）。 */
  targetDate: string;
}

/**
 * NonSubmissionDetectionLogRecord
 */
export interface NonSubmissionDetectionLogRecord {
  /** 検知ログの一意識別子。 */
  detectionLogId: string;
  /** 未提出者のユーザーID。 */
  userId: string;
  /** 検知対象の報告日（ISO 8601形式：YYYY-MM-DD）。 */
  targetDate: string;
  /** 検知が実行された日時（ISO 8601形式）。 */
  detectionDateTime: string;
  /** リマインダー通知が送信済みであるかを示すフラグ。 */
  reminderSent: boolean;
  /** リマインダー通知が送信された日時（ISO 8601形式）。送信されていない場合はnull。 */
  reminderSentDateTime?: string | null;
  /** 検知時点での提出状況。 */
  submissionStatus: 'not_submitted' | 'submitted' | 'unknown';
}

/**
 * RetrieveNonSubmissionDetectionLogsByDateOutput
 */
export interface RetrieveNonSubmissionDetectionLogsByDateOutput {
  /** 指定された対象日付に該当する検知ログレコードの配列。 */
  detectionLogs: ReadonlyArray<NonSubmissionDetectionLogRecord>;
  /** 検索結果の総件数。 */
  totalCount: number;
  /** 検索実行日時（ISO 8601形式）。 */
  retrievedAt: string;
}

/**
 * UpdateNonSubmissionDetectionLogWithReminderStatusInput
 */
export interface UpdateNonSubmissionDetectionLogWithReminderStatusInput {
  /** 更新対象の未提出者検知ログID。 */
  detectionLogId: string;
  /** リマインダー送信済みフラグ（true=送信済み、false=未送信）。 */
  reminderSent: boolean;
  /** リマインダー送信日時（ISO 8601形式）。reminderSentがtrueの場合は必須、falseの場合はnull。 */
  reminderSentDateTime?: string | null;
  /** ログレコード更新時刻（ISO 8601形式）。 */
  updatedAt: string;
}

/**
 * UpdateNonSubmissionDetectionLogWithReminderStatusOutput
 */
export interface UpdateNonSubmissionDetectionLogWithReminderStatusOutput {
  /** 更新されたログレコードのID。 */
  detectionLogId: string;
  /** 更新後のリマインダー送信済みフラグ。 */
  reminderSent: boolean;
  /** 更新後のリマインダー送信日時。 */
  reminderSentDateTime?: string | null;
  /** ログレコード更新完了時刻（ISO 8601形式）。 */
  updatedAt: string;
}

/**
 * UpdateNonSubmissionDetectionLogWithSubmissionStatusInput
 */
export interface UpdateNonSubmissionDetectionLogWithSubmissionStatusInput {
  /** 更新対象の未提出者検知ログを一意に識別するID。 */
  detectionLogId: string;
  /** 検知ログに記録する提出状況。'submitted'は提出完了、'not_submitted'は未提出、'unknown'は確認不可を示す。 */
  submissionStatus: 'submitted' | 'not_submitted' | 'unknown';
  /** 提出状況を更新した日時（ISO 8601形式）。 */
  updatedAt: string;
}

/**
 * UpdateNonSubmissionDetectionLogWithSubmissionStatusOutput
 */
export interface UpdateNonSubmissionDetectionLogWithSubmissionStatusOutput {
  /** 更新された検知ログのID。 */
  detectionLogId: string;
  /** 更新前の提出状況。 */
  previousSubmissionStatus: 'submitted' | 'not_submitted' | 'unknown';
  /** 更新後の提出状況。 */
  updatedSubmissionStatus: 'submitted' | 'not_submitted' | 'unknown';
  /** 更新が完了した日時（ISO 8601形式）。 */
  updatedAt: string;
}
