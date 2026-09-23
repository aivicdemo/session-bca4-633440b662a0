import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBClient,
  BatchWriteItemCommand,
  BatchWriteItemCommandInput,
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import {
  extractAuthContext,
  requirePermission,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from './rbac';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-1' });
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.MAIN_TABLE || 'DailyReportSystem';

interface AuditLog {
  pk: string;
  sk: string;
  action: string;
  userId: string;
  username: string;
  timestamp: number;
  details: Record<string, unknown>;
}

interface User {
  pk: string;
  sk: string;
  userId: string;
  username: string;
  email: string;
  fullName: string;
  department?: string;
  role: string;
  status: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

interface DailyReport {
  pk: string;
  sk: string;
  reportId: string;
  userId: string;
  reportDate: number;
  workContent: string;
  achievement?: string;
  issue?: string;
  tomorrowPlan?: string;
  createdAt: number;
  updatedAt: number;
}

interface ReminderSetting {
  pk: string;
  sk: string;
  reminderId: string;
  userId: string;
  enabled: boolean;
  sendTime: string;
  sendDays?: string;
  sendMethod: string;
  createdAt: number;
  updatedAt: number;
}

interface DetectionLog {
  pk: string;
  sk: string;
  logId: string;
  userId: string;
  targetDate: number;
  detectedAt: number;
  reminderSent: boolean;
  reminderSentAt?: number;
  status: string;
  createdAt: number;
  updatedAt: number;
}

interface EmailHistory {
  pk: string;
  sk: string;
  emailId: string;
  userId: string;
  emailType: string;
  toAddress: string;
  subject: string;
  body: string;
  sentAt: number;
  status: string;
  errorMessage?: string;
  relatedReportId?: string;
  relatedReminderId?: string;
  retryFlag: boolean;
  createdAt: number;
}

function createAuditLog(
  action: string,
  userId: string,
  username: string,
  details: Record<string, unknown>
): AuditLog {
  const now = Date.now();
  return {
    pk: 'AUDIT',
    sk: `${now}#${randomUUID()}`,
    action,
    userId,
    username,
    timestamp: now,
    details,
  };
}

async function writeAuditLog(auditLog: AuditLog): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: auditLog,
    })
  );
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateUsername(username: string): boolean {
  return username.length >= 3 && username.length <= 100;
}

function validateTime(time: string): boolean {
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

async function getUserById(userId: string): Promise<User | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { pk: 'USER', sk: userId },
    })
  );
  return (result.Item as User) || null;
}

async function getReportById(reportId: string): Promise<DailyReport | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { pk: 'REPORT', sk: reportId },
    })
  );
  return (result.Item as DailyReport) || null;
}

async function getReminderById(reminderId: string): Promise<ReminderSetting | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { pk: 'REMINDER', sk: reminderId },
    })
  );
  return (result.Item as ReminderSetting) || null;
}

async function getDetectionLogById(logId: string): Promise<DetectionLog | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { pk: 'DETECTION', sk: logId },
    })
  );
  return (result.Item as DetectionLog) || null;
}

async function getEmailHistoryById(emailId: string): Promise<EmailHistory | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { pk: 'EMAIL', sk: emailId },
    })
  );
  return (result.Item as EmailHistory) || null;
}

async function getAllUsers(): Promise<User[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': 'USER' },
    })
  );
  return (result.Items as User[]) || [];
}

async function getAllReports(): Promise<DailyReport[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': 'REPORT' },
    })
  );
  return (result.Items as DailyReport[]) || [];
}

async function getAllReminders(): Promise<ReminderSetting[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': 'REMINDER' },
    })
  );
  return (result.Items as ReminderSetting[]) || [];
}

async function getAllDetectionLogs(): Promise<DetectionLog[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': 'DETECTION' },
    })
  );
  return (result.Items as DetectionLog[]) || [];
}

async function getAllEmailHistories(): Promise<EmailHistory[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': 'EMAIL' },
    })
  );
  return (result.Items as EmailHistory[]) || [];
}

async function handleGetResources(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuthContext(event);
    requirePermission(auth, 'user:read');

    const users = await getAllUsers();
    const reports = await getAllReports();
    const reminders = await getAllReminders();
    const detectionLogs = await getAllDetectionLogs();
    const emailHistories = await getAllEmailHistories();

    return {
      statusCode: 200,
      body: JSON.stringify({
        users,
        reports,
        reminders,
        detectionLogs,
        emailHistories,
      }),
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: error.message }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

async function handleCreateUser(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuthContext(event);
    requirePermission(auth, 'user:create');

    const body = JSON.parse(event.body || '{}');
    const { username, email, fullName, department, role, status } = body;

    if (!username || !validateUsername(username)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid username' }),
      };
    }
    if (!email || !validateEmail(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid email' }),
      };
    }
    if (!fullName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'fullName is required' }),
      };
    }
    if (!role) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'role is required' }),
      };
    }
    if (!status) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'status is required' }),
      };
    }

    const userId = randomUUID();
    const now = Date.now();
    const user: User = {
      pk: 'USER',
      sk: userId,
      userId,
      username,
      email,
      fullName,
      department,
      role,
      status,
      createdAt: now,
      updatedAt: now,
      createdBy: auth.userId,
    };

    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: user,
      })
    );

    const auditLog = createAuditLog('USER_CREATE', auth.userId, auth.username, {
      userId,
      username,
      email,
    });
    await writeAuditLog(auditLog);

    return {
      statusCode: 201,
      body: JSON.stringify(user),
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: error.message }),
      };
    }
    if (error instanceof ValidationError) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: error.message }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

async function handleGetUser(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuthContext(event);
    requirePermission(auth, 'user:read');

    const userId = event.pathParameters?.id;
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User ID is required' }),
      };
    }

    const user = await getUserById(userId);
    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(user),
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: error.message }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

async function handleUpdateUser(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuthContext(event);
    requirePermission(auth, 'user:update');

    const userId = event.pathParameters?.id;
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User ID is required' }),
      };
    }

    const user = await getUserById(userId);
    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { email, fullName, department, role, status } = body;

    if (email && !validateEmail(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid email' }),
      };
    }

    const now = Date.now();
    const updateExpression = [];
    const expressionAttributeValues: Record<string, unknown> = {};

    if (email !== undefined) {
      updateExpression.push('email = :email');
      expressionAttributeValues[':email'] = email;
    }
    if (fullName !== undefined) {
      updateExpression.push('fullName = :fullName');
      expressionAttributeValues[':fullName'] = fullName;
    }
    if (department !== undefined) {
      updateExpression.push('department = :department');
      expressionAttributeValues[':department'] = department;
    }
    if (role !== undefined) {
      updateExpression.push('role = :role');
      expressionAttributeValues[':role'] = role;
    }
    if (status !== undefined) {
      updateExpression.push('status = :status');
      expressionAttributeValues[':status'] = status;
    }

    updateExpression.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = now;

    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { pk: 'USER', sk: userId },
        UpdateExpression: 'SET ' + updateExpression.join(', '),
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );

    const auditLog = createAuditLog('USER_UPDATE', auth.userId, auth.username, {
      userId,
      changes: body,
    });
    await writeAuditLog(auditLog);

    const updatedUser = await getUserById(userId);
    return {
      statusCode: 200,
      body: JSON.stringify(updatedUser),
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: error.message }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

async function handleDeleteUser(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuthContext(event);
    requirePermission(auth, 'user:delete');

    const userId = event.pathParameters?.id;
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User ID is required' }),
      };
    }

    const user = await getUserById(userId);
    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    await docClient.send(
      new DeleteCommand({
        TableName: tableName,
        Key: { pk: 'USER', sk: userId },
      })
    );

    const auditLog = createAuditLog('USER_DELETE', auth.userId, auth.username, {
      userId,
    });
    await writeAuditLog(auditLog);

    return {
      statusCode: 204,
      body: '',
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: error.message }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

async function handleCreateReport(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuthContext(event);
    requirePermission(auth, 'report:create');

    const body = JSON.parse(event.body || '{}');
    const { userId, reportDate, workContent, achievement, issue, tomorrowPlan } = body;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'userId is required' }),
      };
    }
    if (!reportDate) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'reportDate is required' }),
      };
    }
    if (!workContent) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'workContent is required' }),
      };
    }

    const user = await getUserById(userId);
    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    const reportId = randomUUID();
    const now = Date.now();
    const report: DailyReport = {
      pk: 'REPORT',
      sk: reportId,
      reportId,
      userId,
      reportDate,
      workContent,
      achievement,
      issue,
      tomorrowPlan,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: report,
      })
    );

    const auditLog = createAuditLog('REPORT_CREATE', auth.userId, auth.username, {
      reportId,
      userId,
    });
    await writeAuditLog(auditLog);

    return {
      statusCode: 201,
      body: JSON.stringify(report),
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: error.message }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

async function handleGetReport(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuthContext(event);
    requirePermission(auth, 'report:read');

    const reportId = event.pathParameters?.id;
    if (!reportId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Report ID is required' }),
      };
    }

    const report = await getReportById(reportId);
    if (!report) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Report not found' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(report),
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: error.message }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

async function handleUpdateReport(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuthContext(event);
    requirePermission(auth, 'report:update');

    const reportId = event.pathParameters?.id;
    if (!reportId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Report ID is required' }),
      };
    }

    const report = await getReportById(reportId);
    if (!report) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Report not found' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { workContent, achievement, issue, tomorrowPlan } = body;

    const now = Date.now();
    const updateExpression = [];
    const expressionAttributeValues: Record<string, unknown> = {};

    if (workContent !== undefined) {
      updateExpression.push('workContent = :workContent');
      expressionAttributeValues[':workContent'] = workContent;
    }
    if (achievement !== undefined) {
      updateExpression.push('achievement = :achievement');
      expressionAttributeValues[':achievement'] = achievement;
    }
    if (issue !== undefined) {
      updateExpression.push('issue = :issue');
      expressionAttributeValues[':issue'] = issue;
    }
    if (tomorrowPlan !== undefined) {
      updateExpression.push('tomorrowPlan = :tomorrowPlan');
      expressionAttributeValues[':tomorrowPlan'] = tomorrowPlan;
    }

    updateExpression.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = now;

    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { pk: 'REPORT', sk: reportId },
        UpdateExpression: 'SET ' + updateExpression.join(', '),
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );

    const auditLog = createAuditLog('REPORT_UPDATE', auth.userId, auth.username, {
      reportId,
      changes: body,
    });
    await writeAuditLog(auditLog);

    const updatedReport = await getReportById(reportId);
    return {
      statusCode: 200,
      body: JSON.stringify(updatedReport),
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: error.message }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

async function handleDeleteReport(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuthContext(event);
    requirePermission(auth, 'report:delete');

    const reportId = event.pathParameters?.id;
    if (!reportId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Report ID is required' }),
      };
    }

    const report = await getReportById(reportId);
    if (!report) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Report not found' }),
      };
    }

    await docClient.send(
      new DeleteCommand({
        TableName: tableName,
        Key: { pk: 'REPORT', sk: reportId },
      })
    );

    const auditLog = createAuditLog('REPORT_DELETE', auth.userId, auth.username, {
      reportId,
    });
    await writeAuditLog(auditLog);

    return {
      statusCode: 204,
      body: '',
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: error.message }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

async function handleCreateReminder(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuthContext(event);
    requirePermission(auth, 'reminder:create');

    const body = JSON.parse(event.body || '{}');
    const { userId, enabled, sendTime, sendDays, sendMethod } = body;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'userId is required' }),
      };
    }
    if (enabled === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'enabled is required' }),
      };
    }
    if (!sendTime || !validateTime(sendTime)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid sendTime (HH:MM format required)' }),
      };
    }
    if (!sendMethod) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'sendMethod is required' }),
      };
    }

    const user = await getUserById(userId);
    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    const reminderId = randomUUID();
    const now = Date.now();
    const reminder: ReminderSetting = {
      pk: 'REMINDER',
      sk: reminderId,
      reminderId,
      userId,
      enabled,
      sendTime,
      sendDays,
      sendMethod,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: reminder,
      })
    );

    const auditLog = createAuditLog('REMINDER_CREATE', auth.userId, auth.username, {
      reminderId,
      userId,
    });
    await writeAuditLog(auditLog);

    return {
      statusCode: 201,
      body: JSON.stringify(reminder),
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: error.message }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

async function handleGetReminder(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuthContext(event);
    requirePermission(auth, 'reminder:read');

    const reminderId = event.pathParameters?.id;
    if (!reminderId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Reminder ID is required' }),
      };
    }

    const reminder = await getReminderById(reminderId);
    if (!reminder) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Reminder not found' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(reminder),
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: error.message }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

async function handleUpdateReminder(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuthContext(event);
    requirePermission(auth, 'reminder:update');

    const reminderId = event.pathParameters?.id;
    if (!reminderId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Reminder ID is required' }),
      };
    }

    const reminder = await getReminderById(reminderId);
    if (!reminder) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Reminder not found' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { enabled, sendTime, sendDays, sendMethod } = body;

    if (sendTime && !validateTime(sendTime)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid sendTime (HH:MM format required)' }),
      };
    }

    const now = Date.now();
    const updateExpression = [];
    const expressionAttributeValues: Record<string, unknown> = {};

    if (enabled !== undefined) {
      updateExpression.push('enabled = :enabled');
      expressionAttributeValues[':enabled'] = enabled;
    }
    if (sendTime !== undefined) {
      updateExpression.push('sendTime = :sendTime');
      expressionAttributeValues[':sendTime'] = sendTime;
    }
    if (sendDays !== undefined) {
      updateExpression.push('sendDays = :sendDays');
      expressionAttributeValues[':sendDays'] = sendDays;
    }
    if (sendMethod !== undefined) {
      updateExpression.push('sendMethod = :sendMethod');
      expressionAttributeValues[':sendMethod'] = sendMethod;
    }

    updateExpression.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = now;

    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { pk: 'REMINDER', sk: reminderId },
        UpdateExpression: 'SET ' + updateExpression.join(', '),
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );

    const auditLog = createAuditLog('REMINDER_UPDATE', auth.userId, auth.username, {
      reminderId,
      changes: body,
    });
    await writeAuditLog(auditLog);

    const updatedReminder = await getReminderById(reminderId);
    return {
      statusCode: 200,
      body: JSON.stringify(updatedReminder),
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: error.message }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

async function handleDeleteReminder(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuthContext(event);
    requirePermission(auth, 'reminder:delete');

    const reminderId = event.pathParameters?.id;
    if (!reminderId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Reminder ID is required' }),
      };
    }

    const reminder = await getReminderById(reminderId);
    if (!reminder) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Reminder not found' }),
      };
    }

    await docClient.send(
      new DeleteCommand({
        TableName: tableName,
        Key: { pk: 'REMINDER', sk: reminderId },
      })
    );

    const auditLog = createAuditLog('REMINDER_DELETE', auth.userId, auth.username, {
      reminderId,
    });
    await writeAuditLog(auditLog);

    return {
      statusCode: 204,
      body: '',
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: error.message }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

async function handleCreateDetectionLog(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuthContext(event);
    requirePermission(auth, 'detection:create');

    const body = JSON.parse(event.body || '{}');
    const { userId, targetDate, reminderSent, reminderSentAt, status } = body;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'userId is required' }),
      };
    }
    if (!targetDate) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'targetDate is required' }),
      };
    }
    if (reminderSent === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'reminderSent is required' }),
      };
    }
    if (!status) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'status is required' }),
      };
    }

    const user = await getUserById(userId);
    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    const logId = randomUUID();
    const now = Date.now();
    const detectionLog: DetectionLog = {
      pk: 'DETECTION',
      sk: logId,
      logId,
      userId,
      targetDate,
      detectedAt: now,
      reminderSent,
      reminderSentAt,
      status,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: detectionLog,
      })
    );

    const auditLog = createAuditLog('DETECTION_CREATE', auth.userId, auth.username, {
      logId,
      userId,
    });
    await writeAuditLog(auditLog);

    return {
      statusCode: 201,
      body: JSON.stringify(detectionLog),
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: error.message }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

async function handleGetDetectionLog(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuthContext(event);
    requirePermission(auth, 'detection:read');

    const logId = event.pathParameters?.id;
    if (!logId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Log ID is required' }),
      };
    }

    const log = await getDetectionLogById(logId);
    if (!log) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Detection log not found' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(log),
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: error.message }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

async function handleUpdateDetectionLog(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuthContext(event);
    requirePermission(auth, 'detection:update');

    const logId = event.pathParameters?.id;
    if (!logId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Log ID is required' }),
      };
    }

    const log = await getDetectionLogById(logId);
    if (!log) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Detection log not found' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { reminderSent, reminderSentAt, status } = body;

    const now = Date.now();
    const updateExpression = [];
    const expressionAttributeValues: Record<string, unknown> = {};

    if (reminderSent !== undefined) {
      updateExpression.push('reminderSent = :reminderSent');
      expressionAttributeValues[':reminderSent'] = reminderSent;
    }
    if (reminderSentAt !== undefined) {
      updateExpression.push('reminderSentAt = :reminderSentAt');
      expressionAttributeValues[':reminderSentAt'] = reminderSentAt;
    }
    if (status !== undefined) {
      updateExpression.push('status = :status');
      expressionAttributeValues[':status'] = status;
    }

    updateExpression.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = now;

    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { pk: 'DETECTION', sk: logId },
        UpdateExpression: 'SET ' + updateExpression.join(', '),
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );

    const auditLog = createAuditLog('DETECTION_UPDATE', auth.userId, auth.username, {
      logId,
      changes: body,
    });
    await writeAuditLog(auditLog);

    const updatedLog = await getDetectionLogById(logId);
    return {
      statusCode: 200,
      body: JSON.stringify(updatedLog),
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: error.message }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

async function handleDeleteDetectionLog(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuthContext(event);
    requirePermission(auth, 'detection:delete');

    const logId = event.pathParameters?.id;
    if (!logId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Log ID is required' }),
      };
    }

    const log = await getDetectionLogById(logId);
    if (!log) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Detection log not found' }),
      };
    }

    await docClient.send(
      new DeleteCommand({
        TableName: tableName,
        Key: { pk: 'DETECTION', sk: logId },
      })
    );

    const auditLog = createAuditLog('DETECTION_DELETE', auth.userId, auth.username, {
      logId,
    });
    await writeAuditLog(auditLog);

    return {
      statusCode: 204,
      body: '',
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: error.message }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

async function handleCreateEmailHistory(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuthContext(event);
    requirePermission(auth, 'email:create');

    const body = JSON.parse(event.body || '{}');
    const {
      userId,
      emailType,
      toAddress,
      subject,
      emailBody,
      status,
      errorMessage,
      relatedReportId,
      relatedReminderId,
      retryFlag,
    } = body;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'userId is required' }),
      };
    }
    if (!emailType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'emailType is required' }),
      };
    }
    if (!toAddress || !validateEmail(toAddress)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid toAddress' }),
      };
    }
    if (!subject) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'subject is required' }),
      };
    }
    if (!emailBody) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'emailBody is required' }),
      };
    }
    if (!status) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'status is required' }),
      };
    }

    const user = await getUserById(userId);
    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    const emailId = randomUUID();
    const now = Date.now();
    const emailHistory: EmailHistory = {
      pk: 'EMAIL',
      sk: emailId,
      emailId,
      userId,
      emailType,
      toAddress,
      subject,
      body: emailBody,
      sentAt: now,
      status,
      errorMessage,
      relatedReportId,
      relatedReminderId,
      retryFlag: retryFlag || false,
      createdAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: emailHistory,
      })
    );

    const auditLog = createAuditLog('EMAIL_CREATE', auth.userId, auth.username, {
      emailId,
      userId,
      emailType,
    });
    await writeAuditLog(auditLog);

    return {
      statusCode: 201,
      body: JSON.stringify(emailHistory),
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: error.message }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

async function handleGetEmailHistory(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuthContext(event);
    requirePermission(auth, 'email:read');

    const emailId = event.pathParameters?.id;
    if (!emailId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email ID is required' }),
      };
    }

    const email = await getEmailHistoryById(emailId);
    if (!email) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Email history not found' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(email),
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: error.message }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

async function handleUpdateEmailHistory(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuthContext(event);
    requirePermission(auth, 'email:update');

    const emailId = event.pathParameters?.id;
    if (!emailId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email ID is required' }),
      };
    }

    const email = await getEmailHistoryById(emailId);
    if (!email) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Email history not found' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { status, errorMessage, retryFlag } = body;

    const updateExpression = [];
    const expressionAttributeValues: Record<string, unknown> = {};

    if (status !== undefined) {
      updateExpression.push('status = :status');
      expressionAttributeValues[':status'] = status;
    }
    if (errorMessage !== undefined) {
      updateExpression.push('errorMessage = :errorMessage');
      expressionAttributeValues[':errorMessage'] = errorMessage;
    }
    if (retryFlag !== undefined) {
      updateExpression.push('retryFlag = :retryFlag');
      expressionAttributeValues[':retryFlag'] = retryFlag;
    }

    if (updateExpression.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No fields to update' }),
      };
    }

    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { pk: 'EMAIL', sk: emailId },
        UpdateExpression: 'SET ' + updateExpression.join(', '),
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );

    const auditLog = createAuditLog('EMAIL_UPDATE', auth.userId, auth.username, {
      emailId,
      changes: body,
    });
    await writeAuditLog(auditLog);

    const updatedEmail = await getEmailHistoryById(emailId);
    return {
      statusCode: 200,
      body: JSON.stringify(updatedEmail),
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: error.message }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

async function handleDeleteEmailHistory(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuthContext(event);
    requirePermission(auth, 'email:delete');

    const emailId = event.pathParameters?.id;
    if (!emailId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email ID is required' }),
      };
    }

    const email = await getEmailHistoryById(emailId);
    if (!email) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Email history not found' }),
      };
    }

    await docClient.send(
      new DeleteCommand({
        TableName: tableName,
        Key: { pk: 'EMAIL', sk: emailId },
      })
    );

    const auditLog = createAuditLog('EMAIL_DELETE', auth.userId, auth.username, {
      emailId,
    });
    await writeAuditLog(auditLog);

    return {
      statusCode: 204,
      body: '',
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: error.message }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

interface BulkImportRequest {
  items: Record<string, unknown>[];
}

interface BulkImportResponse {
  imported: number;
  failed: number;
  errors: string[];
}

async function handleBulkImport(
  event: APIGatewayProxyEvent,
  tableIndex: string
): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuthContext(event);
    requirePermission(auth, 'bulk:import');

    const body = JSON.parse(event.body || '{}') as BulkImportRequest;
    if (!body.items || !Array.isArray(body.items)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'items array is required' }),
      };
    }

    const items = body.items;
    const now = Date.now();
    const errors: string[] = [];
    let imported = 0;
    let failed = 0;

    const tableMap: Record<string, string> = {
      '0': 'USER',
      '1': 'REPORT',
      '2': 'REMINDER',
      '3': 'DETECTION',
      '4': 'EMAIL',
    };

    const pk = tableMap[tableIndex];
    if (!pk) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid table index' }),
      };
    }

    const chunks: Record<string, unknown>[][] = [];
    for (let i = 0; i < items.length; i += 25) {
      chunks.push(items.slice(i, i + 25));
    }

    for (const chunk of chunks) {
      const writeRequests = chunk.map((item) => {
        const id = randomUUID();
        const enrichedItem = {
          ...item,
          pk,
          sk: id,
          id,
          createdAt: now,
          updatedAt: now,
        };
        return {
          PutRequest: {
            Item: enrichedItem,
          },
        };
      });

      try {
        const params: BatchWriteItemCommandInput = {
          RequestItems: {
            [tableName]: writeRequests,
          },
        };
        await client.send(new BatchWriteItemCommand(params));
        imported += chunk.length;
      } catch (error) {
        failed += chunk.length;
        errors.push(`Batch write failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    const auditLog = createAuditLog('BULK_IMPORT', auth.userId, auth.username, {
      tableIndex,
      pk,
      imported,
      failed,
    });
    await writeAuditLog(auditLog);

    const response: BulkImportResponse = {
      imported,
      failed,
      errors,
    };

    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: error.message }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const path = event.path || '';
  const method = event.httpMethod || 'GET';

  try {
    if (path === '/resources' && method === 'GET') {
      return await handleGetResources(event);
    }

    if (path === '/api/users' && method === 'POST') {
      return await handleCreateUser(event);
    }
    if (path.match(/^\/api\/users\/[^/]+$/) && method === 'GET') {
      return await handleGetUser(event);
    }
    if (path.match(/^\/api\/users\/[^/]+$/) && method === 'PUT') {
      return await handleUpdateUser(event);
    }
    if (path.match(/^\/api\/users\/[^/]+$/) && method === 'DELETE') {
      return await handleDeleteUser(event);
    }

    if (path === '/api/reports' && method === 'POST') {
      return await handleCreateReport(event);
    }
    if (path.match(/^\/api\/reports\/[^/]+$/) && method === 'GET') {
      return await handleGetReport(event);
    }
    if (path.match(/^\/api\/reports\/[^/]+$/) && method === 'PUT') {
      return await handleUpdateReport(event);
    }
    if (path.match(/^\/api\/reports\/[^/]+$/) && method === 'DELETE') {
      return await handleDeleteReport(event);
    }

    if (path === '/api/reminders' && method === 'POST') {
      return await handleCreateReminder(event);
    }
    if (path.match(/^\/api\/reminders\/[^/]+$/) && method === 'GET') {
      return await handleGetReminder(event);
    }
    if (path.match(/^\/api\/reminders\/[^/]+$/) && method === 'PUT') {
      return await handleUpdateReminder(event);
    }
    if (path.match(/^\/api\/reminders\/[^/]+$/) && method === 'DELETE') {
      return await handleDeleteReminder(event);
    }

    if (path === '/api/detection-logs' && method === 'POST') {
      return await handleCreateDetectionLog(event);
    }
    if (path.match(/^\/api\/detection-logs\/[^/]+$/) && method === 'GET') {
      return await handleGetDetectionLog(event);
    }
    if (path.match(/^\/api\/detection-logs\/[^/]+$/) && method === 'PUT') {
      return await handleUpdateDetectionLog(event);
    }
    if (path.match(/^\/api\/detection-logs\/[^/]+$/) && method === 'DELETE') {
      return await handleDeleteDetectionLog(event);
    }

    if (path === '/api/email-histories' && method === 'POST') {
      return await handleCreateEmailHistory(event);
    }
    if (path.match(/^\/api\/email-histories\/[^/]+$/) && method === 'GET') {
      return await handleGetEmailHistory(event);
    }
    if (path.match(/^\/api\/email-histories\/[^/]+$/) && method === 'PUT') {
      return await handleUpdateEmailHistory(event);
    }
    if (path.match(/^\/api\/email-histories\/[^/]+$/) && method === 'DELETE') {
      return await handleDeleteEmailHistory(event);
    }

    const bulkMatch = path.match(/^\/api\/(\d+)\/bulk$/);
    if (bulkMatch && method === 'POST') {
      return await handleBulkImport(event, bulkMatch[1]);
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Not found' }),
    };
  } catch (error) {
    console.error('Unhandled error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};