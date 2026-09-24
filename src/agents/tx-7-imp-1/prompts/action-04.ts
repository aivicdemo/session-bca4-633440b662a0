/**
 * Action 4: ログ記録
 * 異動検知からマスタ更新までの全処理プロセスをログに記録する
 */

export const ACTION_04_PROMPT_VERSION = 'v1.0.0';

export function buildAction04Prompt(params: Record<string, any>): string {
  const {
    reporterId = '',
    reporterName = '',
    transferType = '',
    transferDate = '',
    updateAction = '',
    operationStatus = '',
    recordId = '',
    executionTimestamp = '',
    systemContext = {},
  } = params;

  return `
You are a Japanese HR audit logging system. Generate comprehensive log records for compliance and audit purposes.

Purpose: Record all transfer detection and master update operations for audit trail and compliance.

Operation Information:
- Employee ID: ${reporterId}
- Name: ${reporterName}
- Transfer Type: ${transferType}
- Transfer Date: ${transferDate}
- Update Action: ${updateAction}
- Operation Status: ${operationStatus}
- Record ID: ${recordId}
- Execution Timestamp: ${executionTimestamp}
- Timezone: ${systemContext.timezone || 'Asia/Tokyo'}
- Locale: ${systemContext.locale || 'ja-JP'}

Please generate comprehensive log records in Japanese:
1. Create operation log entry with all relevant details
2. Include success/failure status and any error messages
3. Record the complete operation timeline
4. Include data before/after comparison if applicable
5. Add compliance and audit trail information
6. Include system-generated metadata (operation ID, transaction ID, etc.)
7. Format timestamps in ISO 8601 format

Output format in JSON:
{
  "logEntry": {
    "logId": "string",
    "timestamp": "YYYY-MM-DDTHH:mm:ssZ",
    "eventType": "TRANSFER_DETECTION" | "MASTER_UPDATE_JUDGMENT" | "MASTER_UPDATE_EXECUTION" | "COMPLETION",
    "employeeId": "string",
    "employeeName": "string",
    "operationStatus": "SUCCESS" | "PARTIAL_SUCCESS" | "FAILURE" | "PENDING",
    "transferType": "string",
    "updateAction": "string",
    "recordId": "string"
  },
  "auditLog": {
    "auditId": "string",
    "auditTimestamp": "YYYY-MM-DDTHH:mm:ssZ",
    "operationType": "CREATE" | "UPDATE" | "DELETE",
    "dataChanges": {
      "before": {},
      "after": {}
    },
    "userId": "system",
    "reason": "string (Japanese)"
  },
  "complianceLog": {
    "complianceId": "string",
    "regulatoryRequirements": ["string (Japanese)"],
    "dataPrivacyCompliance": "COMPLIANT" | "NON_COMPLIANT",
    "retentionPolicy": "string",
    "archiveSchedule": "string"
  },
  "summary": {
    "totalOperations": number,
    "successCount": number,
    "failureCount": number,
    "processingDurationMs": number,
    "executionSummary": "string (Japanese)"
  }
}
`;
}
