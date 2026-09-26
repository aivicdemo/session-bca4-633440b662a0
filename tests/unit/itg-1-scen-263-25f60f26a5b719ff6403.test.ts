import {
  generateNonSubmissionDetectionResult,
  GenerateNonSubmissionDetectionResultInput,
  InvalidDetectionResultError,
} from '../../src/logic/daily-report-non-submission-detection';
import type { NonSubmittedReporter } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('SCEN-263: 検知ログがnullのとき、不正な検知結果エラーが発生する', () => {
  it('detectionLog が null のとき、InvalidDetectionResultError が発生し、エラーメッセージが正確である', () => {
    const mockReporters: NonSubmittedReporter[] = [
      {
        userId: 'reporter-001',
        userName: 'Reporter One',
        emailAddress: 'reporter-001@example.com',
        promptPriority: 'high',
        department: 'Engineering',
      },
    ];

    const input: GenerateNonSubmissionDetectionResultInput = {
      nonSubmittedReporters: mockReporters,
      detectionLog: null as any,
      detectionTimestamp: '2024-01-15T17:00:00Z',
    };

    expect(() => {
      generateNonSubmissionDetectionResult(input);
    }).toThrow(InvalidDetectionResultError);

    try {
      generateNonSubmissionDetectionResult(input);
      fail('Should have thrown InvalidDetectionResultError');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidDetectionResultError);
      expect((error as InvalidDetectionResultError).message).toBe(
        '未提出者検知結果が不正です。検知処理を再実行してください。'
      );
    }
  });
});
