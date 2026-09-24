// Error Classes
export class ApprovalDeadlineExceededError extends Error {
  constructor(message: string = 'Approval deadline exceeded') {
    super(message);
  }
}

export class ApprovalNotificationSendFailureError extends Error {
  constructor(message: string = 'Approval notification send failure') {
    super(message);
  }
}

export class DataRetrievalError extends Error {
  constructor(message: string = 'Data retrieval error') {
    super(message);
  }
}

export class DuplicateEmailAddressDetectedError extends Error {
  constructor(message: string = 'Duplicate email address detected') {
    super(message);
  }
}

export class InvalidApprovalDecisionError extends Error {
  constructor(message: string = 'Invalid approval decision') {
    super(message);
  }
}

export class InvalidUserInformationFormatError extends Error {
  constructor(message: string = 'Invalid user information format') {
    super(message);
  }
}

export class LeaderAuthorizationError extends Error {
  constructor(message: string = 'Leader authorization error') {
    super(message);
  }
}

export class MissingRequiredField extends Error {
  constructor(message: string = 'Missing required field') {
    super(message);
  }
}

export class ReporterNotAuthenticatedError extends Error {
  constructor(message: string = 'Reporter not authenticated') {
    super(message);
  }
}

export class UserInformationNotFoundError extends Error {
  constructor(message: string = 'User information not found') {
    super(message);
  }
}

export class UserInformationSubmissionFailedError extends Error {
  constructor(message: string = 'User information submission failed') {
    super(message);
  }
}

// Types and Interfaces
export interface ConfirmAndApproveUserInformationInput {
  userId?: string;
  approvalDecision?: string;
}

export interface ConfirmAndApproveUserInformationOutput {
  confirmed: boolean;
  approvalTimestamp?: string;
}

export interface RetrieveUserInformationConfirmationStatusInput {
  userId?: string;
}

export interface RetrieveUserInformationConfirmationStatusOutput {
  status: string;
  submittedAt?: string;
  approvedAt?: string;
}


export interface ConfirmResult {
  confirmed: boolean;
}

export async function confirmUserInformation(
  userId: string,
  userInfo: any
): Promise<ConfirmResult> {
  return { confirmed: true };
}

export async function submitUserInformationForConfirmation(
  input: any
): Promise<any> {
  return { success: true };
}

export async function confirmAndApproveUserInformation(
  input: any
): Promise<any> {
  return { confirmed: true };
}

export async function retrieveUserInformationConfirmationStatus(
  userId: string
): Promise<any> {
  return { status: 'pending' };
}

export async function validateUserInformationInputFormat(
  input: any
): Promise<any> {
  return { valid: true };
}

export async function detectDuplicateUserEmail(
  email: string
): Promise<any> {
  return { isDuplicate: false };
}

export async function judgeUserInformationApprovalDeadlineExceeded(
  submissionDate: string,
  deadline: string
): Promise<any> {
  return { exceeded: false };
}

export async function prepareUserInformationForApprovalNotification(
  input: any
): Promise<any> {
  return { prepared: true };
}

export async function buildUserInformationConfirmationStatusList(
  input: any
): Promise<any> {
  return { list: [] };
}

/**
 * SubmitUserInformationForConfirmationInput
 */
export interface SubmitUserInformationForConfirmationInput {
  /** ユーザー情報を送信する報告者のユーザーID。 */
  reporterId: string;
  /** 登録対象のユーザー名。 */
  userName: string;
  /** 登録対象のメールアドレス。 */
  emailAddress: string;
  /** 登録対象の氏名。 */
  fullName: string;
  /** 登録対象の部門。 */
  department: string;
  /** ユーザー情報が送信された日時。 */
  submissionTimestamp: Date;
}

/**
 * SubmitUserInformationForConfirmationOutput
 */
export interface SubmitUserInformationForConfirmationOutput {
  /** ユーザー情報の送信が成功したかどうか。 */
  success: boolean;
  /** 送信されたユーザー情報に割り当てられた一意のID。失敗時はnull。 */
  userInformationId: string | null;
  /** ユーザー情報の確認状態。通常は'pending_approval'。 */
  confirmationStatus: string;
  /** チームリーダーへの通知が送信されたかどうか。 */
  leaderNotificationSent: boolean;
  /** チームリーダーによる承認期限。 */
  approvalDeadline: Date;
}

/**
 * UserInformationConfirmationRecord
 */
export interface UserInformationConfirmationRecord {
  /** ユーザー情報確認レコードの一意識別子。 */
  userInformationId: string;
  /** 報告者のユーザーID。 */
  reporterId: string;
  /** 報告者の入力ユーザー名。 */
  reporterName: string;
  /** 報告者の入力メールアドレス。 */
  emailAddress: string;
  /** 報告者の入力氏名。 */
  fullName: string;
  /** 報告者の入力部門。 */
  department: string;
  /** ユーザー情報の送信日時。 */
  submissionTimestamp: Date;
  /** ユーザー情報の確認状態。 */
  confirmationStatus: 'pending' | 'approved' | 'rejected' | 'expired';
  /** チームリーダーによる承認期限。 */
  approvalDeadline: Date;
  /** 却下された場合の却下理由。 */
  rejectionReason?: string | null;
}

/**
 * BuildUserInformationConfirmationStatusListInput
 */
export interface BuildUserInformationConfirmationStatusListInput {
  /** 全ユーザー情報確認レコード。 */
  allUserInformationRecords: ReadonlyArray<UserInformationRecord>;
  /** 現在の日時。 */
  currentTimestamp: Date;
}

/**
 * UserInformationRecord
 */
export interface UserInformationRecord {
  /** ユーザー情報確認レコードの一意識別子。 */
  userInformationId: string;
  /** 報告者のユーザーID。 */
  reporterId: string;
  /** 報告者の入力ユーザー名。 */
  reporterName: string;
  /** 報告者の入力メールアドレス。 */
  emailAddress: string;
  /** 報告者の入力氏名。 */
  fullName: string;
  /** 報告者の入力部門。 */
  department: string;
  /** ユーザー情報の送信日時。 */
  submissionTimestamp: Date;
  /** ユーザー情報の確認状態。 */
  confirmationStatus: 'pending' | 'approved' | 'rejected';
  /** チームリーダーによる承認期限。 */
  approvalDeadline: Date;
  /** 却下された場合の却下理由。 */
  rejectionReason?: string | null;
}

/**
 * BuildUserInformationConfirmationStatusListOutput
 */
export interface BuildUserInformationConfirmationStatusListOutput {
  /** 未承認のユーザー情報一覧。 */
  pendingApprovals: ReadonlyArray<UserInformationConfirmationRecord>;
  /** 承認済みのユーザー情報一覧。 */
  approvedRecords: ReadonlyArray<UserInformationConfirmationRecord>;
  /** 承認期限超過のユーザー情報一覧。 */
  expiredApprovals: ReadonlyArray<UserInformationConfirmationRecord>;
}

/**
 * ValidateUserInformationInputFormatInput
 */
export interface ValidateUserInformationInputFormatInput {
  /** 報告者が入力した名前。 */
  reporterName: string | null | undefined;
  /** 報告者が入力したメールアドレス。 */
  emailAddress: string | null | undefined;
}

/**
 * ValidateUserInformationInputFormatOutput
 */
export interface ValidateUserInformationInputFormatOutput {
  /** 入力形式が検証ルールに合致したかどうか。 */
  isValid: boolean;
  /** 検出された検証エラーの一覧。isValid が false の場合は1件以上のエラーを含む。 */
  errors: ReadonlyArray<{name: string; message: string}>;
}

/**
 * DetectDuplicateUserEmailInput
 */
export interface DetectDuplicateUserEmailInput {
  /** 重複判定対象のメールアドレス。 */
  emailAddress: string;
  /** 重複判定を実行する時点。 */
  checkTimestamp: Date;
  /** 重複判定から除外するユーザー情報ID（同一ユーザーの更新時に自身を除外するため）。 */
  excludeUserInformationId?: string | null | undefined;
}

/**
 * DetectDuplicateUserEmailOutput
 */
export interface DetectDuplicateUserEmailOutput {
  /** メールアドレスが重複しているかどうか。 */
  isDuplicate: boolean;
  /** 重複が検出された場合、該当する報告者のユーザーID。重複がない場合はnull。 */
  duplicateReporterUserId: string | null;
  /** 重複が検出された場合、該当する報告者の名前。重複がない場合はnull。 */
  duplicateReporterName: string | null;
}

/**
 * JudgeUserInformationApprovalDeadlineExceededInput
 */
export interface JudgeUserInformationApprovalDeadlineExceededInput {
  /** ユーザー情報の承認期限。 */
  approvalDeadline: Date;
  /** 期限判定の基準となる現在時刻。 */
  currentTimestamp: Date;
}

/**
 * JudgeUserInformationApprovalDeadlineExceededOutput
 */
export interface JudgeUserInformationApprovalDeadlineExceededOutput {
  /** 承認期限を超過しているかどうか。 */
  isDeadlineExceeded: boolean;
  /** 期限超過の場合、超過日数（負の値は期限までの残日数）。 */
  daysOverdue: number | null;
}

/**
 * PrepareUserInformationForApprovalNotificationInput
 */
export interface PrepareUserInformationForApprovalNotificationInput {
  /** ユーザー情報の一意識別子。 */
  userInformationId: string;
  /** 報告者の名前。 */
  reporterName: string;
  /** 報告者のメールアドレス。 */
  emailAddress: string;
  /** 報告者の正式名称。 */
  fullName: string;
  /** 報告者の所属部門。 */
  department: string;
  /** チームリーダーのメールアドレス。 */
  leaderEmailAddress: string;
  /** ユーザー情報が送信された日時。 */
  submissionTimestamp: Date;
  /** チームリーダーによる承認期限。 */
  approvalDeadline: Date;
}

/**
 * PrepareUserInformationForApprovalNotificationOutput
 */
export interface PrepareUserInformationForApprovalNotificationOutput {
  /** 通知層へ渡すユーザー情報承認通知の内容。 */
  notificationContent: UserInformationApprovalNotificationContent;
  /** 通知の送信先メールアドレス（チームリーダー）。 */
  recipientEmailAddress: string;
  /** 通知内容が整形された日時。 */
  notificationPreparedTimestamp: Date;
}

/**
 * UserInformationApprovalNotificationContent
 */
export interface UserInformationApprovalNotificationContent {
  /** ユーザー情報の一意識別子。 */
  userInformationId: string;
  /** 報告者の名前。 */
  reporterName: string;
  /** 報告者のメールアドレス。 */
  emailAddress: string;
  /** 報告者の正式名称。 */
  fullName: string;
  /** 報告者の所属部門。 */
  department: string;
  /** ユーザー情報が送信された日時。 */
  submissionTimestamp: Date;
  /** チームリーダーによる承認期限。 */
  approvalDeadline: Date;
  /** 通知メールの件名。 */
  notificationSubject: string;
  /** 通知メールの本文。 */
  notificationBody: string;
}
