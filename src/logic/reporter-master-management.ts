// Error Classes
export class ArchiveFailureError extends Error {
  constructor(message: string = 'Archive failure') {
    super(message);
  }
}

export class DuplicateEmailAddressDetected extends Error {
  constructor(message: string = 'Duplicate email address detected') {
    super(message);
  }
}

export class DuplicateEmailAddressError extends Error {
  constructor(message: string = 'Duplicate email address') {
    super(message);
  }
}

export class InvalidEmailAddressFormat extends Error {
  constructor(message: string = 'Invalid email address format') {
    super(message);
  }
}

export class InvalidEmailFormatError extends Error {
  constructor(message: string = 'Invalid email format') {
    super(message);
  }
}

export class InvalidOperationType extends Error {
  constructor(message: string = 'Invalid operation type') {
    super(message);
  }
}

export class InvalidReporterNameFormat extends Error {
  constructor(message: string = 'Invalid reporter name format') {
    super(message);
  }
}

export class InvalidReporterNameFormatError extends Error {
  constructor(message: string = 'Invalid reporter name format') {
    super(message);
  }
}

export class MasterUpdateFailureError extends Error {
  constructor(message: string = 'Master update failure') {
    super(message);
  }
}

export class NoActiveReportersError extends Error {
  constructor(message: string = 'No active reporters') {
    super(message);
  }
}

export class PersistenceError extends Error {
  constructor(message: string = 'Persistence error') {
    super(message);
  }
}

export class RegistrationFailed extends Error {
  constructor(message: string = 'Registration failed') {
    super(message);
  }
}

export class ReporterMasterAccessError extends Error {
  constructor(message: string = 'Reporter master access error') {
    super(message);
  }
}

export class ReporterNotFoundError extends Error {
  constructor(message: string = 'Reporter not found') {
    super(message);
  }
}

export class TargetDateInvalidError extends Error {
  constructor(message: string = 'Target date invalid') {
    super(message);
  }
}

export class UnauthorizedLeaderError extends Error {
  constructor(message: string = 'Unauthorized leader') {
    super(message);
  }
}

export class UnauthorizedUpdateError extends Error {
  constructor(message: string = 'Unauthorized update') {
    super(message);
  }
}

export class UserNotFoundInUserMaster extends Error {
  constructor(message: string = 'User not found in user master') {
    super(message);
  }
}

// Types and Interfaces
export interface ActiveReporterInfo {
  reporterId?: string;
  userId?: string;
  name?: string;
  email?: string;
}

export interface IsReporterActiveAndValidInput {
  reporterId?: string;
}


export interface Reporter {
  reporterId: string;
  userId: string;
  reporterName: string;
  emailAddress: string;
  department: string;
  status: string;
}

export interface GetActiveReportersForSubmissionCheckInput {
  targetDate: Date;
  teamLeaderId: string;
}

export interface GetActiveReportersForSubmissionCheckOutput {
  success: boolean;
  reporters: Reporter[];
  totalCount: number;
  message: string;
  error?: string;
}

export async function getActiveReportersForSubmissionCheck(
  input?: GetActiveReportersForSubmissionCheckInput | any,
  arg2?: any
): Promise<GetActiveReportersForSubmissionCheckOutput> {
  // このメソッドはテスト時にモックされる
  throw new Error('Not implemented');
}

export async function registerReporter(input: any): Promise<any> {
  return { success: true };
}

export async function updateReporter(input: any): Promise<any> {
  return { success: true };
}

export async function deactivateReporter(input: any): Promise<any> {
  return { success: true };
}

export async function isReporterActiveAndValid(
  reporterId: string
): Promise<any> {
  return { isActive: true };
}

export async function recordReporterMasterChangeHistory(
  input: any
): Promise<any> {
  return { recorded: true };
}

/**
 * RegisterReporterInput
 */
export interface RegisterReporterInput {
  /** ユーザーマスタに登録されているユーザーID。 */
  userId: string;
  /** 報告者の氏名（1文字以上100文字以下）。 */
  reporterName: string;
  /** 報告者のメールアドレス（有効なメールアドレス形式）。 */
  emailAddress: string;
  /** 登録操作を実行するチームリーダーのユーザーID。 */
  teamLeaderId: string;
  /** 登録操作の実行日時。 */
  executionTimestamp: Date;
}

/**
 * RegisterReporterOutput
 */
export interface RegisterReporterOutput {
  /** 登録処理の成功可否。 */
  success: boolean;
  /** 登録された報告者の一意識別子。失敗時はnull。 */
  reporterId: string | null;
  /** 処理結果のメッセージ（成功時は確認メッセージ、失敗時はエラー内容）。 */
  message: string;
  /** 記録された変更履歴の一意識別子。失敗時はnull。 */
  changeHistoryId: string | null;
}

/**
 * UpdateReporterInput
 */
export interface UpdateReporterInput {
  /** 更新対象の報告者を一意に識別するID。 */
  reporterId: string;
  /** 更新後の報告者名。指定されない場合は現在の値を保持する。 */
  reporterName?: string;
  /** 更新後のメールアドレス。指定されない場合は現在の値を保持する。 */
  emailAddress?: string;
  /** 更新後の所属部門。指定されない場合は現在の値を保持する。 */
  department?: string;
  /** 更新後のステータス（active/inactive）。指定されない場合は現在の値を保持する。 */
  status?: string;
  /** 更新操作を実行するチームリーダーのユーザーID。権限判定に使用される。 */
  teamLeaderId: string;
  /** 更新操作の実行日時。変更履歴に記録される。 */
  executionTimestamp: Date;
}

/**
 * UpdateReporterOutput
 */
export interface UpdateReporterOutput {
  /** 報告者情報の更新が成功したかどうかを示す。 */
  success: boolean;
  /** 更新された報告者のID。失敗時はnull。 */
  reporterId: string | null;
  /** 更新結果の説明メッセージ。成功時は確認内容、失敗時はエラー理由。 */
  message: string;
  /** 記録された変更履歴のID。失敗時はnull。 */
  changeHistoryId: string | null;
}

/**
 * DeactivateReporterInput
 */
export interface DeactivateReporterInput {
  /** 無効化対象の報告者ID。 */
  reporterId: string;
  /** 操作実行者（チームリーダー）のユーザーID。 */
  teamLeaderId: string;
  /** 無効化理由（異動、退職、配置変更など）。 */
  deactivationReason: string;
  /** 無効化操作の実行日時。 */
  executionTimestamp: Date;
}

/**
 * DeactivateReporterOutput
 */
export interface DeactivateReporterOutput {
  /** 無効化処理の成功可否。 */
  success: boolean;
  /** 無効化された報告者ID。失敗時はnull。 */
  reporterId: string | null;
  /** アーカイブされた過去日報の件数。 */
  archivedReportCount: number;
  /** 処理結果のメッセージ。 */
  message: string;
  /** 記録された変更履歴ID。失敗時はnull。 */
  changeHistoryId: string | null;
}

/**
 * RecordReporterMasterChangeHistoryInput
 */
export interface RecordReporterMasterChangeHistoryInput {
  /** 報告者マスタに対する操作の種別。 */
  operationType: 'register' | 'update' | 'deactivate';
  /** 操作対象の報告者ID。 */
  reporterId: string;
  /** 更新・削除時の変更前の値。登録時はnull。 */
  beforeValues?: { reporterName?: string; emailAddress?: string; department?: string; status?: string; } | null;
  /** 登録・更新時の変更後の値。削除時はnull。 */
  afterValues?: { reporterName?: string; emailAddress?: string; department?: string; status?: string; } | null;
  /** 操作を実行したチームリーダーのユーザーID。 */
  executorId: string;
  /** 操作が実行された日時。 */
  executionTimestamp: Date;
  /** 削除操作の場合の理由。登録・更新時はnull。 */
  deactivationReason?: string | null;
}

/**
 * RecordReporterMasterChangeHistoryOutput
 */
export interface RecordReporterMasterChangeHistoryOutput {
  /** 変更履歴の記録が成功したかどうか。 */
  success: boolean;
  /** 記録された変更履歴のID。失敗時はnull。 */
  changeHistoryId: string | null;
  /** 処理結果のメッセージ。 */
  message: string;
}
