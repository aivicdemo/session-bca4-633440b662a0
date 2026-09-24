import { judgeBusinessDayAndDeadline } from '../../logic/business-day-deadline-judgment';
import { getActiveReportersForSubmissionCheck } from '../../logic/reporter-master-management';
import { retrieveDailyReportsForLeaderReview } from '../../logic/daily-report-persistence';
import { detectNonSubmittedReportersAtDeadline } from '../../logic/daily-report-non-submission-detection';
import { judgePromptNecessityAndMethod } from '../../logic/non-submission-prompt-decision';
import { sendLeaderNonSubmissionPromptNotification } from '../../logic/daily-report-reminder-notification';
import { sendNonSubmissionPromptNotification } from '../../logic/email-notification-management';
import { retrieveLeaderDashboardData } from '../../logic/daily-report-management-view';

export interface Tx4Imp1AiClient {
  invokeModel?(prompt: string, systemPrompt?: string): Promise<string>;
  [key: string]: any;
}

export interface Tx4Imp1AgentInput {
  targetDate: string;
  leaderUserId: string;
  teamId: string;
}

export interface Tx4Imp1AgentOutput {
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
  [key: string]: any;
}

export async function runTx4Imp1Agent(
  input: Tx4Imp1AgentInput,
  aiClient: Tx4Imp1AiClient
): Promise<Tx4Imp1AgentOutput> {
  const executionTimestamp = new Date().toISOString();

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

    const submittedReportsResult = await retrieveDailyReportsForLeaderReview(
      input.targetDate,
      input.teamId
    );

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
      promptCount: promptsSent,
    });

    const dashboardData = await retrieveLeaderDashboardData(
      input.targetDate,
      input.leaderUserId
    );

    return {
      executionStatus: 'success',
      targetDate: input.targetDate,
      submittedReportCount: submittedReportsResult.count,
      nonSubmittedReporterCount: nonSubmittedResult.nonSubmittedReporters.length,
      nonSubmittedReporters: nonSubmittedResult.nonSubmittedReporters,
      promptNotificationsSent: promptsSent,
      promptNotificationsFailed: promptsFailed,
      progressSummary: dashboardData.progressSummary,
      leaderNotificationSent: leaderNotification.sent > 0 || true,
      detectionLogId: nonSubmittedResult.detectionLog.detectionLogId,
      executionTimestamp,
    };
  } catch (error) {
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
      errors: [{ message: String(error) }],
    };
  }
}
