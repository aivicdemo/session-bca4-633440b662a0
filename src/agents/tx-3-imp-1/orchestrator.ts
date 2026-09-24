/**
 * TX-3-IMP-1 エージェント
 * 定時確認トリガーから未提出者検知・リーダー通知・催促メール送信まで
 * 全体を統合・実行するオーケストレーター
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
  detectNonSubmittedReportersAtDeadline,
  DetectNonSubmittedOutput,
} from '../../logic/daily-report-non-submission-detection';
import {
  sendLeaderNonSubmissionPromptNotification,
} from '../../logic/daily-report-reminder-notification';
import {
  sendNonSubmissionPromptNotification,
} from '../../logic/email-notification-management';

export interface Tx3Imp1AiClient {
  invokeModel?: (prompt: string, systemPrompt?: string) => any;
  judgeSchedulerExecutionTiming?: (executionTimestamp: Date, targetDate: Date, systemContext?: SystemExecutionContext) => any;
  detectNonSubmittedReportersAtDeadline?: (reporters: Reporter[], submittedReports: any[], targetDateStr: string) => any;
  generateNonSubmissionDetectionResult?: (nonSubmittedReporters: any[], targetDate: string) => any;
  judgePromptNecessityAndMethod?: (nonSubmittedReporters: NonSubmittedReporterInfo[]) => any;
  sendLeaderNonSubmissionPromptNotification?: (params: { nonSubmittedCount: number; reporters: NonSubmittedReporterInfo[]; targetDate: string }) => any;
  sendNonSubmissionPromptNotification?: (reporters: NonSubmittedReporterInfo[]) => any;
  retrieveDailyReportsForLeaderReview?: (targetDate: string) => any;
  retrieveLeaderDashboardData?: (targetDate: string) => any;
  [key: string]: any;
}

export interface Tx3Imp1AgentInput {
  executionTimestamp: number | Date;
  targetDate: string | Date;
  leaderUserIds?: string[];
  systemContext?: SystemExecutionContext;
}

export interface NonSubmittedReporterInfo {
  reporterId: string;
  userId: string;
  reporterName: string;
  emailAddress: string;
}

export interface ProgressTrackingInfo {
  trackingId: string;
  reporterId: string;
  userId: string;
  status: 'pending' | 'notified' | 'escalated' | 'submitted';
  notificationCount: number;
  lastNotifiedAt?: Date;
  escalationRequired: boolean;
}

export interface AdditionalNotificationJudgment {
  reporterId: string;
  shouldNotify: boolean;
  notificationType: 'reminder' | 'escalation' | 'director_alert' | 'none';
  reason: string;
}

export interface AgentExecutionError {
  errorCode: string;
  errorMessage: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error';
}

export interface Tx3Imp1AgentOutput {
  executionStatus: 'success' | 'partial_success' | 'partial_failure' | 'failure';
  executionTimestamp?: number | Date;
  targetDate?: string;
  nonSubmittedCount?: number;
  nonSubmittedReporters?: NonSubmittedReporterInfo[];
  leaderNotificationsSent?: number;
  reminderEmailsSent?: number;
  progressTrackingRecords?: ProgressTrackingInfo[];
  escalationNotifications?: AdditionalNotificationJudgment[];
  errors?: AgentExecutionError[];
  executionSummary?: string;
  detectionResult?: any;
  leaderNotificationStatus?: any[];
  promptNotificationStatus?: any[];
  dashboardData?: any;
  [key: string]: any;
}

/**
 * TX-3-IMP-1 エージェントを実行する
 * 定時確認トリガーから未提出者検知、リーダー通知、催促メール送信まで一貫実行
 */
export async function runTx3Imp1Agent(
  input: Tx3Imp1AgentInput,
  aiClient: Tx3Imp1AiClient
): Promise<Tx3Imp1AgentOutput> {
  const errors: AgentExecutionError[] = [];
  const nonSubmittedReporters: NonSubmittedReporterInfo[] = [];
  const progressTrackingRecords: ProgressTrackingInfo[] = [];
  const escalationNotifications: AdditionalNotificationJudgment[] = [];

  // Normalize inputs
  const targetDateAsDate = typeof input.targetDate === 'string'
    ? new Date(input.targetDate)
    : (typeof input.targetDate === 'number'
        ? new Date(input.targetDate)
        : input.targetDate);

  const executionTimestampAsDate = typeof input.executionTimestamp === 'number'
    ? new Date(input.executionTimestamp)
    : input.executionTimestamp;

  const targetDateStr = targetDateAsDate.toISOString().split('T')[0];

  try {
    // Action 1: 定時確認トリガー
    let judgmentResult: JudgeSchedulerExecutionTimingOutput;
    try {
      judgmentResult = judgeSchedulerExecutionTiming({
        currentTimestamp: executionTimestampAsDate.toISOString(),
        scheduledExecutionTime: '17:00',
        executionTimeToleranceMinutes: 5,
        timeZone: input.systemContext.timezone
      });
    } catch (error) {
      const errorCode = (error as any)?.name || 'SchedulerExecutionTimingError';
      const errorMessage =
        (error as any)?.message ||
        'スケジューラ実行タイミングの判定に失敗しました。';

      errors.push({
        errorCode,
        errorMessage,
        timestamp: new Date(),
        severity: 'error',
      });

      return {
        executionStatus: 'failure',
        executionTimestamp: input.executionTimestamp,
        targetDate: targetDateStr,
        nonSubmittedCount: 0,
        nonSubmittedReporters: [],
        leaderNotificationsSent: 0,
        reminderEmailsSent: 0,
        progressTrackingRecords: [],
        escalationNotifications: [],
        errors,
        executionSummary: 'エージェント実行に失敗しました。スケジューラタイミング判定エラーが発生しました。',
      };
    }

    // 実行タイミングが不適切な場合は終了
    if (!judgmentResult.shouldExecute) {
      return {
        executionStatus: 'success',
        executionTimestamp: input.executionTimestamp,
        targetDate: targetDateStr,
        nonSubmittedCount: 0,
        nonSubmittedReporters: [],
        leaderNotificationsSent: 0,
        reminderEmailsSent: 0,
        progressTrackingRecords: [],
        escalationNotifications: [],
        errors: [],
        executionSummary: '実行時刻外のため、エージェント処理はスキップされました。',
      };
    }

    // アクティブな報告者を取得（AIクライアント経由で実装）
    let reportersResponse: GetActiveReportersForSubmissionCheckOutput;
    try {
      reportersResponse = await getActiveReportersForSubmissionCheck({
        targetDate: targetDateAsDate,
        teamLeaderId: ''
      }); // TODO: aiClient経由に変更
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
        executionTimestamp: input.executionTimestamp,
        targetDate: targetDateStr,
        nonSubmittedCount: 0,
        nonSubmittedReporters: [],
        leaderNotificationsSent: 0,
        reminderEmailsSent: 0,
        progressTrackingRecords: [],
        escalationNotifications: [],
        errors,
        executionSummary: 'エージェント実行に失敗しました。報告者情報取得エラーが発生しました。',
      };
    }

    // reportersResponse が null や undefined の場合、またはreportersが空の場合はスキップ
    if (!reportersResponse || !reportersResponse.success || !reportersResponse.reporters || reportersResponse.reporters.length === 0) {
      return {
        executionStatus: 'success',
        executionTimestamp: input.executionTimestamp,
        targetDate: targetDateStr,
        nonSubmittedCount: 0,
        nonSubmittedReporters: [],
        leaderNotificationsSent: 0,
        reminderEmailsSent: 0,
        progressTrackingRecords: [],
        escalationNotifications: [],
        errors: [],
        executionSummary: '対象報告者が見つかりませんでした。',
        detectionResult: { nonSubmittedReporters: [] },
      };
    }

    const reporters = reportersResponse.reporters;
    const submittedReports = []; // 実装時に提出済み報告書一覧を取得

    // Action 2: 未提出者リスト生成
    let detectionResult: DetectNonSubmittedOutput;
    try {
      // targetDateStr is already defined
      detectionResult = await detectNonSubmittedReportersAtDeadline(
        reporters,
        submittedReports,
        targetDateStr
      );
    } catch (error) {
      const errorMessage =
        (error as any)?.message || '未提出者検知に失敗しました。';
      errors.push({
        errorCode: 'NonSubmissionDetectionError',
        errorMessage,
        timestamp: new Date(),
        severity: 'error',
      });

      return {
        executionStatus: 'failure',
        executionTimestamp: input.executionTimestamp,
        targetDate: targetDateStr,
        nonSubmittedCount: 0,
        nonSubmittedReporters: [],
        leaderNotificationsSent: 0,
        reminderEmailsSent: 0,
        progressTrackingRecords: [],
        escalationNotifications: [],
        errors,
        executionSummary: 'エージェント実行に失敗しました。未提出者検知エラーが発生しました。',
      };
    }

    // 未提出者情報を構築
    for (const reporter of detectionResult.nonSubmittedReporters) {
      const reporterInfo: NonSubmittedReporterInfo = {
        reporterId: reporter.userId,
        userId: reporter.userId,
        reporterName: reporter.reporterName || reporter.userName || '不明',
        emailAddress: (reporter as any).emailAddress || 'unknown@example.com',
      };
      nonSubmittedReporters.push(reporterInfo);

      // 進捗追跡レコード作成
      progressTrackingRecords.push({
        trackingId: `track-${Date.now()}-${reporter.userId}`,
        reporterId: reporter.userId,
        userId: reporter.userId,
        status: 'pending',
        notificationCount: 0,
        escalationRequired: false,
      });
    }

    let leaderNotificationsSent = 0;
    let reminderEmailsSent = 0;

    // Action 3: リーダー通知送信
    if (nonSubmittedReporters.length > 0) {
      try {
        // リーダーへの一括通知
        const leaderNotificationResult = await sendLeaderNonSubmissionPromptNotification({
          nonSubmittedCount: nonSubmittedReporters.length,
          reporters: nonSubmittedReporters,
          targetDate: targetDateStr,
        });

        leaderNotificationsSent = leaderNotificationResult.sent || 0;

        // 進捗追跡レコード更新
        for (const tracking of progressTrackingRecords) {
          tracking.status = 'notified';
          tracking.notificationCount = 1;
          tracking.lastNotifiedAt = new Date();
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
    }

    // Action 4: 催促メール送信
    if (nonSubmittedReporters.length > 0) {
      try {
        const emailResult = await sendNonSubmissionPromptNotification(
          nonSubmittedReporters
        );
        reminderEmailsSent = emailResult.sent || 0;
      } catch (error) {
        const errorMessage =
          (error as any)?.message || '催促メール送信に失敗しました。';
        errors.push({
          errorCode: 'ReminderEmailError',
          errorMessage,
          timestamp: new Date(),
          severity: 'warning',
        });
      }
    }

    // Action 5: 進捗追跡
    // 進捗追跡レコードは既に作成済み
    for (const tracking of progressTrackingRecords) {
      tracking.status = reminderEmailsSent > 0 ? 'notified' : 'pending';
    }

    // Action 6: 追加通知判定
    for (const tracking of progressTrackingRecords) {
      // 通知回数と経過時間に基づいて追加通知判定
      const shouldEscalate = tracking.notificationCount >= 1;
      const notificationType = shouldEscalate ? 'escalation' : 'reminder';

      const judgment: AdditionalNotificationJudgment = {
        reporterId: tracking.reporterId,
        shouldNotify: shouldEscalate,
        notificationType,
        reason: shouldEscalate
          ? '初回通知後も未提出のため、段階的な催促を実施'
          : '初回通知を予定',
      };

      escalationNotifications.push(judgment);

      if (shouldEscalate) {
        tracking.escalationRequired = true;
        tracking.status = 'escalated';
      }
    }

    // 実行結果ステータスを決定
    let executionStatus: 'success' | 'partial_success' | 'failure' = 'success';

    if (errors.length > 0) {
      const hasErrorSeverityError = errors.some((e) => e.severity === 'error');
      if (hasErrorSeverityError) {
        executionStatus = 'failure';
      } else if (
        leaderNotificationsSent < nonSubmittedReporters.length ||
        reminderEmailsSent < nonSubmittedReporters.length
      ) {
        executionStatus = 'partial_success';
      }
    }

    // サマリー作成
    const escalationCount = escalationNotifications.filter(
      (n) => n.shouldNotify
    ).length;
    const executionSummary =
      executionStatus === 'success'
        ? `エージェント実行が完了しました。未提出者${detectionResult.count}名を検知し、リーダー通知${leaderNotificationsSent}件、催促メール${reminderEmailsSent}件を送信しました。${escalationCount}名に対し追加通知が判定されました。`
        : executionStatus === 'partial_success'
          ? `エージェント実行が部分的に完了しました。未提出者${detectionResult.count}名を検知し、リーダー通知${leaderNotificationsSent}件、催促メール${reminderEmailsSent}件を送信しました。一部の処理が失敗しました。`
          : `エージェント実行に失敗しました。`;

    return {
      executionStatus,
      executionTimestamp: input.executionTimestamp,
      targetDate: targetDateStr,
      nonSubmittedCount: nonSubmittedReporters.length,
      nonSubmittedReporters,
      leaderNotificationsSent,
      reminderEmailsSent,
      progressTrackingRecords,
      escalationNotifications,
      errors: errors.length > 0 ? errors : undefined,
      executionSummary,
      detectionResult,
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
      executionTimestamp: input.executionTimestamp,
      targetDate: targetDateStr,
      nonSubmittedCount: 0,
      nonSubmittedReporters: [],
      leaderNotificationsSent: 0,
      reminderEmailsSent: 0,
      progressTrackingRecords: [],
      escalationNotifications: [],
      errors,
      executionSummary: 'エージェント実行に失敗しました。予期しないエラーが発生しました。',
    };
  }
}

/**
 * NonSubmittedReporter
 */
export interface NonSubmittedReporter {
  /** 未提出者のユーザーID。 */
  userId: string;
  /** 未提出者のユーザー名。 */
  userName: string;
  /** 未提出者のメールアドレス。 */
  emailAddress: string;
  /** 催促優先度（high / medium / low）。 */
  promptPriority: string;
}

/**
 * NotificationStatus
 */
export interface NotificationStatus {
  /** 通知受信者のユーザーID。 */
  recipientUserId: string;
  /** 通知タイプ（leader_notification / prompt_notification）。 */
  notificationType: string;
  /** 送信ステータス（success / failure）。 */
  sendStatus: string;
  /** メール送信履歴ID（失敗時はnull）。 */
  emailSendingHistoryId?: string | null;
  /** エラーメッセージ（失敗時のみ）。 */
  errorMessage?: string | null;
}

/**
 * DailyReportSummary
 */
export interface DailyReportSummary {
  /** 日報ID。 */
  reportId: string;
  /** 報告者のユーザーID。 */
  userId: string;
  /** 報告者のユーザー名。 */
  userName: string;
  /** 提出タイムスタンプ。 */
  submissionTimestamp: number;
}

/**
 * DetectionLogSummary
 */
export interface DetectionLogSummary {
  /** 検知ログID。 */
  detectionLogId: string;
  /** 検知対象日付。 */
  targetDate: string;
  /** 検知実行タイムスタンプ。 */
  detectionTimestamp: number;
  /** 未提出者数。 */
  nonSubmittedCount: number;
}

/**
 * PromptNotificationSummary
 */
export interface PromptNotificationSummary {
  /** 送信した催促メール総数。 */
  totalSent: number;
  /** 送信成功数。 */
  successCount: number;
  /** 送信失敗数。 */
  failureCount: number;
}
