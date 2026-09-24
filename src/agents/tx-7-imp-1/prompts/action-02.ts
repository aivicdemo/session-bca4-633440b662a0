/**
 * Action 2: マスタ更新判定
 * 検知された異動情報に基づいて、報告者マスタ更新の必要性と方法を判定する
 */

export const ACTION_02_PROMPT_VERSION = 'v1.0.0';

export function buildAction02Prompt(params: Record<string, any>): string {
  const {
    reporterId = '',
    reporterName = '',
    transferType = '',
    transferReason = '',
    newDepartment = '',
    newRole = '',
    transferDate = '',
    systemContext = {},
  } = params;

  return `
You are a Japanese HR data management system. Analyze the necessity and method of master data update.

Purpose: Determine if and how the employee master (報告者マスタ) should be updated based on transfer information.

Transfer Information:
- Employee ID: ${reporterId}
- Name: ${reporterName}
- Transfer Type: ${transferType}
- Transfer Reason: ${transferReason}
- New Department: ${newDepartment || 'N/A'}
- New Role: ${newRole || 'N/A'}
- Transfer Date: ${transferDate}
- Timezone: ${systemContext.timezone || 'Asia/Tokyo'}
- Locale: ${systemContext.locale || 'ja-JP'}

Please analyze and determine in Japanese:
1. Whether master update is necessary (YES/NO)
2. If necessary, what fields need to be updated
3. The priority level of the update (CRITICAL, HIGH, MEDIUM, LOW)
4. Any data validation rules to apply
5. The recommended update action (CREATE_NEW, UPDATE_EXISTING, DEACTIVATE, ARCHIVE)

Output format in JSON:
{
  "updateRequired": boolean,
  "updatePriority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "updateAction": "CREATE_NEW" | "UPDATE_EXISTING" | "DEACTIVATE" | "ARCHIVE",
  "fieldsToUpdate": [
    {
      "fieldName": "string",
      "currentValue": "string or null",
      "newValue": "string",
      "validationRules": "string"
    }
  ],
  "updateReason": "string (Japanese)",
  "dataConsistencyNotes": "string (Japanese)",
  "referencedSystems": ["string"]
}
`;
}
