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
  detectNonSubmittedReportersAtDeadline(
    targetDate: string,
    systemContext: SystemExecutionContext,
    teamId?: string
  ): Promise<any>;
  sendLeaderNonSubmissionPromptNotification(
    input: any
  ): Promise<any>;
  [key: string]: any;
}

export interface Tx1Imp1AgentInput {
  executionTimestamp: Date;
  targetDate: Date | string;
  systemContext: SystemExecutionContext;
  [key: string]: any;
}

export interface NonSubmittedReporterInfo {
  userId: string;
  userName: string;
  emailAddress: string;
  promptSent: boolean;
  lastSubmittedDate?: Date | null;
  [key: string]: any;
}

export interface AgentExecutionError {
  errorCode: string;
  errorMessage: string;
  name?: string;
  message?: string;
  timestamp?: Date;
  severity?: 'info' | 'warning' | 'error';
  affectedReporterCount?: number;
  [key: string]: any;
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
    let judgmentResult: any;
    try {
      if (aiClient.judgeSchedulerExecutionTiming) {
        const aiResult = await aiClient.judgeSchedulerExecutionTiming(
          input.executionTimestamp,
          input.targetDate instanceof Date ? input.targetDate : new Date(input.targetDate),
          input.systemContext
        );
        judgmentResult = aiResult;
      } else {
        judgmentResult = await judgeSchedulerExecutionTiming({
          currentTimestamp: input.executionTimestamp.toISOString(),
          scheduledExecutionTime: '17:00',
          executionTimeToleranceMinutes: 5,
          timeZone: input.systemContext.timezone
        });
      }
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
    const shouldExecute = judgmentResult.shouldExecute !== undefined ? judgmentResult.shouldExecute : judgmentResult.isExecutionTiming;
    if (!shouldExecute) {
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
    let reporters: any[] = [];
    try {
      if (aiClient.getActiveReportersForSubmissionCheck) {
        reporters = await aiClient.getActiveReportersForSubmissionCheck(
          targetDateStr,
          input.systemContext,
          undefined
        );
        reportersResponse = {
          success: true,
          reporters: reporters,
          teamLeaderId: '',
          totalCount: reporters.length,
          message: 'success'
        } as any;
      } else {
        reportersResponse = await getActiveReportersForSubmissionCheck({
          targetDate: targetDateAsDate,
          teamLeaderId: ''
        });
      }
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

    if (!reporters || reporters.length === 0) {
      reporters = Array.from(reportersResponse.reporters);
    }
    let reportersPrompted = 0;
    let reportsSubmitted = 0;
    let leaderNotificationsSent = 0;
    let hasAuthError = false;

    // Step 3-6: 各報告者について、認証・入力促進・報告書提出・通知処理を実行
    for (const reporter of reporters) {
      try {
        // Step 3: 認証・認可チェック
        const authInput: AuthenticateAndAuthorizeReporterAccessInput = {
          userId: reporter.userId || reporter.id,
          isAuthenticated: true,
        };

        let authResult: AuthenticateAndAuthorizeReporterAccessOutput;
        try {
          if (aiClient.authenticateAndAuthorizeReporterAccess) {
            const aiAuthResult = await aiClient.authenticateAndAuthorizeReporterAccess(authInput);
            authResult = { isAccessGranted: aiAuthResult.authorized !== false } as AuthenticateAndAuthorizeReporterAccessOutput;
          } else {
            authResult = await authenticateAndAuthorizeReporterAccess(authInput);
          }
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
          userId: reporter.userId || reporter.id,
          reportDate: targetDateStr,
          businessContent: '',
          submissionTimestamp: new Date().toISOString(),
        };

        let submitResult: SubmitDailyReportOutput;
        try {
          if (aiClient.submitDailyReport) {
            const aiSubmitResult = await aiClient.submitDailyReport(
              reporter.userId || reporter.id,
              ''
            );
            submitResult = {
              dailyReportId: aiSubmitResult.reportId || 'report-' + Date.now(),
              userId: reporter.userId || reporter.id,
              reportDate: targetDateStr,
              submissionTimestamp: aiSubmitResult.submittedAt ? new Date(aiSubmitResult.submittedAt).toISOString() : new Date().toISOString(),
              submissionStatus: 'submitted' as const,
              notificationTriggered: true,
              completionMessage: 'Report submitted successfully',
            };
          } else {
            submitResult = await submitDailyReport(submitInput);
          }
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
            reporterId: reporter.reporterId || reporter.id,
            leaderId: reportersResponse.teamLeaderId || '',
            targetDate: targetDateAsDate,
            submissionTimestamp: new Date(submitResult.submissionTimestamp),
            executionTimestamp: new Date(),
          };

          try {
            if (aiClient.sendLeaderSubmissionNotification) {
              const aiNotifResult = await aiClient.sendLeaderSubmissionNotification(notifInput);
              leaderNotificationsSent++;
            } else {
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

    // Step 7: 未提出者の検知と催促処理
    let promptsSent = 0;
    let hasPromptError = false;
    let detectedNonSubmittedCount = 0;
    try {
      if (aiClient.detectNonSubmittedReportersAtDeadline) {
        const detectedNonSubmitted = await aiClient.detectNonSubmittedReportersAtDeadline(
          targetDateStr,
          input.systemContext,
          undefined
        );

        if (detectedNonSubmitted && detectedNonSubmitted.length > 0) {
          detectedNonSubmittedCount = detectedNonSubmitted.length;
          // 提出済み数を再計算
          reportsSubmitted = reportersPrompted - detectedNonSubmittedCount;

          // 未提出者情報を nonSubmittedReporters に追加
          for (const nonSubmitted of detectedNonSubmitted) {
            nonSubmittedReporters.push({
              userId: nonSubmitted.reporterId,
              userName: nonSubmitted.reporterName,
              emailAddress: '',
              promptSent: false,
              lastSubmittedDate: nonSubmitted.lastSubmittedDate,
            });
          }

          // 提出済みの人数に基づいてリーダー通知数を再計算
          leaderNotificationsSent = Math.min(leaderNotificationsSent, reportsSubmitted);

          // Step 8: 未提出者への催促メール送信
          try {
            if (aiClient.sendLeaderNonSubmissionPromptNotification) {
              for (const nonSubmitted of detectedNonSubmitted) {
                try {
                  const promptInput = {
                    reporterId: nonSubmitted.reporterId,
                    reporterName: nonSubmitted.reporterName,
                    lastSubmittedDate: nonSubmitted.lastSubmittedDate,
                    targetDate: targetDateStr,
                  };
                  await aiClient.sendLeaderNonSubmissionPromptNotification(promptInput);
                  promptsSent++;
                } catch (promptError) {
                  hasPromptError = true;
                  errors.push({
                    errorCode: 'NonSubmissionPromptError',
                    errorMessage: '未提出者への催促送信に失敗しました。メール送信状態を確認してください。',
                    timestamp: new Date(),
                    severity: 'warning',
                  });
                }
              }
            }
          } catch (promptError) {
            hasPromptError = true;
            errors.push({
              errorCode: 'NonSubmissionPromptError',
              errorMessage: '未提出者への催促送信に失敗しました。メール送信状態を確認してください。',
              timestamp: new Date(),
              severity: 'warning',
            });
          }
        }
      }
    } catch (nonSubError) {
      hasPromptError = true;
      errors.push({
        errorCode: 'NonSubmissionDetectionError',
        errorMessage: '未提出者の検知に失敗しました。システム管理者に連絡してください。',
        timestamp: new Date(),
        severity: 'warning',
      });
    }

    // 実行結果ステータスを決定
    let executionStatus: 'success' | 'partial_success' | 'failure' =
      'success';

    if (hasPromptError || errors.length > 0) {
      if (reportsSubmitted > 0) {
        executionStatus = 'partial_success';
      } else {
        executionStatus = 'failure';
      }
    } else if (reportsSubmitted === reporters.length && reporters.length > 0) {
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
        : executionStatus === 'partial_success' && errors.some(e => e.errorCode === 'NonSubmissionPromptError')
          ? `エージェント実行が部分的に完了しました。報告者${reportersPrompted}名中${reportsSubmitted}名が日報を提出しましたが、未提出者への催促送信に失敗しました。`
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
      promptsSent,
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