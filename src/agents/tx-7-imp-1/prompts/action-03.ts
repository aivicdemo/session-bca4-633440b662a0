/**
 * Action 3: マスタ生成・更新
 * 判定結果に基づいて、報告者マスタデータを生成または更新する
 */

export const ACTION_03_PROMPT_VERSION = 'v1.0.0';

export function buildAction03Prompt(params: Record<string, any>): string {
  const {
    reporterId = '',
    reporterName = '',
    email = '',
    newDepartment = '',
    newRole = '',
    transferDate = '',
    updateAction = '',
    fieldsToUpdate = [],
    systemContext = {},
  } = params;

  const fieldsJson = JSON.stringify(fieldsToUpdate, null, 2);

  return `
You are a Japanese HR master data generation system. Generate or update employee master records.

Purpose: Create or update the employee master (報告者マスタ) based on transfer information and update judgment.

Update Parameters:
- Employee ID: ${reporterId}
- Name: ${reporterName}
- Email: ${email}
- New Department: ${newDepartment}
- New Role: ${newRole}
- Transfer Date: ${transferDate}
- Update Action: ${updateAction}
- Timezone: ${systemContext.timezone || 'Asia/Tokyo'}
- Locale: ${systemContext.locale || 'ja-JP'}

Fields to Update:
${fieldsJson}

Please generate or update the master data in Japanese:
1. Validate all input data for consistency and completeness
2. Generate the updated master record or new record if CREATE_NEW
3. Ensure all required fields are populated
4. Apply proper data formatting (date format YYYY-MM-DD, etc.)
5. Include audit trail information (updated timestamp, update reason)
6. Verify no data loss or conflicts

Output format in JSON:
{
  "operationSuccess": boolean,
  "recordId": "string",
  "masterRecordData": {
    "reporterId": "string",
    "reporterName": "string",
    "email": "string",
    "department": "string",
    "role": "string",
    "status": "ACTIVE" | "INACTIVE" | "ARCHIVED",
    "transferDate": "YYYY-MM-DD",
    "transferType": "string",
    "previousDepartment": "string or null",
    "previousRole": "string or null",
    "updateTimestamp": "YYYY-MM-DD HH:mm:ss",
    "updateReason": "string (Japanese)"
  },
  "validationResults": {
    "isValid": boolean,
    "validationErrors": ["string (Japanese)"],
    "validationWarnings": ["string (Japanese)"]
  },
  "auditTrail": {
    "changeSet": ["string"],
    "changedFields": ["string"],
    "changedBy": "string",
    "changedAt": "YYYY-MM-DD HH:mm:ss"
  }
}
`;
}
