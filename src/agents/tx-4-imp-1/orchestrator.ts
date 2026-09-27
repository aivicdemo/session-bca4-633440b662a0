import { judgeBusinessDayAndDeadline } from '../../logic/business-day-deadline-judgment';
import { getActiveReportersForSubmissionCheck } from '../../logic/reporter-master-management';
import { retrieveDailyReportsForLeaderReview } from '../../logic/daily-report-persistence';
import { detectNonSubmittedReportersAtDeadline } from '../../logic/daily-report-non-submission-detection';
import { judgePromptNecessityAndMethod } from '../../logic/non-submission-prompt-decision';
import { sendLeaderNonSubmissionPromptNotification } from '../../logic/daily-report-reminder-notification';
import { sendNonSubmissionPromptNotification } from '../../logic/email-notification-management';
import { retrieveLeaderDashboardData } from '../../logic/daily-report-management-view';

export interface Tx4Imp1AiClient {
  [key: string]: any;
  invokeModel?(prompt: string, systemPrompt?: string): Promise<string>;
}

export interface Tx4Imp1AgentInput {
  [key: string]: any;
  targetDate: string;
  leaderUserId: string;
  teamId: string;
}

export interface Tx4Imp1AgentOutput {
  [key: string]: any;
  executionStatus: 'success' | 'partial_success' | 'failure';
  targetDate: string;
  submittedReportCount: number;
  nonSubmittedReporterCount: number;
  nonSubmittedReporters: any[];
  promptNotificationsSent: number;
  promptNotificationsFailed: number;
  progressSummary: string;
  leaderNotificationSent: boolean;
  detectionLogId: string;
  executionTimestamp: string;
  errors?: any[];
}

export async function runTx4Imp1Agent(
  input: Tx4Imp1AgentInput,
  aiClient: Tx4Imp1AiClient
): Promise<Tx4Imp1AgentOutput> {
  const now = new Date();
  const executionTimestamp = now.toISOString().replace(/\.\d{3}Z$/, 'Z');

  try {
    const businessDay = await judgeBusinessDayAndDeadline({
      targetDate: input.targetDate,
      teamLeaderId: input.leaderUserId,
      reporterUserId: '',
      submissionAttemptTimestamp: new Date().toISOString(),
    });

    const activeReportersResult = await getActiveReportersForSubmissionCheck({
      teamLeaderId: input.leaderUserId,
      targetDate: typeof input.targetDate === 'string' ? new Date(input.targetDate) : input.targetDate
    });

    const submittedReportsResult = await retrieveDailyReportsForLeaderReview({
      leaderId: input.leaderUserId,
      startDate: input.targetDate,
      endDate: input.targetDate,
    });

    const nonSubmittedResult = await detectNonSubmittedReportersAtDeadline({
      targetDate: input.targetDate,
      currentDateTime: executionTimestamp,
      submissionDeadlineTime: businessDay.submissionDeadlineForTargetDate?.split('T')[1]?.slice(0, 5) || '17:00',
      teamId: input.teamId,
    } as any);

    let promptsSent = 0;
    let promptsFailed = 0;
    if (nonSubmittedResult.nonSubmittedReporters.length > 0) {
      const promptResult = await sendNonSubmissionPromptNotification(
        nonSubmittedResult.nonSubmittedReporters
      );
      promptsSent = promptResult.sent;
      promptsFailed = promptResult.failed || 0;
    }

    const leaderNotification = await sendLeaderNonSubmissionPromptNotification({
      leaderId: input.leaderUserId,
      targetDate: new Date(input.targetDate),
      nonSubmittedReporterIds: nonSubmittedResult.nonSubmittedReporters.map((r: any) => r.userId),
      reminderSettingId: 'default',
      executionTimestamp: new Date(),
    });

    const dashboardData = await retrieveLeaderDashboardData(
      input.targetDate,
      input.leaderUserId
    );

    return {
      executionStatus: 'success',
      targetDate: input.targetDate,
      submittedReportCount: submittedReportsResult.totalCount,
      nonSubmittedReporterCount: nonSubmittedResult.nonSubmittedReporters.length,
      nonSubmittedReporters: nonSubmittedResult.nonSubmittedReporters,
      promptNotificationsSent: promptsSent,
      promptNotificationsFailed: promptsFailed,
      progressSummary: dashboardData.progressSummary,
      leaderNotificationSent: leaderNotification.success,
      detectionLogId: nonSubmittedResult.detectionLog.detectionLogId,
      executionTimestamp,
    };
  } catch (error) {
    const errorMessage = (error as any)?.message || String(error);
    let errorCode = 'UnknownError';

    if (errorMessage.includes('未提出者検知')) {
      errorCode = 'NonSubmissionDetectionFailed';
    } else if (errorMessage.includes('業務日判定')) {
      errorCode = 'BusinessDayJudgmentFailed';
    } else if (errorMessage.includes('報告者取得')) {
      errorCode = 'ReporterFetchFailed';
    }

    return {
      executionStatus: 'failure',
      targetDate: input.targetDate,
      submittedReportCount: 0,
      nonSubmittedReporterCount: 0,
      nonSubmittedReporters: [],
      promptNotificationsSent: 0,
      promptNotificationsFailed: 0,
      progressSummary: '',
      leaderNotificationSent: false,
      detectionLogId: '',
      executionTimestamp,
      errors: [{
        code: errorCode,
        message: errorCode === 'NonSubmissionDetectionFailed' ? '未提出者の検知に失敗しました。' : errorMessage
      }],
    };
  }
}
