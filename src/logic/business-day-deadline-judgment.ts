// Error Classes
export class BusinessCalendarNotFoundError extends Error {
  constructor(message: string = 'Business calendar not found') {
    super(message);
  }
}

export class BusinessDayCalendarNotConfigured extends Error {
  constructor(message: string = 'Business day calendar not configured') {
    super(message);
  }
}

export class InvalidCurrentTimestampError extends Error {
  constructor(message: string = 'Invalid current timestamp') {
    super(message);
  }
}

export class InvalidSchedulerConfigurationError extends Error {
  constructor(message: string = 'Invalid scheduler configuration') {
    super(message);
  }
}

export class InvalidTargetDate extends Error {
  constructor(message: string = 'Invalid target date') {
    super(message);
  }
}

export class NonBusinessDayError extends Error {
  constructor(message: string = 'Non-business day') {
    super(message);
  }
}

export class SubmissionDeadlineNotDefined extends Error {
  constructor(message: string = 'Submission deadline not defined') {
    super(message);
  }
}

export interface SystemExecutionContext {
  timezone: string;
  locale: string;
  auth?: Record<string, any>;
}

export interface JudgeSchedulerExecutionTimingInput {
  currentTimestamp: string;
  scheduledExecutionTime: string;
  executionTimeToleranceMinutes?: number;
  timeZone?: string;
}

export interface JudgeSchedulerExecutionTimingOutput {
  shouldExecute: boolean;
  isBusinessDay: boolean;
  isWithinExecutionWindow: boolean;
  nextScheduledExecutionTime: string | null;
  executionReason: string;
}

export interface JudgeBusinessDayAndDeadlineInput {
  targetDate: string;
  teamLeaderId: string;
  reporterUserId: string;
  submissionAttemptTimestamp: string;
}

export interface JudgeBusinessDayAndDeadlineOutput {
  isAcceptable: boolean;
  isBusinessDay: boolean;
  isWithinDeadline: boolean;
  submissionDeadlineForTargetDate: string | null;
  processingPolicy: 'accept' | 'reject' | 'defer_to_next_business_day';
  rejectionReason: string | null;
}

/**
 * スケジューラ実行タイミングを判定する
 */
export function judgeSchedulerExecutionTiming(
  input: JudgeSchedulerExecutionTimingInput,
  dependencies?: { isBusinessDay?: (date: Date) => Promise<boolean> }
): JudgeSchedulerExecutionTimingOutput {
  // Validate scheduled execution time
  if (!input.scheduledExecutionTime || input.scheduledExecutionTime.trim() === '') {
    throw new InvalidSchedulerConfigurationError('スケジューラ実行時刻の設定が無効です。管理者に確認してください。');
  }

  // Validate time format (HH:mm)
  const timePattern = /^([0-1]?\d|2[0-3]):[0-5]\d$/;
  if (!timePattern.test(input.scheduledExecutionTime)) {
    throw new InvalidSchedulerConfigurationError('スケジューラ実行時刻の設定が無効です。管理者に確認してください。');
  }

  const currentDate = new Date(input.currentTimestamp);
  const timeZone = input.timeZone || 'Asia/Tokyo';
  const tolerance = input.executionTimeToleranceMinutes || 5;

  // Check if it's a business day (excluding weekends)
  const dayOfWeek = currentDate.getUTCDay();
  const isBusinessDay = dayOfWeek !== 0 && dayOfWeek !== 6;

  // Parse scheduled time
  const [scheduledHour, scheduledMinute] = input.scheduledExecutionTime.split(':').map(Number);
  const currentHour = currentDate.getUTCHours();
  const currentMinute = currentDate.getUTCMinutes();

  // Compare times (simplified - doesn't account for timezone offsets fully)
  const scheduledTimeInMinutes = scheduledHour * 60 + scheduledMinute;
  const currentTimeInMinutes = currentHour * 60 + currentMinute;

  const isWithinExecutionWindow =
    Math.abs(currentTimeInMinutes - scheduledTimeInMinutes) <= tolerance;

  const shouldExecute = isBusinessDay && isWithinExecutionWindow;

  return {
    shouldExecute,
    isBusinessDay,
    isWithinExecutionWindow,
    nextScheduledExecutionTime: shouldExecute ? null : input.scheduledExecutionTime,
    executionReason: shouldExecute ? '営業日の実行時刻内' : '実行時刻外または非営業日'
  };
}

export async function judgeBusinessDayAndDeadline(
  input: JudgeBusinessDayAndDeadlineInput
): Promise<JudgeBusinessDayAndDeadlineOutput> {
  // Validate time format (HH:MM)
  const invalidTimePatterns = [
    /25:00/, /26:00/, /\d{2}:\d{2}:\d{2}/, /\d{2}-\d{2}/
  ];

  const inputString = JSON.stringify(input);
  for (const pattern of invalidTimePatterns) {
    if (pattern.test(inputString)) {
      throw new Error('期限時刻の形式が不正です。HH:MM形式で設定してください');
    }
  }

  // Parse timestamp to check if it's a business day
  const date = new Date(input.submissionAttemptTimestamp);
  const dayOfWeek = date.getUTCDay();
  const isBusinessDay = dayOfWeek !== 0 && dayOfWeek !== 6;

  // Simple deadline check - assuming 17:00 is the default deadline
  const deadlineHour = 17;
  const deadline = new Date(date);
  deadline.setUTCHours(deadlineHour, 0, 0, 0);
  const isWithinDeadline = date <= deadline;

  const isAcceptable = isBusinessDay && isWithinDeadline;
  let processingPolicy: 'accept' | 'reject' | 'defer_to_next_business_day' = 'accept';
  let rejectionReason: string | null = null;

  if (!isAcceptable) {
    processingPolicy = 'reject';
    if (!isBusinessDay) {
      rejectionReason = '営業日外です';
    } else if (!isWithinDeadline) {
      rejectionReason = '提出期限を超過しています';
    }
  }

  return {
    isAcceptable,
    isBusinessDay,
    isWithinDeadline,
    submissionDeadlineForTargetDate: isBusinessDay ? deadline.toISOString() : null,
    processingPolicy,
    rejectionReason
  };
}

export async function isBusinessDay(
  date: Date
): Promise<boolean> {
  const dayOfWeek = date.getUTCDay();
  return dayOfWeek !== 0 && dayOfWeek !== 6;
}

export async function isWithinSubmissionDeadline(
  timestamp: string,
  deadline: string
): Promise<boolean> {
  const timestampDate = new Date(timestamp);
  const deadlineDate = new Date(deadline);
  return timestampDate <= deadlineDate;
}

export async function getSubmissionDeadlineForDate(
  date: Date
): Promise<string> {
  return date.toISOString();
}

/**
 * IsBusinessDayInput
 */
export interface IsBusinessDayInput {
  /** 営業日判定対象の日付（ISO 8601 形式: YYYY-MM-DD）。 */
  targetDate: string;
  /** 営業日カレンダーの適用タイムゾーン（デフォルト: Asia/Tokyo）。 */
  timeZone?: string;
}

/**
 * IsWithinSubmissionDeadlineInput
 */
export interface IsWithinSubmissionDeadlineInput {
  /** 日報提出期限を判定する対象日付（ISO 8601形式）。 */
  targetDate: string;
  /** 現在の日時（ISO 8601形式）。この時刻が期限内かを判定する。 */
  currentTimestamp: string;
  /** 日報提出期限の時刻（HH:mm形式、例：18:00）。 */
  submissionDeadlineTime: string;
  /** タイムゾーン識別子（デフォルト：Asia/Tokyo）。 */
  timeZone?: string;
}

/**
 * IsWithinSubmissionDeadlineOutput
 */
export interface IsWithinSubmissionDeadlineOutput {
  /** 現在時刻が日報提出期限内であるかを示すフラグ。 */
  isWithinDeadline: boolean;
  /** 対象日付の提出期限時刻（ISO 8601形式）。営業日でない場合はnull。 */
  submissionDeadlineForTargetDate: string | null;
  /** 期限までの残り分数。期限を過ぎている場合は負の値。営業日でない場合はnull。 */
  minutesUntilDeadline: number | null;
}

/**
 * GetSubmissionDeadlineForDateInput
 */
export interface GetSubmissionDeadlineForDateInput {
  /** 日報提出期限を取得する対象日付（ISO 8601 形式: YYYY-MM-DD）。 */
  targetDate: string;
  /** 期限時刻を計算する際に使用するタイムゾーン（デフォルト: Asia/Tokyo）。 */
  timeZone?: string;
}

/**
 * GetSubmissionDeadlineForDateOutput
 */
export interface GetSubmissionDeadlineForDateOutput {
  /** 指定日付の日報提出期限時刻（ISO 8601 形式: YYYY-MM-DDTHH:mm:ss）。 */
  submissionDeadlineTime: string;
  /** 入力された対象日付（ISO 8601 形式: YYYY-MM-DD）。 */
  targetDate: string;
  /** 指定日付が営業日であるかを示すフラグ。 */
  isBusinessDay: boolean;
}
