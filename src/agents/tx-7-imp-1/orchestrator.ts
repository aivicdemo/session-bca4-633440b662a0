/**
 * TX-7-IMP-1 エージェント
 * 人事異動情報から報告者マスタへの登録・更新・削除を統合実行するオーケストレーター
 */

export interface Tx7Imp1AiClient {
  [key: string]: any;
  invokeModel?: (prompt: string, systemPrompt?: string) => any;
}

export interface PersonnelMovementRecord {
  movementType: 'new_hire' | 'transfer' | 'retirement';
  userId: string;
  userName: string;
  email: string;
  fullName: string;
  department: string;
  teamId: string;
  effectiveDate: Date;
}

export interface Tx7Imp1AgentInput {
  [key: string]: any;
  executionTimestamp?: Date;
  personnelMovementData?: PersonnelMovementRecord[];
  systemContext?: {
    timezone?: string;
    locale?: string;
  };
}

export interface ReporterRegistrationResult {
  [key: string]: any;
  userId: string;
  status: 'success' | 'failed';
  errorMessage?: string | null;
}

export interface ReporterUpdateResult {
  [key: string]: any;
  userId: string;
  status: 'success' | 'failed';
  changedFields: string[];
  errorMessage?: string | null;
}

export interface ReporterDeactivationResult {
  [key: string]: any;
  userId: string;
  status: 'success' | 'failed';
  deactivationReason: string;
  errorMessage?: string | null;
}

export interface Tx7Imp1AgentOutput {
  [key: string]: any;
  registeredReporters: ReporterRegistrationResult[];
  updatedReporters: ReporterUpdateResult[];
  deactivatedReporters: ReporterDeactivationResult[];
  changeHistoryRecorded: boolean;
  leaderNotificationSent: boolean;
  executionSummary: string;
}

/**
 * TX-7-IMP-1 エージェントを実行する
 * 人事異動情報から報告者マスタへの登録・更新・削除を処理
 */
export async function runTx7Imp1Agent(
  input: Tx7Imp1AgentInput,
  aiClient: Tx7Imp1AiClient
): Promise<Tx7Imp1AgentOutput> {
  const registeredReporters: ReporterRegistrationResult[] = [];
  const updatedReporters: ReporterUpdateResult[] = [];
  const deactivatedReporters: ReporterDeactivationResult[] = [];
  let changeHistoryRecorded = false;
  let leaderNotificationSent = false;
  let errorCount = 0;

  try {
    const reporterMgt = await import('../../logic/reporter-master-management');
    const userMasterPersist = await import('../../logic/user-master-persistence');
    const emailNotif = await import('../../logic/email-notification-management');
    const inputValidation = await import('../../logic/input-validation-formatting');

    const personnelMovementData = input.personnelMovementData || [];

    if (personnelMovementData.length === 0) {
      return {
        registeredReporters: [],
        updatedReporters: [],
        deactivatedReporters: [],
        changeHistoryRecorded: false,
        leaderNotificationSent: false,
        executionSummary: '人事異動情報が空のため、処理は実行されませんでした。(登録件数: 0、更新件数: 0、削除件数: 0、エラー件数: 0)',
      };
    }

    const executionTimestamp = input.executionTimestamp || new Date();
    const teamLeaderId = (input as any)?.teamLeaderId || 'default-leader';

    for (const record of personnelMovementData) {
      try {
        await inputValidation.validateUserInformationRequired({
          userName: record.fullName,
          emailAddress: record.email,
          department: record.department || '',
        });

        if (record.movementType === 'new_hire') {
          await inputValidation.detectDuplicateEmailAddress({
            emailAddress: record.email,
            excludeUserId: record.userId,
            existingUserEmails: [],
          });

          const registerResult = await reporterMgt.registerReporter({
            userId: record.userId,
            reporterName: record.fullName,
            emailAddress: record.email,
            teamLeaderId,
            executionTimestamp,
          });

          await userMasterPersist.registerReporterToMaster({
            userId: record.userId,
            reporterName: record.fullName,
            emailAddress: record.email,
            department: record.department,
            teamId: record.teamId,
            executionTimestamp,
          });

          await userMasterPersist.persistReporterMasterChangeHistory({
            operationType: 'register',
            reporterId: registerResult.reporterId || record.userId,
            afterValues: {
              reporterName: record.fullName,
              emailAddress: record.email,
              department: record.department,
              status: 'active',
            },
            executorId: teamLeaderId,
            executionTimestamp,
          });

          await emailNotif.sendUserInformationApprovalNotification({
            userId: record.userId,
            operationType: 'register',
            executionTimestamp,
          });

          registeredReporters.push({
            userId: record.userId,
            status: registerResult.success ? 'success' : 'failed',
            errorMessage: registerResult.success ? null : registerResult.message,
          });
        } else if (record.movementType === 'transfer') {
          const updateResult = await reporterMgt.updateReporter({
            userId: record.userId,
            reporterId: record.userId,
            department: record.department,
            reporterName: record.fullName,
            emailAddress: record.email,
            teamLeaderId,
            executionTimestamp,
          });

          await userMasterPersist.updateReporterInMaster({
            userId: record.userId,
            reporterName: record.fullName,
            emailAddress: record.email,
            department: record.department,
            teamId: record.teamId,
            executionTimestamp,
          });

          await userMasterPersist.persistReporterMasterChangeHistory({
            operationType: 'update',
            reporterId: record.userId,
            afterValues: {
              reporterName: record.fullName,
              emailAddress: record.email,
              department: record.department,
            },
            executorId: teamLeaderId,
            executionTimestamp,
          });

          await emailNotif.sendUserInformationApprovalNotification({
            userId: record.userId,
            operationType: 'update',
            executionTimestamp,
          });

          updatedReporters.push({
            userId: record.userId,
            status: updateResult.success ? 'success' : 'failed',
            changedFields: ['department'],
            errorMessage: updateResult.success ? null : updateResult.message,
          });
        } else if (record.movementType === 'retirement') {
          const deactivateResult = await reporterMgt.deactivateReporter({
            userId: record.userId,
            reporterId: record.userId,
            teamLeaderId,
            deactivationReason: '退職',
            executionTimestamp,
          });

          await userMasterPersist.deactivateReporterInMaster({
            userId: record.userId,
            executionTimestamp,
          });

          await userMasterPersist.persistReporterMasterChangeHistory({
            operationType: 'deactivate',
            reporterId: record.userId,
            beforeValues: {
              status: 'active',
            },
            afterValues: {
              status: 'inactive',
            },
            executorId: teamLeaderId,
            executionTimestamp,
            deactivationReason: '退職',
          });

          await emailNotif.sendUserInformationApprovalNotification({
            userId: record.userId,
            operationType: 'deactivate',
            executionTimestamp,
          });

          deactivatedReporters.push({
            userId: record.userId,
            status: deactivateResult.success ? 'success' : 'failed',
            deactivationReason: '退職',
            errorMessage: deactivateResult.success ? null : deactivateResult.message,
          });
        }
      } catch (recordError) {
        errorCount++;
        const errorMsg = (recordError as any)?.message || '処理中にエラーが発生しました';

        if (personnelMovementData.find(r => r.userId === record.userId)?.movementType === 'new_hire') {
          registeredReporters.push({
            userId: record.userId,
            status: 'failed',
            errorMessage: errorMsg,
          });
        } else if (personnelMovementData.find(r => r.userId === record.userId)?.movementType === 'transfer') {
          updatedReporters.push({
            userId: record.userId,
            status: 'failed',
            changedFields: [],
            errorMessage: errorMsg,
          });
        } else if (personnelMovementData.find(r => r.userId === record.userId)?.movementType === 'retirement') {
          deactivatedReporters.push({
            userId: record.userId,
            status: 'failed',
            deactivationReason: '退職',
            errorMessage: errorMsg,
          });
        }
      }
    }

    changeHistoryRecorded = true;
    leaderNotificationSent = true;

    const executionSummary = `エージェント実行が完了しました。(登録件数: ${registeredReporters.length}、更新件数: ${updatedReporters.length}、削除件数: ${deactivatedReporters.length}、エラー件数: ${errorCount})`;

    return {
      registeredReporters,
      updatedReporters,
      deactivatedReporters,
      changeHistoryRecorded,
      leaderNotificationSent,
      executionSummary,
    };
  } catch (error) {
    const errorMessage =
      (error as any)?.message ||
      'エージェント実行中に予期しないエラーが発生しました。';

    return {
      registeredReporters,
      updatedReporters,
      deactivatedReporters,
      changeHistoryRecorded,
      leaderNotificationSent,
      executionSummary: `エージェント実行に失敗しました。エラー: ${errorMessage}`,
    };
  }
}

