import {
  generateNonSubmissionDetectionResult,
  GenerateNonSubmissionDetectionResultInput,
  InvalidDetectionResultError,
} from '../../src/logic/daily-report-non-submission-detection';
import type { NonSubmittedReporter } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-263: 検知ログがnullのとき、不正な検知結果エラーが発生する', () => {
  it('detectionLogをnullで初期化すると、InvalidDetectionResultErrorが発生し、エラーメッセージが正確である', () => {
    const nonSubmittedReporters: (NonSubmittedReporter & { departmentId: string })[] = [
      {
        userId: 'user-001',
        userName: '山田太郎',
        emailAddress: 'yamada@example.com',
        promptPriority: 'high',
        department: 'sales',
        departmentId: 'dept-001',
      },
      {
        userId: 'user-002',
        userName: '佐藤花子',
        emailAddress: 'sato@example.com',
        promptPriority: 'medium',
        department: 'marketing',
        departmentId: 'dept-002',
      },
    ];

    const detectionTimestamp = '2026-10-03T17:00:00Z';

    const input: GenerateNonSubmissionDetectionResultInput = {
      nonSubmittedReporters,
      detectionLog: null as any,
      detectionTimestamp,
    };

    expect(() => {
      generateNonSubmissionDetectionResult(input);
    }).toThrow(InvalidDetectionResultError);

    expect(() => {
      generateNonSubmissionDetectionResult(input);
    }).toThrow('未提出者検知結果が不正です。検知処理を再実行してください。');
  });
});
