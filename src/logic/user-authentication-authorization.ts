// Error Classes
export class UserNotAuthenticatedException extends Error {
  constructor(message?: string) {
    super(message || 'User not authenticated');
  }
}

export class UserAccountInactiveException extends Error {
  constructor(message?: string) {
    super(message || 'User account inactive');
  }
}

export class UserLacksReporterRoleException extends Error {
  constructor(message?: string) {
    super(message || 'User lacks reporter role');
  }
}

export class UserNotRegisteredAsReporterException extends Error {
  constructor(message?: string) {
    super(message || 'User not registered as reporter');
  }
}

export class NotAuthenticatedError extends Error {
  constructor(message?: string) {
    super(message || 'Not authenticated');
  }
}

export class UserAccountInactiveError extends Error {
  constructor(message?: string) {
    super(message || 'User account inactive');
  }
}

export class InsufficientPermissionError extends Error {
  constructor(message?: string) {
    super(message || 'Insufficient permission');
  }
}

export class UserNotFoundError extends Error {
  constructor(message?: string) {
    super(message || 'User not found');
  }
}

export class InsufficientLeaderRoleError extends Error {
  constructor(message?: string) {
    super(message || 'Insufficient leader role');
  }
}

export class InsufficientRoleError extends Error {
  constructor(message?: string) {
    super(message || 'Insufficient role');
  }
}

// Input interfaces
export interface AuthenticateReporterAccessInput {
  userId: string;
  isAuthenticated: boolean;
}

export interface AuthenticateLeaderAccessInput {
  userId: string;
  isAuthenticated: boolean;
}

export interface ValidateUserAccountActiveStatusInput {
  userId: string;
}

export interface ValidateUserHasReporterRoleInput {
  userId: string;
}

export interface ValidateUserHasLeaderRoleInput {
  userId: string;
}

// Type aliases for agent orchestrator (uppercase convention)
export type AuthenticateAndAuthorizeReporterAccessInput = AuthenticateReporterAccessInput;
export type AuthenticateAndAuthorizeReporterAccessOutput = AuthenticateReporterAccessOutput;
export type AuthenticateAndAuthorizeLeaderAccessInput = AuthenticateLeaderAccessInput;
export type AuthenticateAndAuthorizeLeaderAccessOutput = AuthenticateLeaderAccessOutput;

// Output interfaces
export interface AuthenticateReporterAccessOutput {
  isAccessGranted: boolean;
  userId: string;
  denialReason?: string | null;
}

export interface AuthenticateLeaderAccessOutput {
  isAccessGranted: boolean;
  userId: string;
  denialReason?: string | null;
}

export interface ValidateUserAccountActiveStatusOutput {
  isActive: boolean;
  userId: string;
  inactiveReason?: string | null;
}

export interface ValidateUserHasReporterRoleOutput {
  hasReporterRole: boolean;
  userId: string;
  denialReason?: string | null;
}

export interface ValidateUserHasLeaderRoleOutput {
  hasLeaderRole: boolean;
  userId: string;
  denialReason?: string | null;
}

// Note: Actual data persistence should be implemented from database later.
// For now, this is a placeholder that will be replaced by test mocks.


/**
 * ユーザーアカウントが有効な状態であるかを検証
 */
export async function validateUserAccountActiveStatus(
  input: ValidateUserAccountActiveStatusInput
): Promise<ValidateUserAccountActiveStatusOutput> {
  if (!input.userId || input.userId.trim() === '') {
    throw new UserNotFoundError('User ID cannot be empty');
  }

  throw new UserNotFoundError(`User ${input.userId} not found`);
}

/**
 * ユーザーが日報入力権限を持つロールに属しているかを検証
 */
export async function validateUserHasReporterRole(
  input: ValidateUserHasReporterRoleInput
): Promise<ValidateUserHasReporterRoleOutput> {
  if (!input.userId || input.userId.trim() === '') {
    throw new UserNotFoundError('User ID cannot be empty');
  }

  throw new UserNotFoundError(`User ${input.userId} not found`);
}

/**
 * ユーザーがリーダー役割を持つかを検証
 */
export async function validateUserHasLeaderRole(
  input: ValidateUserHasLeaderRoleInput
): Promise<ValidateUserHasLeaderRoleOutput> {
  if (!input.userId || input.userId.trim() === '') {
    throw new UserNotFoundError('User ID cannot be empty');
  }

  // First check if account is active
  try {
    const accountStatus = await validateUserAccountActiveStatus({ userId: input.userId });
    if (!accountStatus.isActive) {
      throw new UserAccountInactiveError('User account is inactive');
    }
  } catch (error) {
    if (error instanceof UserAccountInactiveError) {
      throw error;
    }
    if (error instanceof UserNotFoundError) {
      throw error;
    }
    throw error;
  }

  throw new UserNotFoundError(`User ${input.userId} not found`);
}

/**
 * ログイン済みの報告者が日報入力画面へアクセスする際に検証を実施
 */
export async function authenticateAndAuthorizeReporterAccess(
  input: AuthenticateReporterAccessInput
): Promise<AuthenticateReporterAccessOutput> {
  // Validate input
  if (!input.userId || input.userId.trim() === '') {
    throw new UserNotAuthenticatedException('ユーザーがログインしていません。ログイン画面へ遷移してください。');
  }

  // Check authentication status
  if (!input.isAuthenticated) {
    throw new UserNotAuthenticatedException('ユーザーがログインしていません。ログイン画面へ遷移してください。');
  }

  // Validate account active status
  let accountStatus: ValidateUserAccountActiveStatusOutput;
  try {
    accountStatus = await validateUserAccountActiveStatus({ userId: input.userId });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      throw new UserNotRegisteredAsReporterException('このユーザーは日報提出対象として登録されていません。');
    }
    throw error;
  }

  if (!accountStatus.isActive) {
    throw new UserAccountInactiveException('このアカウントは無効化されています。管理者に問い合わせてください。');
  }

  // Validate reporter role
  let roleStatus: ValidateUserHasReporterRoleOutput;
  try {
    roleStatus = await validateUserHasReporterRole({ userId: input.userId });
  } catch (error) {
    if (error instanceof UserLacksReporterRoleException) {
      throw error;
    }
    if (error instanceof UserNotFoundError) {
      throw new UserNotRegisteredAsReporterException('このユーザーは日報提出対象として登録されていません。');
    }
    throw error;
  }

  if (!roleStatus.hasReporterRole) {
    throw new UserLacksReporterRoleException('日報入力画面へのアクセス権限がありません。');
  }

  return {
    isAccessGranted: true,
    userId: input.userId,
    denialReason: null,
  };
}

/**
 * ログイン済みのチームリーダーが日報管理画面へアクセスする際に検証を実施
 */
export async function authenticateAndAuthorizeLeaderAccess(
  input: AuthenticateLeaderAccessInput
): Promise<AuthenticateLeaderAccessOutput> {
  // Validate input
  if (!input.userId || input.userId.trim() === '') {
    throw new NotAuthenticatedError('User ID is required');
  }

  // Check authentication status
  if (!input.isAuthenticated) {
    throw new NotAuthenticatedError('User is not authenticated');
  }

  // Validate account active status
  let accountStatus: ValidateUserAccountActiveStatusOutput;
  try {
    accountStatus = await validateUserAccountActiveStatus({ userId: input.userId });
  } catch (error) {
    if (error instanceof UserAccountInactiveError) {
      throw new UserAccountInactiveError(error.message);
    }
    if (error instanceof UserNotFoundError) {
      throw new NotAuthenticatedError(`User ${input.userId} not found`);
    }
    throw error;
  }

  if (!accountStatus.isActive) {
    throw new UserAccountInactiveError('ユーザーアカウントが無効です。');
  }

  // Validate leader role
  try {
    const roleResult = await validateUserHasLeaderRole({ userId: input.userId });
    if (!roleResult.hasLeaderRole) {
      throw new InsufficientPermissionError('管理画面へのアクセス権限がありません。');
    }
  } catch (error) {
    if (error instanceof InsufficientPermissionError) {
      throw error;
    }
    if (error instanceof UserNotFoundError) {
      throw new NotAuthenticatedError(`User ${input.userId} not found`);
    }
    throw error;
  }

  return {
    isAccessGranted: true,
    userId: input.userId,
    denialReason: null,
  };
}
