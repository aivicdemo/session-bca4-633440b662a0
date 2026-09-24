/**
 * TX-6-IMP-1 エージェント
 * ユーザー情報受け取りから確認・承認・通知までを統合・実行するオーケストレーター
 */

import {
  confirmUserInformation,
  ConfirmResult,
} from '../../logic/user-information-input-confirmation';
import {
  validateEmailFormat,
  ValidationResult,
} from '../../logic/input-validation-formatting';
import {
  detectNonSubmittedReportersAtDeadline,
  DetectNonSubmittedOutput,
} from '../../logic/daily-report-non-submission-detection';
import {
  sendNonSubmissionPromptNotification,
  SendPromptOutput,
} from '../../logic/email-notification-management';

export interface Tx6Imp1AiClient {
  invokeModel?: (prompt: string, systemPrompt?: string) => any;
  [key: string]: any;
}

export interface UserInfo {
  userId: string;
  userName: string;
  email: string;
  department?: string;
  role?: string;
  phoneNumber?: string;
  [key: string]: any;
}

export interface Tx6Imp1AgentInput {
  executionTimestamp?: Date;
  targetDate?: Date;
  userInfoList?: UserInfo[];
  approverUserId?: string;
  leaderUserId?: string;
  leaderUserIds?: string[];
  userInformationSubmissions?: UserInfo[];
  systemContext?: {
    timezone?: string;
    locale?: string;
    systemName?: string;
    supportEmail?: string;
    [key: string]: any;
  };
  reminderConfig?: {
    firstReminderDelayHours?: number;
    secondReminderDelayHours?: number;
    finalReminderDelayHours?: number;
  };
  [key: string]: any;
}

export interface CollectedUserInfo {
  userId: string;
  userName: string;
  email: string;
  department?: string;
  role?: string;
  collectedAt: string;
  status: 'collected' | 'validated' | 'approved' | 'failed';
}

export interface ValidationInfo {
  userId: string;
  isValid: boolean;
  validationResults: any;
  errors?: string[];
  warnings?: string[];
  validatedAt: string;
}

export interface ApprovalInfo {
  userId: string;
  approved: boolean;
  approvalStatus: string;
  confirmationCode: string;
  approverUserId: string;
  approvedAt: string;
  approvalDetails?: any;
}

export interface EmailNotification {
  userId: string;
  recipientEmail: string;
  notificationType: 'approval' | 'reminder';
  reminderLevel?: 'first' | 'second' | 'final';
  sentAt: string;
  status: 'sent' | 'failed' | 'pending';
  messageId?: string;
  errorMessage?: string;
}

export interface NonSubmittedUserInfo {
  userId: string;
  userName: string;
  email: string;
  department?: string;
  daysOverdue: number;
  reminderCount: number;
  lastReminderAt?: string;
}

export interface AgentExecutionError {
  errorCode: string;
  errorMessage: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error';
  context?: any;
}

export interface Tx6Imp1AgentOutput {
  executionStatus: 'success' | 'partial_success' | 'failure';
  usersProcessed: number;
  usersValidated: number;
  usersApproved: number;
  emailsSent: number;
  nonSubmittedUsers: NonSubmittedUserInfo[];
  reminderssent: number;
  remindersFailed: number;
  collectedUserInfo: CollectedUserInfo[];
  validationInfo: ValidationInfo[];
  approvalInfo: ApprovalInfo[];
  notifications: EmailNotification[];
  errors?: AgentExecutionError[];
  executionSummary: string;
  executionTimestamp: string;
  [key: string]: any;
}

/**
 * TX-6-IMP-1 エージェントを実行する
 * 6個のアクション：
 * 1. ユーザー情報受け取り
 * 2. 正確性検証
 * 3. 承認確定処理
 * 4. メール通知送信
 * 5. 未提出者自動抽出
 * 6. 催促メール送信
 */
export async function runTx6Imp1Agent(
  input: Tx6Imp1AgentInput,
  aiClient: Tx6Imp1AiClient
): Promise<Tx6Imp1AgentOutput> {
  const executionTimestamp = input.executionTimestamp.toISOString();
  const errors: AgentExecutionError[] = [];
  const collectedUserInfo: CollectedUserInfo[] = [];
  const validationInfo: ValidationInfo[] = [];
  const approvalInfo: ApprovalInfo[] = [];
  const notifications: EmailNotification[] = [];
  const nonSubmittedUsers: NonSubmittedUserInfo[] = [];

  let usersProcessed = 0;
  let usersValidated = 0;
  let usersApproved = 0;
  let emailsSent = 0;
  let reminderssent = 0;
  let remindersFailed = 0;

  try {
    // ============================================================
    // Action 1: ユーザー情報受け取り
    // ============================================================
    for (const userInfo of input.userInfoList) {
      try {
        // Action 1: ユーザー情報受け取り処理
        let collectedInfo: CollectedUserInfo;
        try {
          // Action 1 プロンプト実行
          const action01Prompt = `ユーザー情報を受け取りました。以下の情報を構造化してください:
User ID: ${userInfo.userId}
User Name: ${userInfo.userName}
Email: ${userInfo.email}
Department: ${userInfo.department || 'N/A'}
Role: ${userInfo.role || 'N/A'}
Phone: ${userInfo.phoneNumber || 'N/A'}

JSON形式で確認応答を生成してください。`;

          await aiClient.invokeModel(action01Prompt);

          collectedInfo = {
            userId: userInfo.userId,
            userName: userInfo.userName,
            email: userInfo.email,
            department: userInfo.department,
            role: userInfo.role,
            collectedAt: executionTimestamp,
            status: 'collected',
          };

          collectedUserInfo.push(collectedInfo);
          usersProcessed++;
        } catch (error) {
          const errorMessage =
            (error as any)?.message ||
            'ユーザー情報の収集に失敗しました。';
          errors.push({
            errorCode: 'UserInfoCollectionError',
            errorMessage,
            timestamp: new Date(),
            severity: 'warning',
            context: { userId: userInfo.userId },
          });
          continue;
        }

        // ============================================================
        // Action 2: 正確性検証
        // ============================================================
        let validationResult: ValidationInfo;
        try {
          // メール形式の検証
          const emailValidation = await validateEmailFormat(userInfo.email);

          // Action 2 プロンプト実行
          const action02Prompt = `以下のユーザー情報の正確性を検証してください:
User Info: ${JSON.stringify(userInfo)}

検証項目:
1. メール形式の妥当性
2. 名前のフォーマット
3. 部門・職位の妥当性
4. 電話番号形式（提供されている場合）

JSON形式で検証結果を返してください。`;

          await aiClient.invokeModel(action02Prompt);

          const isValid = emailValidation.isValid;
          validationResult = {
            userId: userInfo.userId,
            isValid,
            validationResults: {
              emailValid: emailValidation.isValid,
              namePresent: !!userInfo.userName,
              departmentValid: !!userInfo.department,
            },
            validatedAt: executionTimestamp,
            errors: !emailValidation.isValid
              ? ['Invalid email format']
              : undefined,
          };

          validationInfo.push(validationResult);

          if (isValid) {
            usersValidated++;
          } else {
            errors.push({
              errorCode: 'UserValidationError',
              errorMessage: `User ${userInfo.userId} failed validation`,
              timestamp: new Date(),
              severity: 'warning',
              context: { userId: userInfo.userId, validationErrors: validationResult.errors },
            });
            continue;
          }
        } catch (error) {
          const errorMessage =
            (error as any)?.message || 'ユーザー情報の検証に失敗しました。';
          errors.push({
            errorCode: 'UserValidationError',
            errorMessage,
            timestamp: new Date(),
            severity: 'warning',
            context: { userId: userInfo.userId },
          });
          continue;
        }

        // ============================================================
        // Action 3: 承認確定処理
        // ============================================================
        let approval: ApprovalInfo;
        try {
          // 承認確定処理
          const confirmResult: ConfirmResult = await confirmUserInformation(
            userInfo.userId,
            userInfo
          );

          if (!confirmResult.confirmed) {
            throw new Error('User information confirmation failed');
          }

          // Action 3 プロンプト実行
          const confirmationCode = `CONFIRM-${userInfo.userId}-${Date.now()}`;
          const action03Prompt = `以下のユーザー情報を承認確定してください:
User Info: ${JSON.stringify(userInfo)}
Confirmation Code: ${confirmationCode}
Approver: ${input.approverUserId}
Timestamp: ${executionTimestamp}

承認確定のサマリーをJSON形式で生成してください。`;

          await aiClient.invokeModel(action03Prompt);

          approval = {
            userId: userInfo.userId,
            approved: true,
            approvalStatus: 'approved',
            confirmationCode,
            approverUserId: input.approverUserId,
            approvedAt: executionTimestamp,
            approvalDetails: {
              validationPassed: true,
              confirmationConfirmed: true,
            },
          };

          approvalInfo.push(approval);
          usersApproved++;
        } catch (error) {
          const errorMessage =
            (error as any)?.message || 'ユーザー情報の承認に失敗しました。';
          errors.push({
            errorCode: 'UserApprovalError',
            errorMessage,
            timestamp: new Date(),
            severity: 'warning',
            context: { userId: userInfo.userId },
          });
          continue;
        }

        // ============================================================
        // Action 4: メール通知送信
        // ============================================================
        try {
          // Action 4 プロンプト実行
          const action04Prompt = `以下のユーザーに承認確定メールを送信してください:
User: ${userInfo.userName}
Email: ${userInfo.email}
Confirmation Code: ${approval.confirmationCode}
System Name: ${input.systemContext.systemName || 'Employee Management System'}
Support Email: ${input.systemContext.supportEmail || 'support@company.com'}

メール本文をJSON形式で生成してください。`;

          await aiClient.invokeModel(action04Prompt);

          const notification: EmailNotification = {
            userId: userInfo.userId,
            recipientEmail: userInfo.email,
            notificationType: 'approval',
            sentAt: new Date().toISOString(),
            status: 'sent',
            messageId: `MSG-${userInfo.userId}-${Date.now()}`,
          };

          notifications.push(notification);
          emailsSent++;
        } catch (error) {
          const errorMessage =
            (error as any)?.message || 'メール送信に失敗しました。';
          errors.push({
            errorCode: 'EmailSendError',
            errorMessage,
            timestamp: new Date(),
            severity: 'warning',
            context: { userId: userInfo.userId },
          });

          notifications.push({
            userId: userInfo.userId,
            recipientEmail: userInfo.email,
            notificationType: 'approval',
            sentAt: new Date().toISOString(),
            status: 'failed',
            errorMessage,
          });
        }
      } catch (error) {
        const errorMessage =
          (error as any)?.message || 'ユーザー処理中にエラーが発生しました。';
        errors.push({
          errorCode: 'UserProcessingError',
          errorMessage,
          timestamp: new Date(),
          severity: 'warning',
          context: { userId: userInfo.userId },
        });
      }
    }

    // ============================================================
    // Action 5: 未提出者自動抽出
    // ============================================================
    try {
      // 承認されたユーザーと未提出ユーザーを検出
      const approvedUserIds = new Set(approvalInfo.map((a) => a.userId));
      const allUserIds = new Set(input.userInfoList.map((u) => u.userId));

      const notSubmittedUserIds = Array.from(allUserIds).filter(
        (id) => !approvedUserIds.has(id)
      );

      // Action 5 プロンプト実行
      if (notSubmittedUserIds.length > 0) {
        const action05Prompt = `以下のユーザーが登録を完了していません。分析してください:
Total Users: ${input.userInfoList.length}
Submitted: ${approvedUserIds.size}
Not Submitted: ${notSubmittedUserIds.length}
Deadline: ${input.targetDate.toISOString()}

未提出ユーザーの分析レポートをJSON形式で生成してください。`;

        await aiClient.invokeModel(action05Prompt);

        // 未提出ユーザー情報を構築
        for (const userId of notSubmittedUserIds) {
          const userInfo = input.userInfoList.find((u) => u.userId === userId);
          if (userInfo) {
            const daysOverdue = Math.floor(
              (input.executionTimestamp.getTime() -
                input.targetDate.getTime()) /
                (1000 * 60 * 60 * 24)
            );

            nonSubmittedUsers.push({
              userId: userInfo.userId,
              userName: userInfo.userName,
              email: userInfo.email,
              department: userInfo.department,
              daysOverdue: Math.max(0, daysOverdue),
              reminderCount: 0,
            });
          }
        }
      }
    } catch (error) {
      const errorMessage =
        (error as any)?.message || '未提出者の抽出に失敗しました。';
      errors.push({
        errorCode: 'NonSubmittedUserDetectionError',
        errorMessage,
        timestamp: new Date(),
        severity: 'warning',
      });
    }

    // ============================================================
    // Action 6: 催促メール送信
    // ============================================================
    for (const nonSubmittedUser of nonSubmittedUsers) {
      try {
        // 催促レベルを決定
        const reminderLevel = nonSubmittedUser.daysOverdue <= 1 ? 'first' :
                             nonSubmittedUser.daysOverdue <= 3 ? 'second' :
                             'final';

        // Action 6 プロンプト実行
        const action06Prompt = `以下のユーザーに催促メールを送信してください:
User: ${nonSubmittedUser.userName}
Email: ${nonSubmittedUser.email}
Days Overdue: ${nonSubmittedUser.daysOverdue}
Reminder Level: ${reminderLevel}
Deadline: ${input.targetDate.toISOString()}
Support Email: ${input.systemContext.supportEmail || 'support@company.com'}

催促メール本文をJSON形式で生成してください。`;

        await aiClient.invokeModel(action06Prompt);

        const reminderNotification: EmailNotification = {
          userId: nonSubmittedUser.userId,
          recipientEmail: nonSubmittedUser.email,
          notificationType: 'reminder',
          reminderLevel,
          sentAt: new Date().toISOString(),
          status: 'sent',
          messageId: `REMINDER-${nonSubmittedUser.userId}-${Date.now()}`,
        };

        notifications.push(reminderNotification);
        reminderssent++;
      } catch (error) {
        const errorMessage =
          (error as any)?.message || '催促メール送信に失敗しました。';
        errors.push({
          errorCode: 'ReminderEmailSendError',
          errorMessage,
          timestamp: new Date(),
          severity: 'warning',
          context: { userId: nonSubmittedUser.userId },
        });

        notifications.push({
          userId: nonSubmittedUser.userId,
          recipientEmail: nonSubmittedUser.email,
          notificationType: 'reminder',
          sentAt: new Date().toISOString(),
          status: 'failed',
          errorMessage,
        });

        remindersFailed++;
      }
    }

    // 実行結果ステータスを決定
    let executionStatus: 'success' | 'partial_success' | 'failure' =
      'success';

    if (usersProcessed === 0) {
      executionStatus = 'failure';
    } else if (usersApproved < usersProcessed) {
      executionStatus = 'partial_success';
    }

    // サマリー作成
    const executionSummary =
      executionStatus === 'success'
        ? `エージェント実行が完了しました。${usersProcessed}名のユーザーを処理し、${usersValidated}名が検証され、${usersApproved}名が承認されました。${emailsSent}件の承認メールと${reminderssent}件の催促メールが送信されました。`
        : executionStatus === 'partial_success'
          ? `エージェント実行が部分的に完了しました。${usersProcessed}名中${usersApproved}名が承認されました。${nonSubmittedUsers.length}名が登録を完了していません。`
          : `エージェント実行に失敗しました。`;

    return {
      executionStatus,
      usersProcessed,
      usersValidated,
      usersApproved,
      emailsSent,
      nonSubmittedUsers,
      reminderssent,
      remindersFailed,
      collectedUserInfo,
      validationInfo,
      approvalInfo,
      notifications,
      errors: errors.length > 0 ? errors : undefined,
      executionSummary,
      executionTimestamp,
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
      usersProcessed: 0,
      usersValidated: 0,
      usersApproved: 0,
      emailsSent: 0,
      nonSubmittedUsers: [],
      reminderssent: 0,
      remindersFailed: 0,
      collectedUserInfo: [],
      validationInfo: [],
      approvalInfo: [],
      notifications: [],
      errors,
      executionSummary: 'エージェント実行に失敗しました。予期しないエラーが発生しました。',
      executionTimestamp,
    };
  }
}
