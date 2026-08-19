import { prisma } from '../db';
import { socketManager } from '../sockets/socketManager';
import { createNotification } from './notificationService';
import { logActivity } from './activityService';
import { SOCKET_EVENTS } from '@kortex/shared';

interface AutomationTriggerPayload {
  projectId: string;
  taskId: string;
  triggerType: 'STATUS_CHANGED' | 'ASSIGNEE_ADDED' | 'DUE_DATE_PASSED' | 'TASK_CREATED' | 'PRIORITY_CHANGED';
  triggerData?: Record<string, any>;
  userId?: string;
  depth?: number;
}

export async function processAutomations(payload: AutomationTriggerPayload) {
  // Prevent infinite automation loops / cascades
  if ((payload.depth || 0) > 3) {
    return;
  }

  try {
    // 1. Fetch active rules ordered deterministically by creation time
    const rules = await prisma.automationRule.findMany({
      where: {
        projectId: payload.projectId,
        isEnabled: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!rules.length) return;

    const task = await prisma.task.findUnique({
      where: { id: payload.taskId },
      include: {
        status: true,
        assignees: { include: { user: true } },
        reporter: true,
      },
    });

    if (!task) return;

    // Track field modifications in this cycle to detect & handle conflicting rules
    const modifiedFieldsMap = new Map<string, string>(); // fieldName -> ruleName

    for (const rule of rules) {
      let triggerJson: any = {};
      let conditionsJson: any[] = [];
      let actionsJson: any[] = [];

      try {
        triggerJson = JSON.parse(rule.triggerJson);
      } catch (e) {}
      try {
        conditionsJson = JSON.parse(rule.conditionsJson);
      } catch (e) {}
      try {
        actionsJson = JSON.parse(rule.actionsJson);
      } catch (e) {}

      // 1. Check Trigger Match
      if (triggerJson.type !== payload.triggerType) {
        continue;
      }

      if (triggerJson.config?.toStatusId && payload.triggerData?.toStatusId) {
        if (triggerJson.config.toStatusId !== payload.triggerData.toStatusId) {
          continue;
        }
      }

      // 2. Check Conditions
      let conditionsMet = true;
      for (const cond of conditionsJson) {
        const val = (task as any)[cond.field];
        if (cond.operator === 'EQUALS' && String(val) !== String(cond.value)) {
          conditionsMet = false;
          break;
        }
        if (cond.operator === 'NOT_EQUALS' && String(val) === String(cond.value)) {
          conditionsMet = false;
          break;
        }
        if (cond.operator === 'CONTAINS') {
          if (Array.isArray(val) && !val.includes(cond.value)) {
            conditionsMet = false;
            break;
          }
          if (typeof val === 'string' && !val.includes(cond.value)) {
            conditionsMet = false;
            break;
          }
        }
      }

      if (!conditionsMet) continue;

      // 3. Execute Actions with Conflict Awareness
      for (const action of actionsJson) {
        if (action.type === 'SET_STATUS' && action.config?.statusId) {
          const prevRule = modifiedFieldsMap.get('status');
          if (prevRule) {
            await logActivity({
              taskId: task.id,
              userId: payload.userId || task.reporterId,
              action: `ℹ️ Conflict Note: Automation "${rule.name}" overrode status previously set by "${prevRule}"`,
            });
          }
          modifiedFieldsMap.set('status', rule.name);

          await prisma.task.update({
            where: { id: task.id },
            data: { statusId: action.config.statusId },
          });
          await logActivity({
            taskId: task.id,
            userId: payload.userId || task.reporterId,
            action: `Automation "${rule.name}" changed status to ${action.config.statusName || 'new status'}`,
          });
        } else if (action.type === 'SET_PRIORITY' && action.config?.priority) {
          const prevRule = modifiedFieldsMap.get('priority');
          if (prevRule) {
            await logActivity({
              taskId: task.id,
              userId: payload.userId || task.reporterId,
              action: `ℹ️ Conflict Note: Automation "${rule.name}" overrode priority previously set by "${prevRule}"`,
            });
          }
          modifiedFieldsMap.set('priority', rule.name);

          await prisma.task.update({
            where: { id: task.id },
            data: { priority: action.config.priority },
          });
          await logActivity({
            taskId: task.id,
            userId: payload.userId || task.reporterId,
            action: `Automation "${rule.name}" set priority to ${action.config.priority}`,
          });
        } else if (action.type === 'ADD_LABEL' && action.config?.label) {
          const currentLabels: string[] = task.labelsJson ? JSON.parse(task.labelsJson) : [];
          if (!currentLabels.includes(action.config.label)) {
            currentLabels.push(action.config.label);
            await prisma.task.update({
              where: { id: task.id },
              data: { labelsJson: JSON.stringify(currentLabels) },
            });
          }
        } else if (action.type === 'POST_COMMENT' && action.config?.message) {
          await prisma.comment.create({
            data: {
              taskId: task.id,
              userId: payload.userId || task.reporterId,
              content: `🤖 **Automation Bot**: ${action.config.message}`,
            },
          });
        } else if (action.type === 'SEND_NOTIFICATION') {
          const targetUserId = action.config?.userId || task.assignees[0]?.userId || task.reporterId;
          if (targetUserId) {
            await createNotification({
              userId: targetUserId,
              title: `Automation: ${rule.name}`,
              message: action.config?.message || `Rule executed for task ${task.key}: ${task.title}`,
              type: 'SYSTEM',
              entityType: 'TASK',
              entityId: task.id,
            });
          }
        }
      }

      // Update rule execution count
      await prisma.automationRule.update({
        where: { id: rule.id },
        data: {
          executionCount: { increment: 1 },
          lastExecutedAt: new Date(),
        },
      });

      // Broadcast task update
      const updatedTask = await prisma.task.findUnique({
        where: { id: task.id },
        include: {
          status: true,
          assignees: { include: { user: true } },
          reporter: true,
        },
      });
      socketManager.broadcastToProject(payload.projectId, SOCKET_EVENTS.TASK_UPDATED, updatedTask);
    }
  } catch (error) {
    console.error('Error running automations:', error);
  }
}
