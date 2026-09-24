/**
 * TX-2-IMP-1 エージェント
 * 日報提出状況の一括確認と段階的催促・通知管理システムのオーケストレーター
 */

import { NonSubmittedReporterInfo } from '../tx-1-imp-1/orchestrator';
import { buildAction01Prompt } from './prompts/action-01';
import { buildAction02Prompt } from './prompts/action-02';
import { buildAction03Prompt } from './prompts/action-03';
import { buildAction04Prompt } from './prompts/action-04';
import { buildAction05Prompt } from './prompts/action-05';

export interface Tx2Imp1AiClient {
  invokeModel?: (prompt: string, systemPrompt?: string) => any;
  judgeSchedulerExecutionTiming?: () => any;
  detectNonSubmittedReportersAtDeadline?: () => any;
  judgePromptNecessityAndMethod?: () => any;
  sendLeaderNonSubmissionPromptNotification?: () => any;
  sendLeaderSubmissionNotification?: (leaderUserId: string) => any;
  retrieveLeaderDashboardData?: () => any;
  [key: string]: any;
}

export interface Tx2Imp1AgentInput {
  executionTimestamp?: Date | number | string;
  targetDate?: Date | string;
  systemContext?: SystemExecutionContext;
  leaderUserIds?: string[];
  [key: string]: any;
}

export interface SystemExecutionContext {
  timezone?: string;
  locale?: string;
  businessDayDeadlineHour?: number;
  [key: string]: any;
}

export interface SubmissionStatus {
  employeeId: string;
  employeeName: string;
  emailAddress: string;
  isSubmitted: boolean;
  submissionCount: number;
  lastRemindedAt?: Date;
  remindCount: number;
  reminderLevel: 'initial' | 'second' | 'escalated' | 'critical';
}

export interface ReminderResult {
  employeeId: string;
  reminderSent: boolean;
  reminderLevel: 'initial' | 'second' | 'escalated' | 'critical';
  message?: string;
}

export interface AgentExecutionError {
  errorCode: string;
  errorMessage: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error';
}

export interface Tx2Imp1AgentOutput {
  executionStatus: 'success' | 'partial_success' | 'failure';
  totalEmployees?: number;
  submittedCount?: number;
  nonSubmittedCount?: number;
  remindersInitial?: number;
  remindersSecond?: number;
  remindersEscalated?: number;
  remindersCritical?: number;
  reportGenerated?: boolean;
  nonSubmittedEmployees?: SubmissionStatus[];
  targetDate?: string;
  detectionResult?: any;
  promptNotificationsSent?: any[];
  leaderNotificationsSent?: any[];
  dashboardData?: any;
  executionTimestamp?: number;
  errors?: AgentExecutionError[];
  executionSummary: string;
  [key: string]: any;
}

/**
 * TX-2-IMP-1 エージェントを実行する
 * 毎日定時に全従業員の日報提出状況を確認し、段階的催促と通知を管理する
 */
export async function runTx2Imp1Agent(
  input: Tx2Imp1AgentInput,
  aiClient: Tx2Imp1AiClient
): Promise<Tx2Imp1AgentOutput> {
  const errors: AgentExecutionError[] = [];
  const nonSubmittedEmployees: SubmissionStatus[] = [];
  const leaderNotificationsSent: any[] = [];
  const promptNotificationsSent: any[] = [];

  try {
    // 入力値の正規化
    const executionTimestamp = typeof input.executionTimestamp === 'number'
      ? input.executionTimestamp
      : input.executionTimestamp instanceof Date
        ? input.executionTimestamp.getTime()
        : Date.now();

    const targetDate = typeof input.targetDate === 'string'
      ? input.targetDate
      : input.targetDate instanceof Date
        ? input.targetDate.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

    const leaderUserIds = input.leaderUserIds || [];

    // Step 1: スケジューラ実行タイミング判定
    if (aiClient.judgeSchedulerExecutionTiming) {
      const judgmentResult = await aiClient.judgeSchedulerExecutionTiming();
      if (judgmentResult && !judgmentResult.isExecutionTime && !judgmentResult.shouldExecute) {
        return {
          executionStatus: 'success',
          targetDate,
          executionTimestamp,
          leaderNotificationsSent: [],
          promptNotificationsSent: [],
          detectionResult: { nonSubmittedReporterIds: [], detectionCount: 0 },
          executionSummary: '実行時刻外のため、エージェント処理はスキップされました。',
        };
      }
    }

    // Step 2: 非提出者検出
    let detectionResult: any = { nonSubmittedReporterIds: [], detectionCount: 0 };
    if (aiClient.detectNonSubmittedReportersAtDeadline) {
      detectionResult = await aiClient.detectNonSubmittedReportersAtDeadline();
    } else {
      // Fallback: プロンプトベースの提出状況確認
      try {
        const action01Prompt = buildAction01Prompt({
          executionTimestamp,
          targetDate,
          systemContext: input.systemContext,
        });

        const action01Response = aiClient.invokeModel
          ? await aiClient.invokeModel(action01Prompt)
          : '[]';

        const submissionStatuses = parseSubmissionStatuses(action01Response);
        const nonSubmittedCount = submissionStatuses.filter(s => !s.isSubmitted).length;
        detectionResult = {
          nonSubmittedReporterIds: submissionStatuses.filter(s => !s.isSubmitted).map(s => s.employeeId),
          detectionCount: nonSubmittedCount,
        };
      } catch (error) {
        const errorMessage = (error as any)?.message || '提出状況の確認に失敗しました。';
        errors.push({
          errorCode: 'SubmissionStatusCheckError',
          errorMessage,
          timestamp: new Date(),
          severity: 'error',
        });
      }
    }

    const hasNonSubmitted = detectionResult &&
      detectionResult.nonSubmittedReporterIds &&
      detectionResult.nonSubmittedReporterIds.length > 0;

    // Step 3: 催促必要性判定
    if (hasNonSubmitted && aiClient.judgePromptNecessityAndMethod) {
      await aiClient.judgePromptNecessityAndMethod();
    }

    // Step 4: 未提出者への催促メール送信
    if (hasNonSubmitted && aiClient.sendLeaderNonSubmissionPromptNotification) {
      const promptResult = await aiClient.sendLeaderNonSubmissionPromptNotification();
      if (promptResult && promptResult.sent) {
        promptNotificationsSent.push(promptResult);
      }
    } else if (hasNonSubmitted && aiClient.invokeModel) {
      // Fallback: プロンプトベースの催促
      try {
        const action03Prompt = buildAction03Prompt({
          employeeName: 'Employee',
          emailAddress: 'employee@company.com',
          targetDate,
          systemContext: input.systemContext,
        });

        await aiClient.invokeModel(action03Prompt);
        promptNotificationsSent.push({ sent: true });
      } catch (error) {
        const errorMessage = (error as any)?.message || '催促メール送信に失敗しました。';
        errors.push({
          errorCode: 'ReminderError',
          errorMessage,
          timestamp: new Date(),
          severity: 'warning',
        });
      }
    }

    // Step 5: リーダーへの提出状況報告
    for (const leaderUserId of leaderUserIds) {
      if (aiClient.sendLeaderSubmissionNotification) {
        try {
          const notificationResult = await aiClient.sendLeaderSubmissionNotification(leaderUserId);
          leaderNotificationsSent.push({
            leaderUserId,
            ...notificationResult,
          });
        } catch (error) {
          const errorMessage = (error as any)?.message || 'リーダー通知送信に失敗しました。';
          errors.push({
            errorCode: 'LeaderNotificationError',
            errorMessage,
            timestamp: new Date(),
            severity: 'warning',
          });
        }
      }
    }

    // Step 6: ダッシュボードデータ取得
    let dashboardData: any = null;
    if (aiClient.retrieveLeaderDashboardData) {
      dashboardData = await aiClient.retrieveLeaderDashboardData();
    }

    // Step 7: レポート生成 (Action 5)
    if (aiClient.invokeModel) {
      try {
        const action05Prompt = buildAction05Prompt({
          totalEmployees: detectionResult?.totalEmployees || 0,
          submittedCount: detectionResult?.submittedCount || 0,
          nonSubmittedCount: detectionResult?.detectionCount || 0,
          nonSubmittedEmployees,
          remindersInitial: promptNotificationsSent.length,
          remindersSecond: 0,
          remindersEscalated: 0,
          remindersCritical: 0,
          targetDate,
          systemContext: input.systemContext,
        });

        await aiClient.invokeModel(action05Prompt);
      } catch (error) {
        // Report generation failure is non-critical
        console.warn('Report generation failed', error);
      }
    }

    // 実行結果ステータスを決定
    let executionStatus: 'success' | 'partial_success' | 'failure' = 'success';
    if (errors.some(e => e.severity === 'error')) {
      executionStatus = 'failure';
    } else if (errors.length > 0) {
      executionStatus = 'partial_success';
    }

    // サマリー作成
    const executionSummary =
      executionStatus === 'success'
        ? `エージェント実行が完了しました。${detectionResult?.detectionCount || 0}名の未提出者に対して${promptNotificationsSent.length}件の催促メールを送信し、${leaderUserIds.length}名のリーダーに提出状況報告を送信しました。`
        : `エージェント実行が${executionStatus === 'partial_success' ? '部分的に' : ''}完了${executionStatus === 'failure' ? 'しました' : 'しました'}。`;

    return {
      executionStatus,
      targetDate,
      executionTimestamp,
      detectionResult,
      promptNotificationsSent,
      leaderNotificationsSent,
      dashboardData,
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
      executionSummary: 'エージェント実行に失敗しました。予期しないエラーが発生しました。',
      errors,
    };
  }
}

/**
 * AI応答をパースして提出状況を抽出
 */
function parseSubmissionStatuses(response: string): SubmissionStatus[] {
  // 実装例: JSON形式での応答をパース
  try {
    const parsed = JSON.parse(response);
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => ({
        employeeId: item.employeeId || '',
        employeeName: item.employeeName || '',
        emailAddress: item.emailAddress || '',
        isSubmitted: item.isSubmitted === true,
        submissionCount: item.submissionCount || 0,
        lastRemindedAt: item.lastRemindedAt ? new Date(item.lastRemindedAt) : undefined,
        remindCount: item.remindCount || 0,
        reminderLevel: item.reminderLevel || 'initial',
      }));
    }
  } catch {
    // JSON解析失敗時は空配列を返す
    console.warn('Failed to parse submission statuses');
  }
  return [];
}

/**
 * 催促回数に基づいて催促レベルを決定
 */
function determineReminderLevel(remindCount: number): 'initial' | 'second' | 'escalated' | 'critical' {
  if (remindCount === 0) {
    return 'initial';
  } else if (remindCount === 1) {
    return 'second';
  } else if (remindCount === 2) {
    return 'escalated';
  } else {
    return 'critical';
  }
}

/**
 * NonSubmissionDetectionResult
 */
export interface NonSubmissionDetectionResult {
  /** 未提出者のユーザーID配列。 */
  nonSubmittedReporterIds: string[];
  /** 記録された検知ログのID。 */
  detectionLogId: string;
  /** 検知された未提出者の人数。 */
  detectionCount: number;
}

/**
 * PromptNotificationRecord
 */
export interface PromptNotificationRecord {
  /** 催促メール送信先の報告者ユーザーID。 */
  reporterUserId: string;
  /** メール送信履歴のID。 */
  emailSendingHistoryId: string;
  /** メール送信のステータス。 */
  sendingStatus: 'success' | 'failed';
  /** メール送信時刻のUnixタイムスタンプ（ミリ秒）。 */
  sentTimestamp: number;
}

/**
 * LeaderNotificationRecord
 */
export interface LeaderNotificationRecord {
  /** 提出状況報告メール送信先のリーダーユーザーID。 */
  leaderUserId: string;
  /** メール送信履歴のID。 */
  emailSendingHistoryId: string;
  /** メール送信のステータス。 */
  sendingStatus: 'success' | 'failed';
  /** メール送信時刻のUnixタイムスタンプ（ミリ秒）。 */
  sentTimestamp: number;
}

/**
 * LeaderDashboardData
 */
export interface LeaderDashboardData {
  /** 提出済み日報の件数。 */
  submittedReportCount: number;
  /** 未提出者の人数。 */
  nonSubmittedReporterCount: number;
  /** 未提出者の詳細情報。 */
  nonSubmittedReporters: NonSubmittedReporterInfo[];
  /** 催促メール送信の成功・失敗件数。 */
  promptNotificationStatus: { sent: number; failed: number };
}
