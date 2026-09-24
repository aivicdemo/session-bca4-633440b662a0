/**
 * TX-1-IMP-1 エージェント
 * 日報管理システムの業務フロー全体を統合・実行するオーケストレーター
 */

import {
  judgeSchedulerExecutionTiming,
  SystemExecutionContext,
  JudgeSchedulerExecutionTimingOutput,
} from '../../logic/business-day-deadline-judgment';
import {
  getActiveReportersForSubmissionCheck,
  Reporter,
  GetActiveReportersForSubmissionCheckOutput,
} from '../../logic/reporter-master-management';
import {
  authenticateAndAuthorizeReporterAccess,
  AuthenticateAndAuthorizeReporterAccessInput,
  AuthenticateAndAuthorizeReporterAccessOutput,
} from '../../logic/user-authentication-authorization';
import {
  submitDailyReport,
  SubmitDailyReportInput,
  SubmitDailyReportOutput,
} from '../../logic/daily-report-submission';
import {
  sendLeaderSubmissionNotification,
  SendLeaderSubmissionNotificationInput,
  SendLeaderSubmissionNotificationOutput,
} from '../../logic/daily-report-reminder-notification';

export interface Tx1Imp1AiClient {
  invokeModel?: (prompt: string, systemPrompt?: string) => any;
  judgeSchedulerExecutionTiming?: (
    executionTimestamp: Date,
    targetDate: Date,
    systemContext?: SystemExecutionContext
  ) => any;
  authenticateAndAuthorizeReporterAccess?: (
    input: AuthenticateAndAuthorizeReporterAccessInput
  ) => any;
  getActiveReportersForSubmissionCheck?: (
    targetDate: string,
    systemContext?: SystemExecutionContext,
    teamId?: string
  ) => any;
  submitDailyReport?: (reporterId: string, content?: string) => any;
  sendLeaderSubmissionNotification?: (
    input: SendLeaderSubmissionNotificationInput
  ) => any;
  [key: string]: any;
  detectNonSubmittedReportersAtDeadline(
    targetDate: string,
    systemContext: SystemExecutionContext,
    teamId?: string
  ): Promise<any>;
  sendLeaderNonSubmissionPromptNotification(
    input: any
  ): Promise<any>;
}

export interface Tx1Imp1AgentInput {
  executionTimestamp: Date;
  targetDate: Date | string;
  systemContext: SystemExecutionContext;
}

export interface NonSubmittedReporterInfo {
  userId: string;
  userName: string;
  emailAddress: string;
  promptSent: boolean;
  lastSubmittedDate?: Date | null;
}

export interface AgentExecutionError {
  errorCode: string;
  errorMessage: string;
  name?: string;
  message?: string;
  timestamp?: Date;
  severity?: 'info' | 'warning' | 'error';
  affectedReporterCount?: number;
}

export interface Tx1Imp1AgentOutput {
  executionStatus: 'success' | 'partial_success' | 'failure';
  reportersPrompted: number;
  reportsSubmitted: number;
  nonSubmittedReporters: NonSubmittedReporterInfo[];
  promptsSent: number;
  leaderNotificationsSent: number;
  errors?: AgentExecutionError[];
  executionSummary: string;
  [key: string]: any;
}

/**
 * TX-1-IMP-1 エージェントを実行する
 */
export async function runTx1Imp1Agent(
  input: Tx1Imp1AgentInput,
  aiClient: Tx1Imp1AiClient
): Promise<Tx1Imp1AgentOutput> {
  const errors: AgentExecutionError[] = [];
  const nonSubmittedReporters: NonSubmittedReporterInfo[] = [];

  // Normalize targetDate to Date
  const targetDateAsDate = typeof input.targetDate === 'string'
    ? new Date(input.targetDate)
    : input.targetDate;

  const targetDateStr = targetDateAsDate.toISOString().split('T')[0];

  try {
    // Step 1: スケジューラ実行タイミング判定
    let judgmentResult: JudgeSchedulerExecutionTimingOutput;
    try {
      judgmentResult = judgeSchedulerExecutionTiming({
        currentTimestamp: input.executionTimestamp.toISOString(),
        scheduledExecutionTime: '17:00',
        executionTimeToleranceMinutes: 5,
        timeZone: input.systemContext.timezone
      });
    } catch (error) {
      const errorCode = (error as any)?.name || 'SchedulerExecutionTimingError';
      const errorMessage =
        (error as any)?.message ||
        '業務終了時刻の判定に失敗しました。スケジューラ実行タイミングを確認してください。';

      errors.push({
        errorCode,
        errorMessage,
        timestamp: new Date(),
        severity: 'error',
      });

      return {
        executionStatus: 'failure',
        reportersPrompted: 0,
        reportsSubmitted: 0,
        nonSubmittedReporters: [],
        promptsSent: 0,
        leaderNotificationsSent: 0,
        errors,
        executionSummary: 'エージェント実行に失敗しました。スケジューラタイミング判定エラーが発生しました。',
      };
    }

    // 実行タイミングが不適切な場合は終了
    if (!judgmentResult.shouldExecute) {
      return {
        executionStatus: 'success',
        reportersPrompted: 0,
        reportsSubmitted: 0,
        nonSubmittedReporters: [],
        promptsSent: 0,
        leaderNotificationsSent: 0,
        errors: [],
        executionSummary: '実行時刻外のため、エージェント処理はスキップされました。',
      };
    }

    // Step 2: 報告者マスタから対象者を取得
    let reportersResponse: GetActiveReportersForSubmissionCheckOutput;
    try {
      reportersResponse = await getActiveReportersForSubmissionCheck({
        targetDate: targetDateAsDate,
        teamLeaderId: ''
      });
    } catch (error) {
      const errorMessage =
        (error as any)?.message || '報告者情報の取得に失敗しました。';
      errors.push({
        errorCode: 'ReporterFetchError',
        errorMessage,
        timestamp: new Date(),
        severity: 'error',
      });

      return {
        executionStatus: 'failure',
        reportersPrompted: 0,
        reportsSubmitted: 0,
        nonSubmittedReporters: [],
        promptsSent: 0,
        leaderNotificationsSent: 0,
        errors,
        executionSummary: 'エージェント実行に失敗しました。報告者情報取得エラーが発生しました。',
      };
    }

    if (!reportersResponse.success || !reportersResponse.reporters) {
      return {
        executionStatus: 'success',
        reportersPrompted: 0,
        reportsSubmitted: 0,
        nonSubmittedReporters: [],
        promptsSent: 0,
        leaderNotificationsSent: 0,
        errors: [],
        executionSummary: '対象報告者が見つかりませんでした。',
      };
    }

    const reporters = reportersResponse.reporters;
    let reportersPrompted = 0;
    let reportsSubmitted = 0;
    let leaderNotificationsSent = 0;
    let hasAuthError = false;

    // Step 3-6: 各報告者について、認証・入力促進・報告書提出・通知処理を実行
    for (const reporter of reporters) {
      try {
        // Step 3: 認証・認可チェック
        const authInput: AuthenticateAndAuthorizeReporterAccessInput = {
          userId: reporter.userId,
        };

        let authResult: AuthenticateAndAuthorizeReporterAccessOutput;
        try {
          authResult = await authenticateAndAuthorizeReporterAccess(authInput);
        } catch (error) {
          const errorMessage =
            (error as any)?.message ||
            '従業員の認証に失敗しました。ログイン状態を確認してください。';
          errors.push({
            errorCode: 'ReporterAuthenticationError',
            errorMessage,
            timestamp: new Date(),
            severity: 'warning',
          });
          hasAuthError = true;
          nonSubmittedReporters.push({
            userId: reporter.userId,
            userName: reporter.reporterName,
            emailAddress: reporter.emailAddress,
            promptSent: false,
          });
          continue;
        }

        if (!authResult.isAccessGranted) {
          errors.push({
            errorCode: 'ReporterAuthenticationError',
            errorMessage: '従業員の認証に失敗しました。ログイン状態を確認してください。',
            timestamp: new Date(),
            severity: 'warning',
          });
          hasAuthError = true;
          nonSubmittedReporters.push({
            userId: reporter.userId,
            userName: reporter.reporterName,
            emailAddress: reporter.emailAddress,
            promptSent: false,
          });
          continue;
        }

        // Step 4: 入力促進通知（Action 1）
        reportersPrompted++;

        // Step 5: 日報提出（Action 3）
        const submitInput: SubmitDailyReportInput = {
          userId: reporter.userId,
          reportDate: targetDateStr,
          businessContent: '',
          submissionTimestamp: new Date().toISOString(),
        };

        let submitResult: SubmitDailyReportOutput;
        try {
          submitResult = await submitDailyReport(submitInput);
        } catch (error) {
          const errorMessage = (error as any)?.message || '日報提出に失敗しました。';
          const errorCode = (error as any)?.name || 'DailyReportSubmissionError';
          errors.push({
            errorCode,
            errorMessage,
            timestamp: new Date(),
            severity: 'warning',
          });
          nonSubmittedReporters.push({
            userId: reporter.userId,
            userName: reporter.reporterName,
            emailAddress: reporter.emailAddress,
            promptSent: true,
          });
          continue;
        }

        if (submitResult.submissionStatus === 'submitted') {
          reportsSubmitted++;

          // Step 6: リーダー通知（Action 4）
          const notifInput: SendLeaderSubmissionNotificationInput = {
            reporterId: reporter.reporterId,
            userId: reporter.userId,
          };

          try {
            const notifResult =
              await sendLeaderSubmissionNotification(notifInput);
            if (notifResult.success) {
              leaderNotificationsSent++;
            } else {
              errors.push({
                errorCode: 'LeaderNotificationError',
                errorMessage: 'リーダー通知送信に失敗しました。',
                timestamp: new Date(),
                severity: 'warning',
              });
            }
          } catch (error) {
            const errorMessage =
              (error as any)?.message || 'リーダー通知送信に失敗しました。';
            errors.push({
              errorCode: 'LeaderNotificationError',
              errorMessage,
              timestamp: new Date(),
              severity: 'warning',
            });
          }
        } else {
          nonSubmittedReporters.push({
            userId: reporter.userId,
            userName: reporter.reporterName,
            emailAddress: reporter.emailAddress,
            promptSent: true,
          });
        }
      } catch (error) {
        const errorMessage =
          (error as any)?.message || '報告者処理中にエラーが発生しました。';
        errors.push({
          errorCode: 'ReporterProcessingError',
          errorMessage,
          timestamp: new Date(),
          severity: 'warning',
        });
        nonSubmittedReporters.push({
          userId: reporter.userId,
          userName: reporter.reporterName,
          emailAddress: reporter.emailAddress,
          promptSent: true,
        });
      }
    }

    // 実行結果ステータスを決定
    let executionStatus: 'success' | 'partial_success' | 'failure' =
      'success';

    if (reportsSubmitted === reporters.length && reporters.length > 0) {
      executionStatus = 'success';
    } else if (reportsSubmitted > 0 && reportsSubmitted < reporters.length) {
      executionStatus = 'partial_success';
    } else if (reportsSubmitted === 0) {
      executionStatus = 'failure';
    }

    // サマリー作成
    const executionSummary =
      executionStatus === 'success'
        ? `エージェント実行が完了しました。報告者${reportersPrompted}名全員が入力を促され、${reportsSubmitted}件の日報が提出され、${leaderNotificationsSent}件のリーダー通知が送信されました。`
        : executionStatus === 'partial_success'
          ? `エージェント実行が部分的に完了しました。報告者${reportersPrompted}名中${reportsSubmitted}名が日報を提出し、${leaderNotificationsSent}件のリーダー通知が送信されました。${nonSubmittedReporters.length}名の報告者が未提出です。`
          : hasAuthError
            ? `エージェント実行に失敗しました。認証エラーが発生しました。`
            : `エージェント実行に失敗しました。`;

    return {
      executionStatus,
      reportersPrompted,
      reportsSubmitted,
      nonSubmittedReporters,
      promptsSent: 0, // Action 5, 6は未実装
      leaderNotificationsSent,
      errors: errors.length > 0 ? errors : undefined,
      executionSummary,
    };
  } catch (error) {
    const errorMessage =
      (error as any)?.message ||
      'エージェント実行中に予期しないエラーが発生しました。';
    errors.push({
      errorCode: 'UnexpectedError',
      errorMessage,
      timestamp: new Date(),
      severity: 'error',
    });

    return {
      executionStatus: 'failure',
      reportersPrompted: 0,
      reportsSubmitted: 0,
      nonSubmittedReporters: [],
      promptsSent: 0,
      leaderNotificationsSent: 0,
      errors,
      executionSummary: 'エージェント実行に失敗しました。予期しないエラーが発生しました。',
    };
  }
}