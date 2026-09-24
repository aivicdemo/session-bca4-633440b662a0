// Error Classes
export class EmailAddressNotProvidedError extends Error {
  constructor(message: string = 'Email address not provided') {
    super(message);
  }
}

export class UserDepartmentEmptyError extends Error {
  constructor(message: string = 'User department empty') {
    super(message);
  }
}

// Types and Interfaces
export interface ValidateDailyReportContentInput {
  content: string | null | undefined;
  minimumCharacterLength?: number;
}

export interface ValidateDailyReportContentOutput {
  isValid: boolean;
  validatedContent: string | null;
  errorCode: string | null;
}

export interface ValidateEmailAddressInput {
  emailAddress: string | null | undefined;
}

export interface ValidateEmailAddressOutput {
  isValid: boolean;
  validatedEmailAddress: string | null;
  errorCode: string | null;
}

export interface DetectDuplicateEmailAddressInput {
  emailAddress: string | null | undefined;
  excludeUserId?: string;
  existingUserEmails: string[];
}

export interface DetectDuplicateEmailAddressOutput {
  isDuplicate: boolean;
  validatedEmailAddress: string | null;
  errorCode: string | null;
}

export interface ValidateUserInformationRequiredInput {
  userName: string | null | undefined;
  emailAddress: string | null | undefined;
  department: string | null | undefined;
  maximumUserNameLength?: number;
  [key: string]: any;
}

export interface ValidateUserInformationRequiredOutput {
  isValid: boolean;
  validatedUserName: string | null;
  validatedEmailAddress: string | null;
  validatedDepartment: string | null;
  errorCode: string | null;
  errorDetails?: Array<{field: string; errorCode: string}>;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}

export function validateDailyReportContent(
  input: ValidateDailyReportContentInput
): ValidateDailyReportContentOutput {
  const minLen = input.minimumCharacterLength || 10;

  if (!input.content || input.content.trim().length === 0) {
    return {
      isValid: false,
      validatedContent: null,
      errorCode: input.content === null ? 'EmptyOrNullContentError' : 'WhitespaceOnlyContentError'
    };
  }

  if (input.content.length < minLen) {
    return {
      isValid: false,
      validatedContent: null,
      errorCode: 'InsufficientContentLengthError'
    };
  }

  return {
    isValid: true,
    validatedContent: input.content,
    errorCode: null
  };
}

export function validateEmailAddress(
  input: ValidateEmailAddressInput
): ValidateEmailAddressOutput {
  if (!input.emailAddress || input.emailAddress.trim().length === 0) {
    return {
      isValid: false,
      validatedEmailAddress: null,
      errorCode: 'EmailAddressEmptyError'
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(input.emailAddress)) {
    return {
      isValid: false,
      validatedEmailAddress: null,
      errorCode: 'EmailAddressInvalidFormatError'
    };
  }

  return {
    isValid: true,
    validatedEmailAddress: input.emailAddress,
    errorCode: null
  };
}

export async function validateDailyReportInput(
  content: string
): Promise<ValidationResult> {
  return { isValid: true };
}

export async function validateEmailFormat(
  email: string
): Promise<ValidationResult> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return { isValid: emailRegex.test(email) };
}

export function validateUserInformationRequired(
  input: ValidateUserInformationRequiredInput
): ValidateUserInformationRequiredOutput {
  const errors: Array<{field: string; errorCode: string}> = [];
  const maxUserNameLen = input.maximumUserNameLength || 100;

  let validatedUserName: string | null = null;
  let validatedEmailAddress: string | null = null;
  let validatedDepartment: string | null = null;

  // userName validation
  if (!input.userName || input.userName.trim().length === 0) {
    errors.push({ field: 'userName', errorCode: 'UserNameEmpty' });
  } else if (input.userName.length > maxUserNameLen) {
    errors.push({ field: 'userName', errorCode: 'UserNameTooLong' });
  } else {
    validatedUserName = input.userName;
  }

  // emailAddress validation
  if (!input.emailAddress || input.emailAddress.trim().length === 0) {
    errors.push({ field: 'emailAddress', errorCode: 'EmailAddressEmpty' });
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.emailAddress)) {
      errors.push({ field: 'emailAddress', errorCode: 'EmailAddressInvalidFormat' });
    } else {
      validatedEmailAddress = input.emailAddress;
    }
  }

  // department validation
  if (!input.department || input.department.trim().length === 0) {
    errors.push({ field: 'department', errorCode: 'DepartmentEmpty' });
  } else {
    validatedDepartment = input.department;
  }

  const firstError = errors.length > 0 ? errors[0].errorCode : null;

  return {
    isValid: errors.length === 0,
    validatedUserName: validatedUserName,
    validatedEmailAddress: validatedEmailAddress,
    validatedDepartment: validatedDepartment,
    errorCode: firstError,
    errorDetails: errors.length > 0 ? errors : undefined
  };
}

export function detectDuplicateEmailAddress(
  input: DetectDuplicateEmailAddressInput
): DetectDuplicateEmailAddressOutput {
  if (!input.emailAddress || input.emailAddress.trim().length === 0) {
    return {
      isDuplicate: false,
      validatedEmailAddress: null,
      errorCode: 'EmailAddressEmpty'
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(input.emailAddress)) {
    return {
      isDuplicate: false,
      validatedEmailAddress: null,
      errorCode: 'EmailAddressInvalidFormat'
    };
  }

  const isDuplicate = input.existingUserEmails.includes(input.emailAddress);

  return {
    isDuplicate,
    validatedEmailAddress: input.emailAddress,
    errorCode: null
  };
}

export async function validateReporterNameFormat(
  name: string
): Promise<ValidationResult> {
  return { isValid: true };
}

export async function validateMinimumContentLength(
  content: string,
  minimumLength?: number
): Promise<ValidationResult> {
  const minLen = minimumLength || 1;
  return { isValid: (content?.length || 0) >= minLen };
}

/**
 * ValidateReporterNameFormatInput
 */
export interface ValidateReporterNameFormatInput {
  /** 検証対象の報告者名入力値。 */
  reporterName: string | null | undefined;
  /** 報告者名の最大許容文字数（指定時のみ検証）。 */
  maximumNameLength?: number | undefined;
}

/**
 * ValidateReporterNameFormatOutput
 */
export interface ValidateReporterNameFormatOutput {
  /** 報告者名が検証基準を満たすか否か。 */
  isValid: boolean;
  /** 検証済みの報告者名（トリム済み）、またはnull。 */
  validatedReporterName: string | null;
  /** 検証失敗時のエラーコード、または正常時はnull。 */
  errorCode: string | null;
}

/**
 * ValidateMinimumContentLengthInput
 */
export interface ValidateMinimumContentLengthInput {
  /** 検証対象の日報内容テキスト。 */
  content: string | null | undefined;
  /** 日報内容が満たすべき最小文字数。 */
  minimumCharacterLength: number;
}

/**
 * ValidateMinimumContentLengthOutput
 */
export interface ValidateMinimumContentLengthOutput {
  /** 入力内容が最小文字数要件を満たしているか。 */
  isValid: boolean;
  /** 検証後の日報内容。不正な場合はnull。 */
  validatedContent: string | null;
  /** 検証失敗時のエラーコード。成功時はnull。 */
  errorCode: string | null;
}
