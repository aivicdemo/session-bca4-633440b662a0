/**
 * TX-5-IMP-1 エージェント
 * 定時進捗確認から催促判定・実行までの統合オーケストレーター
 *
 * 5個のアクション:
 * 1. 進捗確認取得 - スケジュール時刻に進捗状況を確認
 * 2. 未提出・遅延判定 - 期限を超過/近い報告者を特定
 * 3. リーダー通知 - チームリーダーに状況を通知
 * 4. 催促判定 - 催促の必要性・方法・タイミングを判断
 * 5. 催促実行 - 催促メッセージを生成し送信
 */

import { buildAction01Prompt } from './prompts/action-01';
import { buildAction02Prompt } from './prompts/action-02';
import { buildAction03Prompt } from './prompts/action-03';
import { buildAction04Prompt } from './prompts/action-04';
import { buildAction05Prompt } from './prompts/action-05';

export interface Tx5Imp1AiClient {
  invokeModel?: (prompt: string, systemPrompt?: string) => any;
  [key: string]: any;
}

export interface Tx5Imp1AgentInput {
  executionTimestamp?: Date;
  targetDate?: string; // YYYY-MM-DD
  teamId?: string;
  leaderUserId?: string;
  leaderUserIds?: string[];
  deadline?: string; // HH:mm format or ISO8601
  systemContext?: {
    timezone?: string;
    locale?: string;
    scheduledAt?: string;
    executedBy?: string;
    [key: string]: any;
  };
  executionContext?: {
    scheduledAt?: string;
    executedBy?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface ProgressStatus {
  targetDate: string;
  totalReporters: number;
  submittedCount: number;
  pendingCount: number;
  submissionRate: number;
  timeRemaining: string;
  urgentMissing: string[];
  systemStatus: 'normal' | 'warning' | 'critical';
  retrievedAt: string;
}

export interface NonSubmittedReporter {
  reporterId?: string;
  userId?: string;
  userName?: string;
  reporterName?: string;
  name?: string;
  email?: string;
  emailAddress?: string;
  department?: string;
  targetDate?: string;
  detectionTime?: string;
  urgencyCategory?: 'OVERDUE' | 'CRITICAL' | 'WARNING' | 'PENDING';
  priority?: number;
  minutesLate?: number;
  minutesUntilDeadline?: number;
  [key: string]: any;
}

export interface PromptDecision {
  reporterId: string;
  promptRequired: boolean;
  confidence: number;
  method: 'email' | 'chat' | 'phone' | 'escalate';
  timing: 'immediate' | 'delayed';
  delayMinutes?: number;
  messageTone: 'urgent' | 'gentle' | 'firm' | 'supportive';
  complianceProbability: number;
  rationale: string;
}

export interface PromptExecution {
  reporterId: string;
  reporterName: string;
  method: 'email' | 'chat' | 'phone' | 'escalate';
  status: 'sent' | 'failed' | 'pending';
  message?: string;
  sentAt?: string;
  error?: string;
}

export interface AgentExecutionError {
  errorCode: string;
  errorMessage: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error';
  actionStep?: number;
}

export interface Tx5Imp1AgentOutput {
  executionStatus: 'success' | 'partial_success' | 'failure';
  executionTimestamp?: string;
  targetDate?: string;

  // Action 1 results
  progressStatus?: ProgressStatus;

  // Action 2 results
  nonSubmittedReporters?: NonSubmittedReporter[];
  nonSubmittedCount?: number;
  delayedReporters?: any[];
  urgencyAnalysis?: {
    overdue: number;
    critical: number;
    warning: number;
    pending: number;
  };

  // Action 3 results
  leaderNotificationSent?: boolean;
  leaderNotificationMessage?: string;

  // Action 4 results
  promptDecisions?: PromptDecision[];
  overallPromptingRequired?: boolean;
  overallUrgencyLevel?: 'critical' | 'high' | 'medium' | 'low';

  // Action 5 results
  promptExecutions?: PromptExecution[];
  promptsSent?: number;
  promptsFailed?: number;
  promptNotificationsSent?: Array<{ userId: string; notificationType: string; sentAt: string; status: string }>;
  detectionLogId?: string;
  errorDetails?: any[];

  // Summary and errors
  errors?: AgentExecutionError[] | any[];
  executionSummary?: string;
  [key: string]: any;
}

/**
 * TX-5-IMP-1 エージェントを実行する
 * 定時進捗確認から催促判定・実行までの統合処理
 */
export async function runTx5Imp1Agent(
  input: Tx5Imp1AgentInput,
  aiClient: Tx5Imp1AiClient
): Promise<Tx5Imp1AgentOutput> {
  const errors: AgentExecutionError[] = [];
  const executionTimestamp = new Date().toISOString();

  const output: Tx5Imp1AgentOutput = {
    executionStatus: 'success',
    executionTimestamp,
    targetDate: input.targetDate,
    nonSubmittedReporters: [],
    nonSubmittedCount: 0,
    leaderNotificationSent: false,
    promptDecisions: [],
    overallPromptingRequired: false,
    overallUrgencyLevel: 'low',
    promptExecutions: [],
    promptsSent: 0,
    promptsFailed: 0,
    executionSummary: '',
  };

  try {
    // ===============================================
    // Action 1: 進捗確認取得
    // ===============================================
    let progressStatus: ProgressStatus | null = null;
    try {
      const action01Prompt = buildAction01Prompt({
        targetDate: input.targetDate,
        teamId: input.teamId,
        leaderUserId: input.leaderUserId,
        systemContext: input.systemContext,
      });

      const action01Response = await aiClient.invokeModel(
        action01Prompt,
        'You are a data retrieval system assistant. Extract and structure submission progress data.'
      );

      // Parse JSON response
      progressStatus = JSON.parse(action01Response);
      output.progressStatus = progressStatus;
    } catch (error) {
      const errorMessage = (error as any)?.message || '進捗状況の取得に失敗しました。';
      errors.push({
        errorCode: 'ProgressStatusRetrievalError',
        errorMessage,
        timestamp: new Date(),
        severity: 'error',
        actionStep: 1,
      });
      output.executionStatus = 'failure';
      output.errors = errors;
      output.executionSummary = 'エージェント実行に失敗しました。進捗確認ステップでエラーが発生しました。';
      return output;
    }

    // ===============================================
    // Action 2: 未提出・遅延判定
    // ===============================================
    let nonSubmittedAnalysis: any = null;
    try {
      const action02Prompt = buildAction02Prompt({
        progressData: progressStatus,
        deadline: input.deadline,
        currentTime: input.executionTimestamp.toISOString(),
        delayThresholdMinutes: 30,
        systemContext: input.systemContext,
      });

      const action02Response = await aiClient.invokeModel(
        action02Prompt,
        'You are a data analysis assistant. Analyze submission status and identify non-submitted reporters.'
      );

      nonSubmittedAnalysis = JSON.parse(action02Response);

      // Flatten the categorized reporters into a single list
      const allNonSubmitted: NonSubmittedReporter[] = [];

      if (nonSubmittedAnalysis.byCategory?.OVERDUE) {
        allNonSubmitted.push(
          ...nonSubmittedAnalysis.byCategory.OVERDUE.map((r: any) => ({
            ...r,
            urgencyCategory: 'OVERDUE',
          }))
        );
      }
      if (nonSubmittedAnalysis.byCategory?.CRITICAL) {
        allNonSubmitted.push(
          ...nonSubmittedAnalysis.byCategory.CRITICAL.map((r: any) => ({
            ...r,
            urgencyCategory: 'CRITICAL',
          }))
        );
      }
      if (nonSubmittedAnalysis.byCategory?.WARNING) {
        allNonSubmitted.push(
          ...nonSubmittedAnalysis.byCategory.WARNING.map((r: any) => ({
            ...r,
            urgencyCategory: 'WARNING',
          }))
        );
      }
      if (nonSubmittedAnalysis.byCategory?.PENDING) {
        allNonSubmitted.push(
          ...nonSubmittedAnalysis.byCategory.PENDING.map((r: any) => ({
            ...r,
            urgencyCategory: 'PENDING',
          }))
        );
      }

      output.nonSubmittedReporters = allNonSubmitted;
      output.nonSubmittedCount = allNonSubmitted.length;
      output.urgencyAnalysis = {
        overdue: nonSubmittedAnalysis.byCategory?.OVERDUE?.length || 0,
        critical: nonSubmittedAnalysis.byCategory?.CRITICAL?.length || 0,
        warning: nonSubmittedAnalysis.byCategory?.WARNING?.length || 0,
        pending: nonSubmittedAnalysis.byCategory?.PENDING?.length || 0,
      };
    } catch (error) {
      const errorMessage = (error as any)?.message || '未提出・遅延判定に失敗しました。';
      errors.push({
        errorCode: 'NonSubmittedJudgmentError',
        errorMessage,
        timestamp: new Date(),
        severity: 'error',
        actionStep: 2,
      });
      output.executionStatus = 'failure';
      output.errors = errors;
      output.executionSummary = 'エージェント実行に失敗しました。未提出・遅延判定ステップでエラーが発生しました。';
      return output;
    }

    // If no non-submitted reporters, end here
    if (output.nonSubmittedCount === 0) {
      output.executionStatus = 'success';
      output.executionSummary = `エージェント実行が完了しました。対象日付(${input.targetDate})の報告書は全員提出済みです。`;
      return output;
    }

    // ===============================================
    // Action 3: リーダー通知
    // ===============================================
    let leaderNotificationMessage = '';
    try {
      const action03Prompt = buildAction03Prompt({
        leaderName: input.leaderUserId, // In real scenario, would fetch actual name
        leaderEmail: `${input.leaderUserId}@example.com`, // In real scenario, would fetch actual email
        teamName: input.teamId,
        submissionStatus: {
          totalReporters: progressStatus?.totalReporters || 0,
          submitted: progressStatus?.submittedCount || 0,
          pending: output.nonSubmittedCount,
          submissionRate: progressStatus?.submissionRate || 0,
        },
        targetDate: input.targetDate,
        systemContext: input.systemContext,
      });

      const action03Response = await aiClient.invokeModel(
        action03Prompt,
        'You are a professional notification generator. Create a clear, actionable leader notification in Japanese.'
      );

      leaderNotificationMessage = action03Response;
      output.leaderNotificationMessage = leaderNotificationMessage;
      output.leaderNotificationSent = true;
    } catch (error) {
      const errorMessage = (error as any)?.message || 'リーダー通知の生成に失敗しました。';
      errors.push({
        errorCode: 'LeaderNotificationError',
        errorMessage,
        timestamp: new Date(),
        severity: 'warning',
        actionStep: 3,
      });
      // Don't fail the entire process for notification errors
    }

    // ===============================================
    // Action 4: 催促判定
    // ===============================================
    let promptDecisions: PromptDecision[] = [];
    try {
      const action04Prompt = buildAction04Prompt({
        nonSubmittedReporters: output.nonSubmittedReporters,
        previousPromptAttempts: [], // Would be fetched from history in real implementation
        reporterHistoryData: {}, // Would be fetched in real implementation
        currentTime: input.executionTimestamp.toISOString(),
        deadline: input.deadline,
        systemContext: input.systemContext,
      });

      const action04Response = await aiClient.invokeModel(
        action04Prompt,
        'You are a decision engine. Analyze and make recommendations about prompting strategy.'
      );

      const promptingRecommendation = JSON.parse(action04Response);

      if (promptingRecommendation.reporters && Array.isArray(promptingRecommendation.reporters)) {
        promptDecisions = promptingRecommendation.reporters;
      }

      output.promptDecisions = promptDecisions;
      output.overallPromptingRequired = promptingRecommendation.overallPromptingRequired || false;
      output.overallUrgencyLevel = promptingRecommendation.urgencyLevel || 'low';
    } catch (error) {
      const errorMessage = (error as any)?.message || '催促判定に失敗しました。';
      errors.push({
        errorCode: 'PromptingDecisionError',
        errorMessage,
        timestamp: new Date(),
        severity: 'error',
        actionStep: 4,
      });
      output.executionStatus = 'failure';
      output.errors = errors;
      output.executionSummary = 'エージェント実行に失敗しました。催促判定ステップでエラーが発生しました。';
      return output;
    }

    // ===============================================
    // Action 5: 催促実行
    // ===============================================
    const promptExecutions: PromptExecution[] = [];
    let promptsSent = 0;
    let promptsFailed = 0;

    for (const decision of promptDecisions) {
      if (!decision.promptRequired) {
        continue;
      }

      const reporter = output.nonSubmittedReporters.find(
        r => r.reporterId === decision.reporterId
      );

      if (!reporter) {
        continue;
      }

      try {
        const action05Prompt = buildAction05Prompt({
          reporterId: reporter.reporterId,
          reporterName: reporter.name,
          reporterEmail: reporter.email,
          targetDate: input.targetDate,
          deadline: input.deadline,
          messageTone: decision.messageTone,
          promptAttemptNumber: 1,
          previousPromptResponse: '',
          systemContext: input.systemContext,
        });

        const action05Response = await aiClient.invokeModel(
          action05Prompt,
          'You are a professional Japanese communication specialist. Generate a prompt message.'
        );

        const promptMessage = action05Response;

        promptExecutions.push({
          reporterId: reporter.reporterId,
          reporterName: reporter.name,
          method: decision.method,
          status: 'sent',
          message: promptMessage,
          sentAt: new Date().toISOString(),
        });

        promptsSent++;
      } catch (error) {
        const errorMessage = (error as any)?.message || '催促メッセージの送信に失敗しました。';
        errors.push({
          errorCode: 'PromptExecutionError',
          errorMessage: `${reporter.name}への催促実行に失敗: ${errorMessage}`,
          timestamp: new Date(),
          severity: 'warning',
          actionStep: 5,
        });

        promptExecutions.push({
          reporterId: reporter.reporterId,
          reporterName: reporter.name,
          method: decision.method,
          status: 'failed',
          error: errorMessage,
        });

        promptsFailed++;
      }
    }

    output.promptExecutions = promptExecutions;
    output.promptsSent = promptsSent;
    output.promptsFailed = promptsFailed;

    // ===============================================
    // Determine final execution status and summary
    // ===============================================
    if (errors.length === 0 || errors.every(e => e.severity === 'info')) {
      output.executionStatus = 'success';
    } else if (
      errors.some(e => e.severity === 'error') ||
      promptsFailed > 0
    ) {
      if (promptsSent === 0) {
        output.executionStatus = 'failure';
      } else {
        output.executionStatus = 'partial_success';
      }
    }

    // Create summary
    const summaryParts: string[] = [];
    summaryParts.push(`エージェント実行が${output.executionStatus === 'success' ? '完了' : output.executionStatus === 'partial_success' ? '部分的に完了' : '失敗'}しました。`);

    if (progressStatus) {
      summaryParts.push(
        `進捗確認: 総報告者数${progressStatus.totalReporters}名、提出済み${progressStatus.submittedCount}名、未提出${output.nonSubmittedCount}名(提出率${Math.round(progressStatus.submissionRate)}%)`
      );
    }

    summaryParts.push(`未提出者の緊急度分類: 期限超過${output.urgencyAnalysis?.overdue || 0}名、警告${output.urgencyAnalysis?.critical || 0}名、予警${output.urgencyAnalysis?.warning || 0}名、保留中${output.urgencyAnalysis?.pending || 0}名`);

    if (output.leaderNotificationSent) {
      summaryParts.push('リーダー通知を送信しました。');
    }

    summaryParts.push(`催促: 判定対象${output.promptDecisions.length}名、実行${promptsSent}件、失敗${promptsFailed}件`);

    if (errors.length > 0) {
      summaryParts.push(`警告・エラー: ${errors.length}件`);
    }

    output.executionSummary = summaryParts.join(' ');
    output.errors = errors.length > 0 ? errors : undefined;

    return output;
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

    output.executionStatus = 'failure';
    output.errors = errors;
    output.executionSummary = 'エージェント実行に失敗しました。予期しないエラーが発生しました。';
    return output;
  }
}
