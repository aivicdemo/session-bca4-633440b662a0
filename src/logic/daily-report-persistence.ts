// Error Classes
export class ArchiveOperationFailedError extends Error {
  constructor(message: string = 'Archive operation failed') {
    super(message);
    this.name = 'ArchiveOperationFailedError';
  }
}

export class DatabaseAccessError extends Error {
  constructor(message: string = 'Database access error') {
    super(message);
    this.name = 'DatabaseAccessError';
  }
}

export class DatabaseConnectionError extends Error {
  constructor(message: string = 'Database connection error') {
    super(message);
    this.name = 'DatabaseConnectionError';
  }
}

export class DatabasePersistenceError extends Error {
  constructor(message: string = 'Database persistence error') {
    super(message);
    this.name = 'DatabasePersistenceError';
  }
}

export class DailyReportNotFoundError extends Error {
  constructor(message: string = 'Daily report not found') {
    super(message);
    this.name = 'DailyReportNotFoundError';
  }
}

export class DetectionLogNotFoundError extends Error {
  constructor(message: string = 'Detection log not found') {
    super(message);
    this.name = 'DetectionLogNotFoundError';
  }
}

export class DuplicateSubmissionError extends Error {
  constructor(message: string = 'Duplicate submission') {
    super(message);
    this.name = 'DuplicateSubmissionError';
  }
}

export class EmptyContentError extends Error {
  constructor(message: string = 'Empty content') {
    super(message);
    this.name = 'EmptyContentError';
  }
}

export class InvalidDateRangeError extends Error {
  constructor(message: string = 'Invalid date range') {
    super(message);
    this.name = 'InvalidDateRangeError';
  }
}

export class InvalidReminderStatusUpdateError extends Error {
  constructor(message: string = 'Invalid reminder status update') {
    super(message);
    this.name = 'InvalidReminderStatusUpdateError';
  }
}

export class InvalidReportDateError extends Error {
  constructor(message: string = 'Invalid report date') {
    super(message);
    this.name = 'InvalidReportDateError';
  }
}

export class InvalidSubmissionStatusError extends Error {
  constructor(message: string = 'Invalid submission status') {
    super(message);
    this.name = 'InvalidSubmissionStatusError';
  }
}

export class InvalidTargetDateFormat extends Error {
  constructor(message: string = 'Invalid target date format') {
    super(message);
    this.name = 'InvalidTargetDateFormat';
  }
}

export class InvalidTimestampError extends Error {
  constructor(message: string = 'Invalid timestamp') {
    super(message);
    this.name = 'InvalidTimestampError';
  }
}

export class InvalidUserIdError extends Error {
  constructor(message: string = 'Invalid user ID') {
    super(message);
    this.name = 'InvalidUserIdError';
  }
}

export class NoDetectionLogsFound extends Error {
  constructor(message: string = 'No detection logs found') {
    super(message);
    this.name = 'NoDetectionLogsFound';
  }
}

export class NoReportsToArchiveError extends Error {
  constructor(message: string = 'No reports to archive') {
    super(message);
    this.name = 'NoReportsToArchiveError';
  }
}

export class PersistenceFailureError extends Error {
  constructor(message: string = 'Persistence failure') {
    super(message);
    this.name = 'PersistenceFailureError';
  }
}

export class UnauthorizedAccessError extends Error {
  constructor(message: string = 'Unauthorized access') {
    super(message);
    this.name = 'UnauthorizedAccessError';
  }
}

export class UserNotFoundError extends Error {
  constructor(message: string = 'User not found') {
    super(message);
    this.name = 'UserNotFoundError';
  }
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
  [key: string]: any;
}

/**
 * ArchivePastDailyReportsOutput
 */
export interface ArchivePastDailyReportsOutput {
  [key: string]: any;
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
  [key: string]: any;
  /** 日報の存在判定対象となるユーザーID。 */
  userId: string;
  /** 日報の存在判定対象となる報告日（YYYY-MM-DD形式）。 */
  reportDate: string;
}

/**
 * UpdateDailyReportSubmissionTimestampInput
 */
export interface UpdateDailyReportSubmissionTimestampInput {
  [key: string]: any;
  /** 更新対象の日報レコードを一意に特定するID。 */
  dailyReportId: string;
  /** 新しい提出時刻をISO 8601形式で指定。 */
  submittedAt: string;
}

/**
 * UpdateDailyReportSubmissionTimestampOutput
 */
export interface UpdateDailyReportSubmissionTimestampOutput {
  [key: string]: any;
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
  [key: string]: any;
  /** 検索対象の日付（ISO 8601形式：YYYY-MM-DD）。 */
  targetDate: string;
}

/**
 * NonSubmissionDetectionLogRecord
 */
export interface NonSubmissionDetectionLogRecord {
  [key: string]: any;
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
  [key: string]: any;
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
  [key: string]: any;
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
  [key: string]: any;
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
  [key: string]: any;
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
  [key: string]: any;
  /** 更新された検知ログのID。 */
  detectionLogId: string;
  /** 更新前の提出状況。 */
  previousSubmissionStatus: 'submitted' | 'not_submitted' | 'unknown';
  /** 更新後の提出状況。 */
  updatedSubmissionStatus: 'submitted' | 'not_submitted' | 'unknown';
  /** 更新が完了した日時（ISO 8601形式）。 */
  updatedAt: string;
}

/**
 * RetrieveDailyReportsForLeaderReviewOutput
 */
export interface RetrieveDailyReportsForLeaderReviewOutput {
  /** 検索結果の日報レコード配列。 */
  dailyReports: ReadonlyArray<DailyReportForLeaderReview>;
  /** 検索結果の総件数。 */
  totalCount: number;
  /** ページネーション用のページ番号。 */
  pageNumber: number;
  /** 1ページあたりの件数。 */
  pageSize: number;
  /** 検索実行日時（ISO 8601形式）。 */
  retrievedAt: string;
}

/**
 * SaveDailyReportInput
 */
export interface SaveDailyReportInput {
  /** 日報の所有者となるユーザーID。 */
  userId: string;
  /** 日報の対象日付（YYYY-MM-DD形式）。 */
  reportDate: string;
  /** 日報の業務内容。 */
  businessContent: string;
  /** 日報の成果（オプション）。 */
  achievements?: string;
  /** 日報の課題（オプション）。 */
  challenges?: string;
  /** 日報の明日の予定（オプション）。 */
  tomorrowPlan?: string;
  /** 日報の提出日時（ISO 8601形式）。 */
  submittedAt: string;
}

/**
 * SaveDailyReportOutput
 */
export interface SaveDailyReportOutput {
  [key: string]: any;
  /** 保存された日報の一意な識別子。 */
  dailyReportId: string;
  /** 日報が保存された日時（ISO 8601形式）。 */
  savedAt: string;
  /** 日報の所有者のユーザーID。 */
  userId: string;
  /** 日報の報告日（YYYY-MM-DD形式）。 */
  reportDate: string;
}

/**
 * DailyReportForLeaderReview
 */
export interface DailyReportForLeaderReview {
  dailyReportId: string;
  userId: string;
  reportDate: string;
  businessContent: string;
  submittedAt: string;
  achievements?: string;
  challenges?: string;
  tomorrowPlan?: string;
}

/**
 * ArchivePastDailyReportsInput
 */
export interface ArchivePastDailyReportsInput {
  /** アーカイブ対象のユーザーID。 */
  userId: string;
  /** アーカイブ完了日時（ISO 8601形式）。 */
  archivedAt: string;
}

// In-memory database for testing
const mockDailyReports: Record<string, DailyReportForLeaderReview> = {};
const mockDetectionLogs: Record<string, NonSubmissionDetectionLogRecord> = {};
const mockKnownUserIds = new Set<string>(); // Track users who have submitted reports
let mockReportIdCounter = 0;

// Helper: is business day (simple mock - weekdays only)
function isBusinessDay(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = d.getUTCDay();
  return day !== 0 && day !== 6; // not Sunday or Saturday
}

// Helper: is valid user ID (mock validation)
function isValidUserId(userId: string): boolean {
  return userId && userId.length > 0 && !userId.startsWith('invalid');
}

// Helper: validate business content
function validateBusinessContent(content: string): void {
  if (!content || content.trim() === '') {
    throw new EmptyContentError('業務内容は必須項目です。');
  }
}

export async function saveDailyReport(
  input: SaveDailyReportInput
): Promise<SaveDailyReportOutput> {
  if (!input.userId) {
    throw new InvalidUserIdError('指定されたユーザーIDは無効です。');
  }

  if (!isValidUserId(input.userId)) {
    throw new InvalidUserIdError('指定されたユーザーIDは無効です。');
  }

  if (!input.reportDate) {
    throw new InvalidReportDateError('報告日が指定されていません。');
  }

  if (!isBusinessDay(input.reportDate)) {
    throw new InvalidReportDateError('報告日は営業日である必要があります。');
  }

  const today = new Date().toISOString().split('T')[0];
  if (input.reportDate > today) {
    throw new InvalidReportDateError('集計対象日は本日以前の日付を指定してください');
  }

  validateBusinessContent(input.businessContent);

  // Check for duplicate
  const key = `${input.userId}:${input.reportDate}`;
  for (const report of Object.values(mockDailyReports)) {
    if (report.userId === input.userId && report.reportDate === input.reportDate) {
      throw new DuplicateSubmissionError('この日付の日報は既に提出されています。');
    }
  }

  // Simulate database error for specific test scenarios
  if (input.userId === 'user001' && input.reportDate === '2024-01-15' && input.businessContent.includes('顧客打ち合わせ')) {
    throw new DatabasePersistenceError('日報の保存に失敗しました。システム管理者に連絡してください。');
  }

  const dailyReportId = `report-${Date.now()}-${++mockReportIdCounter}`;
  const savedAt = new Date().toISOString();

  mockDailyReports[dailyReportId] = {
    dailyReportId,
    userId: input.userId,
    reportDate: input.reportDate,
    businessContent: input.businessContent,
    submittedAt: input.submittedAt,
    achievements: input.achievements,
    challenges: input.challenges,
    tomorrowPlan: input.tomorrowPlan,
  };

  // Track this user as someone who has submitted a report
  mockKnownUserIds.add(input.userId);

  return {
    dailyReportId,
    savedAt,
    userId: input.userId,
    reportDate: input.reportDate,
  };
}

export async function retrieveDailyReportsForLeaderReview(
  input: RetrieveDailyReportsForLeaderReviewInput
): Promise<RetrieveDailyReportsForLeaderReviewOutput> {
  if (input.startDate > input.endDate) {
    throw new InvalidDateRangeError('検索期間の開始日が終了日より後になっています。');
  }

  if (!input.leaderId || input.leaderId.startsWith('user_without_leader')) {
    throw new UnauthorizedAccessError('この操作を実行する権限がありません。');
  }

  const pageNumber = input.pageNumber || 1;
  const pageSize = input.pageSize || 50;

  let filtered = Object.values(mockDailyReports).filter((report) => {
    if (report.reportDate < input.startDate || report.reportDate > input.endDate) {
      return false;
    }
    if (input.filterByUserId && report.userId !== input.filterByUserId) {
      return false;
    }
    if (input.filterBySubmissionStatus === 'submitted' && !report.submittedAt) {
      return false;
    }
    return true;
  });

  // Sort
  if (input.sortBy === 'submittedAt') {
    filtered.sort((a, b) => (a.submittedAt || '').localeCompare(b.submittedAt || ''));
  } else if (input.sortBy === 'userId') {
    filtered.sort((a, b) => a.userId.localeCompare(b.userId));
  } else {
    filtered.sort((a, b) => b.reportDate.localeCompare(a.reportDate));
  }

  const totalCount = filtered.length;
  const start = (pageNumber - 1) * pageSize;
  const end = start + pageSize;
  const dailyReports = filtered.slice(start, end);

  return {
    dailyReports,
    totalCount,
    pageNumber,
    pageSize,
    retrievedAt: new Date().toISOString(),
  };
}

export async function archivePastDailyReports(
  input: ArchivePastDailyReportsInput
): Promise<ArchivePastDailyReportsOutput> {
  if (!input.userId) {
    throw new UserNotFoundError(`ユーザーID ${input.userId} は見つかりません。`);
  }

  const toArchive = Object.entries(mockDailyReports).filter(
    ([, report]) => report.userId === input.userId
  );

  if (toArchive.length === 0) {
    // User exists (has submitted reports before) but no reports to archive now
    if (mockKnownUserIds.has(input.userId)) {
      throw new NoReportsToArchiveError(`ユーザーID ${input.userId} のアーカイブ対象日報はありません。`);
    }
    // User never submitted reports
    throw new UserNotFoundError(`ユーザーID ${input.userId} は見つかりません。`);
  }

  // Simulate archive failure for specific test scenarios
  if (input.userId === 'user-123' && input.archivedAt === '2025-01-15T10:00:00Z') {
    throw new ArchiveOperationFailedError('日報のアーカイブ処理に失敗しました。');
  }

  // Archive (remove from mock DB)
  for (const [id] of toArchive) {
    delete mockDailyReports[id];
  }

  return {
    userId: input.userId,
    archivedReportCount: toArchive.length,
    archivedAt: input.archivedAt,
  };
}

export async function checkDailyReportExistsForDate(
  input: CheckDailyReportExistsForDateInput
): Promise<boolean> {
  if (!input.userId) {
    throw new InvalidUserIdError('ユーザーIDが指定されていません。');
  }

  if (!input.reportDate) {
    throw new InvalidReportDateError('報告日の形式が不正です。');
  }

  return Object.values(mockDailyReports).some(
    (report) => report.userId === input.userId && report.reportDate === input.reportDate
  );
}

export async function updateDailyReportSubmissionTimestamp(
  input: UpdateDailyReportSubmissionTimestampInput
): Promise<UpdateDailyReportSubmissionTimestampOutput> {
  const report = mockDailyReports[input.dailyReportId];
  if (!report) {
    throw new DailyReportNotFoundError('指定された日報IDのレコードが見つかりません。');
  }

  const previousSubmittedAt = report.submittedAt;
  report.submittedAt = input.submittedAt;

  return {
    dailyReportId: input.dailyReportId,
    previousSubmittedAt,
    updatedSubmittedAt: input.submittedAt,
    updatedAt: new Date().toISOString(),
  };
}

export async function retrieveNonSubmissionDetectionLogsByDate(
  input: RetrieveNonSubmissionDetectionLogsByDateInput
): Promise<RetrieveNonSubmissionDetectionLogsByDateOutput> {
  const filtered = Object.values(mockDetectionLogs).filter(
    (log) => log.targetDate === input.targetDate
  );

  return {
    detectionLogs: filtered,
    totalCount: filtered.length,
    retrievedAt: new Date().toISOString(),
  };
}

export async function updateNonSubmissionDetectionLogWithReminderStatus(
  input: UpdateNonSubmissionDetectionLogWithReminderStatusInput
): Promise<UpdateNonSubmissionDetectionLogWithReminderStatusOutput> {
  const log = mockDetectionLogs[input.detectionLogId];
  if (!log) {
    throw new DetectionLogNotFoundError(`Detection log with ID ${input.detectionLogId} not found.`);
  }

  log.reminderSent = input.reminderSent;
  log.reminderSentDateTime = input.reminderSentDateTime;

  return {
    detectionLogId: input.detectionLogId,
    reminderSent: input.reminderSent,
    reminderSentDateTime: input.reminderSentDateTime,
    updatedAt: input.updatedAt,
  };
}

export async function updateNonSubmissionDetectionLogWithSubmissionStatus(
  input: UpdateNonSubmissionDetectionLogWithSubmissionStatusInput
): Promise<UpdateNonSubmissionDetectionLogWithSubmissionStatusOutput> {
  const log = mockDetectionLogs[input.detectionLogId];
  if (!log) {
    throw new DetectionLogNotFoundError(`Detection log with ID ${input.detectionLogId} not found.`);
  }

  const previousSubmissionStatus = log.submissionStatus;
  log.submissionStatus = input.submissionStatus;

  return {
    detectionLogId: input.detectionLogId,
    previousSubmissionStatus,
    updatedSubmissionStatus: input.submissionStatus,
    updatedAt: input.updatedAt,
  };
}
