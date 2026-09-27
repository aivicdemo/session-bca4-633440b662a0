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
  maximumDepartmentLength?: number;
}

export interface ValidateUserInformationRequiredOutput {
  isValid: boolean;
  validatedUserName: string | null;
  validatedEmailAddress: string | null;
  validatedDepartment: string | null;
  errorCode: string | null;
  errorDetails?: Array<{field: string; errorCode: string}>;
}

export async function validateDailyReportContent(
  input: ValidateDailyReportContentInput
): Promise<ValidateDailyReportContentOutput> {
  const minLen = input.minimumCharacterLength || 10;

  if (input.content === null || input.content === undefined || input.content === '') {
    return {
      isValid: false,
      validatedContent: null,
      errorCode: 'EmptyOrNullContentError'
    };
  }

  if (input.content.trim().length === 0) {
    return {
      isValid: false,
      validatedContent: null,
      errorCode: 'WhitespaceOnlyContentError'
    };
  }

  const trimmedContent = input.content.trim();
  if (trimmedContent.length < minLen) {
    return {
      isValid: false,
      validatedContent: null,
      errorCode: 'InsufficientContentLengthError'
    };
  }

  return {
    isValid: true,
    validatedContent: trimmedContent,
    errorCode: null
  };
}

export async function validateEmailAddress(
  input: ValidateEmailAddressInput
): Promise<ValidateEmailAddressOutput> {
  if (input.emailAddress === null || input.emailAddress === undefined || input.emailAddress === '') {
    return {
      isValid: false,
      validatedEmailAddress: null,
      errorCode: 'EMAIL_NOT_PROVIDED'
    };
  }

  const trimmedEmail = input.emailAddress.trim();

  if (trimmedEmail.length === 0) {
    return {
      isValid: false,
      validatedEmailAddress: null,
      errorCode: 'EMAIL_NOT_PROVIDED'
    };
  }

  // Check for consecutive dots (not RFC 5322 compliant)
  if (trimmedEmail.includes('..')) {
    return {
      isValid: false,
      validatedEmailAddress: null,
      errorCode: 'INVALID_EMAIL_FORMAT'
    };
  }

  // RFC 5322 compliant email validation
  // Local part: alphanumeric, dot, hyphen, underscore only
  // Domain: alphanumeric, hyphen, dot only
  // TLD: at least 2 characters
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmedEmail)) {
    return {
      isValid: false,
      validatedEmailAddress: null,
      errorCode: 'INVALID_EMAIL_FORMAT'
    };
  }

  return {
    isValid: true,
    validatedEmailAddress: trimmedEmail,
    errorCode: null
  };
}

export async function validateUserInformationRequired(
  input: ValidateUserInformationRequiredInput
): Promise<ValidateUserInformationRequiredOutput> {
  const errors: Array<{field: string; errorCode: string}> = [];
  const maxUserNameLen = input.maximumUserNameLength || 100;
  const maxDepartmentLen = input.maximumDepartmentLength || 100;

  let validatedUserName: string | null = null;
  let validatedEmailAddress: string | null = null;
  let validatedDepartment: string | null = null;

  // userName validation
  if (!input.userName || input.userName.trim().length === 0) {
    errors.push({ field: 'userName', errorCode: 'NameEmpty' });
  } else if (input.userName.trim().length > maxUserNameLen) {
    errors.push({ field: 'userName', errorCode: 'NameInvalidFormat' });
  } else {
    validatedUserName = input.userName.trim();
  }

  // emailAddress validation
  if (!input.emailAddress || input.emailAddress.trim().length === 0) {
    errors.push({ field: 'emailAddress', errorCode: 'EmailAddressEmpty' });
  } else {
    const trimmedEmail = input.emailAddress.trim();

    // Check for consecutive dots (not RFC 5322 compliant)
    if (trimmedEmail.includes('..')) {
      errors.push({ field: 'emailAddress', errorCode: 'EmailAddressInvalidFormat' });
    } else {
      // RFC 5322 compliant email validation
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(trimmedEmail)) {
        errors.push({ field: 'emailAddress', errorCode: 'EmailAddressInvalidFormat' });
      } else {
        validatedEmailAddress = trimmedEmail;
      }
    }
  }

  // department validation
  if (!input.department || input.department.trim().length === 0) {
    errors.push({ field: 'department', errorCode: 'DepartmentEmpty' });
  } else if (input.department.trim().length > maxDepartmentLen) {
    errors.push({ field: 'department', errorCode: 'DepartmentInvalidFormat' });
  } else {
    validatedDepartment = input.department.trim();
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

export async function detectDuplicateEmailAddress(
  input: DetectDuplicateEmailAddressInput
): Promise<DetectDuplicateEmailAddressOutput> {
  if (!input.emailAddress || input.emailAddress.trim().length === 0) {
    return {
      isDuplicate: false,
      validatedEmailAddress: null,
      errorCode: 'EmailAddressEmpty'
    };
  }

  const trimmedEmail = input.emailAddress.trim();
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmedEmail)) {
    return {
      isDuplicate: false,
      validatedEmailAddress: null,
      errorCode: 'EmailAddressInvalidFormat'
    };
  }

  const isDuplicate = input.existingUserEmails?.includes(trimmedEmail) || false;

  if (isDuplicate) {
    return {
      isDuplicate: true,
      validatedEmailAddress: null,
      errorCode: 'DuplicateEmailAddress'
    };
  }

  return {
    isDuplicate: false,
    validatedEmailAddress: trimmedEmail,
    errorCode: null
  };
}

export async function validateReporterNameFormat(
  input: ValidateReporterNameFormatInput
): Promise<ValidateReporterNameFormatOutput> {
  const maxNameLen = input.maximumNameLength || 100;

  if (!input.reporterName || input.reporterName.trim().length === 0) {
    return {
      isValid: false,
      validatedReporterName: null,
      errorCode: 'ReporterNameEmptyError'
    };
  }

  const trimmedName = input.reporterName.trim();
  if (trimmedName.length > maxNameLen) {
    return {
      isValid: false,
      validatedReporterName: null,
      errorCode: 'ReporterNameExceedsMaximumLength'
    };
  }

  return {
    isValid: true,
    validatedReporterName: trimmedName,
    errorCode: null
  };
}

export async function validateMinimumContentLength(
  input: ValidateMinimumContentLengthInput
): Promise<ValidateMinimumContentLengthOutput> {
  if (input.content === null || input.content === undefined || input.content === '') {
    return {
      isValid: false,
      validatedContent: null,
      errorCode: 'EmptyOrNullContentError'
    };
  }

  if (input.content.trim().length === 0) {
    return {
      isValid: false,
      validatedContent: null,
      errorCode: 'WhitespaceOnlyContentError'
    };
  }

  const trimmedContent = input.content.trim();
  if (trimmedContent.length < input.minimumCharacterLength) {
    return {
      isValid: false,
      validatedContent: null,
      errorCode: 'ContentBelowMinimumLengthError'
    };
  }

  return {
    isValid: true,
    validatedContent: trimmedContent,
    errorCode: null
  };
}

/**
 * ValidateReporterNameFormatInput
 */
export interface ValidateReporterNameFormatInput {
  reporterName: string | null | undefined;
  maximumNameLength?: number | undefined;
}

export interface ValidateReporterNameFormatOutput {
  isValid: boolean;
  validatedReporterName: string | null;
  errorCode: string | null;
}

export interface ValidateMinimumContentLengthInput {
  content: string | null | undefined;
  minimumCharacterLength: number;
}

export interface ValidateMinimumContentLengthOutput {
  isValid: boolean;
  validatedContent: string | null;
  errorCode: string | null;
}
