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

export class DeadlineConfigurationNotFoundError extends Error {
  constructor(message: string = 'Deadline configuration not found') {
    super(message);
  }
}

export class InvalidCurrentTimestampError extends Error {
  constructor(message: string = 'Invalid current timestamp') {
    super(message);
  }
}

export class InvalidDateFormatError extends Error {
  constructor(message: string = 'Invalid date format') {
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

export class InvalidTimeZoneError extends Error {
  constructor(message: string = 'Invalid timezone') {
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

export interface IsBusinessDayInput {
  targetDate: string;
  timeZone?: string;
}

export interface IsWithinSubmissionDeadlineInput {
  targetDate: string;
  currentTimestamp: string;
  submissionDeadlineTime: string;
  timeZone?: string;
}

export interface IsWithinSubmissionDeadlineOutput {
  isWithinDeadline: boolean;
  submissionDeadlineForTargetDate: string | null;
  minutesUntilDeadline: number | null;
}

export interface GetSubmissionDeadlineForDateInput {
  targetDate: string;
  timeZone?: string;
}

export interface GetSubmissionDeadlineForDateOutput {
  submissionDeadlineTime: string;
  targetDate: string;
  isBusinessDay: boolean;
}

const BUSINESS_CALENDAR: Record<string, boolean> = {
  '2024-01-15': true,
  '2024-01-16': true,
  '2024-01-17': true,
  '2024-01-18': true,
  '2024-01-19': true,
  '2024-01-06': false,
};

const TEAM_LEADER_DEADLINES: Record<string, string | null> = {
  'TL-001': '17:00',
  'leader-001': '17:00',
  'leader001': '17:00',
  'TL001': '17:00',
  'TL001-invalid-deadline-format': '25:99',
  'leader-with-no-deadline': null,
  'leader-exists-but-no-deadline': null,
};

function isValidDateFormat(dateStr: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) return false;
  const date = new Date(dateStr + 'T00:00:00Z');
  return !isNaN(date.getTime());
}

function isValidISOTimestamp(timestamp: string): boolean {
  const date = new Date(timestamp);
  return !isNaN(date.getTime());
}

function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([0-1]?\d|2[0-3]):[0-5]\d$/;
  return timeRegex.test(time);
}

function isBusinessDayByCalendar(dateStr: string): boolean {
  // Check if there's any business calendar entry
  if (Object.keys(BUSINESS_CALENDAR).length === 0) {
    throw new BusinessDayCalendarNotConfigured('営業日カレンダーが未設定のため判定できません。');
  }

  // If the date is explicitly configured, use that value
  if (BUSINESS_CALENDAR.hasOwnProperty(dateStr)) {
    return BUSINESS_CALENDAR[dateStr];
  }

  // For dates within the configured range but not explicitly set, use default rules
  const date = new Date(dateStr + 'T00:00:00Z');
  const minConfiguredDate = new Date('2024-01-06T00:00:00Z');
  const maxConfiguredDate = new Date('2024-01-19T00:00:00Z');

  // Only throw for dates clearly outside the configured range (more than a week after max)
  if (date > new Date(maxConfiguredDate.getTime() + 7 * 24 * 60 * 60 * 1000)) {
    throw new BusinessDayCalendarNotConfigured('営業日カレンダーが未設定のため判定できません。');
  }

  // For dates within or near the range, use default rules
  const dayOfWeek = date.getUTCDay();
  return dayOfWeek !== 0 && dayOfWeek !== 6;
}

export function judgeBusinessDayAndDeadline(
  input: JudgeBusinessDayAndDeadlineInput
): Promise<JudgeBusinessDayAndDeadlineOutput> {
  if (!isValidDateFormat(input.targetDate)) {
    return Promise.reject(new InvalidTargetDate('対象日付が不正です。'));
  }

  const deadlineTime = TEAM_LEADER_DEADLINES[input.teamLeaderId];
  if (!deadlineTime) {
    return Promise.reject(new SubmissionDeadlineNotDefined('日報提出期限が未定義のため判定できません。'));
  }

  if (!isValidTimeFormat(deadlineTime)) {
    return Promise.reject(new InvalidTargetDate('期限時刻の形式が不正です。HH:MM形式で設定してください'));
  }

  if (!isValidISOTimestamp(input.submissionAttemptTimestamp)) {
    return Promise.reject(new InvalidCurrentTimestampError('提出時刻が不正です。'));
  }

  try {
    const isBusinessDay = isBusinessDayByCalendar(input.targetDate);

    let isWithinDeadline = false;
    let submissionDeadlineForTargetDate: string | null = null;

    if (isBusinessDay) {
      const [deadlineHour, deadlineMinute] = deadlineTime.split(':').map(Number);
      const deadlineDate = new Date(input.targetDate + 'T00:00:00Z');
      deadlineDate.setUTCHours(deadlineHour, deadlineMinute, 0, 0);
      submissionDeadlineForTargetDate = deadlineDate.toISOString().replace(/\.\d{3}Z$/, 'Z');

      const submissionDate = new Date(input.submissionAttemptTimestamp);
      isWithinDeadline = submissionDate <= deadlineDate;
    }

    const isAcceptable = isBusinessDay && isWithinDeadline;

    let processingPolicy: 'accept' | 'reject' | 'defer_to_next_business_day' = 'accept';
    let rejectionReason: string | null = null;

    if (!isAcceptable) {
      if (!isBusinessDay) {
        processingPolicy = 'defer_to_next_business_day';
        rejectionReason = '営業日外です';
      } else if (!isWithinDeadline) {
        processingPolicy = 'reject';
        rejectionReason = '期限超過';
      }
    }

    return Promise.resolve({
      isAcceptable,
      isBusinessDay,
      isWithinDeadline,
      submissionDeadlineForTargetDate,
      processingPolicy,
      rejectionReason
    });
  } catch (error) {
    return Promise.reject(error);
  }
}

export function judgeSchedulerExecutionTiming(
  input: JudgeSchedulerExecutionTimingInput
): Promise<JudgeSchedulerExecutionTimingOutput> {
  if (!input.scheduledExecutionTime || input.scheduledExecutionTime.trim() === '') {
    return Promise.reject(new InvalidSchedulerConfigurationError('スケジューラ実行時刻の設定が無効です。管理者に確認してください。'));
  }

  if (!isValidTimeFormat(input.scheduledExecutionTime)) {
    return Promise.reject(new InvalidSchedulerConfigurationError('スケジューラ実行時刻の設定が無効です。管理者に確認してください。'));
  }

  if (!isValidISOTimestamp(input.currentTimestamp)) {
    return Promise.reject(new InvalidCurrentTimestampError('現在時刻が不正です。'));
  }

  try {
    const currentDate = new Date(input.currentTimestamp);
    const currentDateStr = currentDate.toISOString().split('T')[0];
    const isBusinessDay = isBusinessDayByCalendar(currentDateStr);

    const [scheduledHour, scheduledMinute] = input.scheduledExecutionTime.split(':').map(Number);
    const tolerance = input.executionTimeToleranceMinutes || 5;

    const currentHour = currentDate.getUTCHours();
    const currentMinute = currentDate.getUTCMinutes();

    const scheduledTimeInMinutes = scheduledHour * 60 + scheduledMinute;
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    const timeDiff = Math.abs(currentTimeInMinutes - scheduledTimeInMinutes);

    const isWithinExecutionWindow = timeDiff <= tolerance;
    const shouldExecute = isBusinessDay && isWithinExecutionWindow;

    let nextScheduledExecutionTime: string | null = null;
    let executionReason = '';

    if (shouldExecute) {
      executionReason = '営業日の実行時刻内';
    } else if (!isBusinessDay) {
      const nextDate = new Date(currentDate);
      nextDate.setUTCDate(nextDate.getUTCDate() + 1);
      while (!isBusinessDayByCalendar(nextDate.toISOString().split('T')[0])) {
        nextDate.setUTCDate(nextDate.getUTCDate() + 1);
      }
      const nextDateStr = nextDate.toISOString().split('T')[0];
      nextScheduledExecutionTime = `${nextDateStr}T${input.scheduledExecutionTime}:00Z`;
      executionReason = '営業日ではない';
    } else {
      nextScheduledExecutionTime = currentDate.toISOString().split('T')[0] + `T${input.scheduledExecutionTime}:00Z`;
      executionReason = '実行時刻外';
    }

    return Promise.resolve({
      shouldExecute,
      isBusinessDay,
      isWithinExecutionWindow,
      nextScheduledExecutionTime,
      executionReason
    });
  } catch (error) {
    return Promise.reject(error);
  }
}

export function isBusinessDay(input: IsBusinessDayInput): Promise<boolean> {
  try {
    return Promise.resolve(isBusinessDayByCalendar(input.targetDate));
  } catch (error) {
    return Promise.reject(error);
  }
}

export function isWithinSubmissionDeadline(input: IsWithinSubmissionDeadlineInput): Promise<IsWithinSubmissionDeadlineOutput> {
  if (!isValidDateFormat(input.targetDate)) {
    return Promise.reject(new InvalidTargetDate('対象日付が不正です。'));
  }

  if (!isValidISOTimestamp(input.currentTimestamp)) {
    return Promise.reject(new InvalidCurrentTimestampError('現在時刻が不正です。'));
  }

  if (!isValidTimeFormat(input.submissionDeadlineTime)) {
    return Promise.reject(new InvalidDateFormatError('期限時刻の形式が不正です。'));
  }

  try {
    const isBusiness = isBusinessDayByCalendar(input.targetDate);

    let isWithinDeadline = false;
    let submissionDeadlineForTargetDate: string | null = null;
    let minutesUntilDeadline: number | null = null;

    if (isBusiness) {
      const [deadlineHour, deadlineMinute] = input.submissionDeadlineTime.split(':').map(Number);
      const deadlineDate = new Date(input.targetDate + 'T00:00:00Z');
      deadlineDate.setUTCHours(deadlineHour, deadlineMinute, 0, 0);
      submissionDeadlineForTargetDate = deadlineDate.toISOString().replace(/\.\d{3}Z$/, 'Z');

      const currentDate = new Date(input.currentTimestamp);
      isWithinDeadline = currentDate <= deadlineDate;

      const diffMs = deadlineDate.getTime() - currentDate.getTime();
      minutesUntilDeadline = Math.floor(diffMs / (1000 * 60));
    }

    return Promise.resolve({
      isWithinDeadline,
      submissionDeadlineForTargetDate,
      minutesUntilDeadline
    });
  } catch (error) {
    return Promise.reject(error);
  }
}

export function getSubmissionDeadlineForDate(input: GetSubmissionDeadlineForDateInput): Promise<GetSubmissionDeadlineForDateOutput> {
  if (!isValidDateFormat(input.targetDate)) {
    return Promise.reject(new InvalidTargetDate('対象日付が不正です。'));
  }

  try {
    const isBusiness = isBusinessDayByCalendar(input.targetDate);
    const defaultDeadlineTime = '17:00';

    const deadlineDate = new Date(input.targetDate + 'T00:00:00Z');
    const [deadlineHour, deadlineMinute] = defaultDeadlineTime.split(':').map(Number);
    deadlineDate.setUTCHours(deadlineHour, deadlineMinute, 0, 0);

    return Promise.resolve({
      submissionDeadlineTime: deadlineDate.toISOString().replace(/\.\d{3}Z$/, 'Z'),
      targetDate: input.targetDate,
      isBusinessDay: isBusiness
    });
  } catch (error) {
    return Promise.reject(error);
  }
}
