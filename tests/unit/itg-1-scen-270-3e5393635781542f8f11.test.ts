import {
  generateNonSubmissionDetectionResult,
  InvalidReporterDataError,
  type GenerateNonSubmissionDetectionResultInput,
  type NonSubmissionDetectionLog,
} from '../../src/logic/daily-report-non-submission-detection';

describe('SCEN-270: 未提出者の中にdepartmentIdが欠けている要素があるとき、必須項目不足エラーが発生する', () => {
  it('nonSubmittedReporters配列内のいずれかの要素からdepartmentIdを除外したとき、InvalidReporterDataErrorが発生すること', () => {
    // Arrange: テストデータを準備
    const detectionLog: NonSubmissionDetectionLog = {
      detectionLogId: 'log-001',
      targetDate: '2026-09-24',
      detectionDateTime: '2026-09-24T09:00:00Z',
      totalReportersCount: 1,
      nonSubmittedCount: 1,
      submittedCount: 0,
    };

    const detectionTimestamp = '2026-09-24T09:00:00Z';

    // departmentIdが欠けている未提出者情報
    // GenerateNonSubmissionDetectionResultInputの nonSubmittedReporters は、
    // userId、userName、emailAddress、departmentId を必須とする要素を含む配列である必要がある
    const nonSubmittedReporters = [
      {
        userId: 'user-001',
        userName: '田中太郎',
        emailAddress: 'tanaka@example.com',
        targetDate: '2026-09-24',
        // departmentIdが欠けている（必須フィールド不足）
      },
    ];

    const input: GenerateNonSubmissionDetectionResultInput = {
      nonSubmittedReporters: nonSubmittedReporters as any,
      detectionLog,
      detectionTimestamp,
    };

    // Act & Assert: InvalidReporterDataErrorが発生し、エラー文言が正確であること
    expect(() => {
      generateNonSubmissionDetectionResult(input);
    }).toThrow(InvalidReporterDataError);

    expect(() => {
      generateNonSubmissionDetectionResult(input);
    }).toThrow('未提出者情報に必須項目が不足しています。');
  });

  it('nonSubmittedReporters内の複数要素の中の1つがdepartmentIdを欠いている場合、InvalidReporterDataErrorが発生すること', () => {
    // Arrange: 複数の未提出者のうち1つが必須項目を欠く
    const detectionLog: NonSubmissionDetectionLog = {
      detectionLogId: 'log-002',
      targetDate: '2026-09-24',
      detectionDateTime: '2026-09-24T09:00:00Z',
      totalReportersCount: 2,
      nonSubmittedCount: 2,
      submittedCount: 0,
    };

    const detectionTimestamp = '2026-09-24T09:00:00Z';

    const nonSubmittedReporters = [
      {
        userId: 'user-001',
        userName: '田中太郎',
        emailAddress: 'tanaka@example.com',
        targetDate: '2026-09-24',
        departmentId: 'dept-001',
      },
      {
        userId: 'user-002',
        userName: '佐藤花子',
        emailAddress: 'satoh@example.com',
        targetDate: '2026-09-24',
        // departmentIdが欠けている
      },
    ];

    const input: GenerateNonSubmissionDetectionResultInput = {
      nonSubmittedReporters: nonSubmittedReporters as any,
      detectionLog,
      detectionTimestamp,
    };

    // Act & Assert
    expect(() => {
      generateNonSubmissionDetectionResult(input);
    }).toThrow(InvalidReporterDataError);

    expect(() => {
      generateNonSubmissionDetectionResult(input);
    }).toThrow('未提出者情報に必須項目が不足しています。');
  });
});
