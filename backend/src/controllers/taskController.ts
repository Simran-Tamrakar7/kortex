import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';
import { socketManager } from '../sockets/socketManager';
import { logActivity } from '../services/activityService';
import { createNotification } from '../services/notificationService';
import { processAutomations } from '../services/automationService';
import { calculateTaskSLA } from '../services/slaService';
import { SOCKET_EVENTS, Priority } from '@kortex/shared';

export async function getTasks(req: AuthRequest, res: Response) {
  try {
    const { projectId, sprintId, epicId, statusId, assigneeId, search, isArchived } = req.query;

    if (!projectId) return res.status(400).json({ error: 'projectId is required' });

    const where: any = {
      projectId: String(projectId),
      isArchived: isArchived === 'true',
    };

    if (sprintId !== undefined) {
      where.sprintId = sprintId === 'null' || sprintId === '' ? null : String(sprintId);
    }
    if (epicId !== undefined) {
      where.epicId = epicId === 'null' || epicId === '' ? null : String(epicId);
    }
    if (statusId) {
      where.statusId = String(statusId);
    }
    if (assigneeId) {
      where.assignees = { some: { userId: String(assigneeId) } };
    }
    if (search) {
      where.OR = [
        { title: { contains: String(search) } },
        { description: { contains: String(search) } },
        { key: { contains: String(search) } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        status: true,
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        reporter: { select: { id: true, name: true, email: true, avatarUrl: true } },
        sprint: true,
        epic: { select: { id: true, key: true, title: true, priority: true } },
        parent: { select: { id: true, key: true, title: true } },
        subtasks: {
          select: { id: true, key: true, title: true, statusId: true, priority: true, issueType: true },
        },
        customFieldValues: {
          include: { field: true },
        },
        dependencies: {
          include: {
            dependsOnTask: { select: { id: true, key: true, title: true, statusId: true, priority: true } },
          },
        },
        _count: {
          select: { comments: true, attachments: true },
        },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    const project = await prisma.project.findUnique({
      where: { id: String(projectId) },
      include: { slaConfig: true },
    });

    // Format tasks & attach SLA
    const formatted = tasks.map((t) => {
      let labels: string[] = [];
      let checklists: any[] = [];
      let customFieldsMap: Record<string, any> = {};

      try {
        labels = t.labelsJson ? JSON.parse(t.labelsJson) : [];
      } catch (e) {}
      try {
        checklists = t.checklistsJson ? JSON.parse(t.checklistsJson) : [];
      } catch (e) {}

      t.customFieldValues.forEach((cf) => {
        try {
          customFieldsMap[cf.fieldId] = cf.valueJson ? JSON.parse(cf.valueJson) : null;
        } catch (e) {
          customFieldsMap[cf.fieldId] = cf.valueJson;
        }
      });

      const isResolved = t.status?.category === 'DONE';
      const sla = project?.slaConfig
        ? calculateTaskSLA(t.createdAt, t.priority as Priority, project.slaConfig, isResolved)
        : null;

      return {
        ...t,
        labels,
        checklists,
        customFieldValues: customFieldsMap,
        assignees: t.assignees.map((a) => a.user),
        assigneeIds: t.assignees.map((a) => a.userId),
        commentsCount: t._count.comments,
        attachmentsCount: t._count.attachments,
        slaBreached: sla?.isBreached || false,
        slaRemainingMinutes: sla?.remainingMinutes,
      };
    });

    return res.json(formatted);
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    return res.status(500).json({ error: 'Failed to fetch tasks', details: error.message });
  }
}

export async function getTask(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        status: true,
        project: {
          include: {
            statuses: { orderBy: { order: 'asc' } },
            customFields: true,
            slaConfig: true,
          },
        },
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        watchers: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        reporter: { select: { id: true, name: true, email: true, avatarUrl: true } },
        sprint: true,
        epic: { select: { id: true, key: true, title: true, priority: true } },
        parent: { select: { id: true, key: true, title: true } },
        subtasks: {
          include: {
            status: true,
            assignees: { include: { user: true } },
          },
        },
        dependencies: {
          include: {
            dependsOnTask: { select: { id: true, key: true, title: true, statusId: true, priority: true } },
          },
        },
        dependentOnBy: {
          include: {
            task: { select: { id: true, key: true, title: true, statusId: true, priority: true } },
          },
        },
        customFieldValues: {
          include: { field: true },
        },
        comments: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        attachments: {
          include: {
            uploader: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        activityLogs: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) return res.status(404).json({ error: 'Task not found' });

    let labels: string[] = [];
    let checklists: any[] = [];
    let customFieldsMap: Record<string, any> = {};

    try {
      labels = task.labelsJson ? JSON.parse(task.labelsJson) : [];
    } catch (e) {}
    try {
      checklists = task.checklistsJson ? JSON.parse(task.checklistsJson) : [];
    } catch (e) {}

    task.customFieldValues.forEach((cf) => {
      try {
        customFieldsMap[cf.fieldId] = cf.valueJson ? JSON.parse(cf.valueJson) : null;
      } catch (e) {
        customFieldsMap[cf.fieldId] = cf.valueJson;
      }
    });

    const isResolved = task.status?.category === 'DONE';
    const sla = task.project?.slaConfig
      ? calculateTaskSLA(task.createdAt, task.priority as Priority, task.project.slaConfig, isResolved)
      : null;

    return res.json({
      ...task,
      labels,
      checklists,
      customFieldValues: customFieldsMap,
      assignees: task.assignees.map((a) => a.user),
      assigneeIds: task.assignees.map((a) => a.userId),
      watcherIds: task.watchers.map((w) => w.userId),
      slaBreached: sla?.isBreached || false,
      slaRemainingMinutes: sla?.remainingMinutes,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch task', details: error.message });
  }
}

export async function createTask(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const {
      projectId,
      title,
      description,
      issueType,
      priority,
      statusId,
      assigneeIds,
      sprintId,
      epicId,
      parentId,
      storyPoints,
      tShirtSize,
      timeEstimateMinutes,
      startDate,
      dueDate,
      labels,
      checklists,
      customFieldValues,
    } = req.body;

    if (!projectId || !title) {
      return res.status(400).json({ error: 'projectId and title are required' });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { statuses: { orderBy: { order: 'asc' } } },
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Generate task key (e.g. KOR-101)
    const taskCount = await prisma.task.count({ where: { projectId } });
    const taskKey = `${project.key}-${taskCount + 1}`;

    const chosenStatusId = statusId || project.statuses[0]?.id;

    const task = await prisma.task.create({
      data: {
        key: taskKey,
        projectId,
        title,
        description: description || '',
        issueType: issueType || 'TASK',
        priority: priority || 'MEDIUM',
        statusId: chosenStatusId,
        reporterId: req.user.id,
        sprintId: sprintId || null,
        epicId: epicId || null,
        parentId: parentId || null,
        storyPoints: storyPoints !== undefined ? Number(storyPoints) : null,
        tShirtSize: tShirtSize || null,
        timeEstimateMinutes: timeEstimateMinutes ? Number(timeEstimateMinutes) : null,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        labelsJson: JSON.stringify(labels || []),
        checklistsJson: JSON.stringify(checklists || []),
        order: taskCount,
        assignees: assigneeIds?.length
          ? {
              create: assigneeIds.map((userId: string) => ({ userId })),
            }
          : undefined,
      },
      include: {
        status: true,
        assignees: { include: { user: true } },
        reporter: true,
      },
    });

    // Save custom fields if provided
    if (customFieldValues && typeof customFieldValues === 'object') {
      for (const [fieldId, val] of Object.entries(customFieldValues)) {
        await prisma.customFieldValue.upsert({
          where: { taskId_fieldId: { taskId: task.id, fieldId } },
          update: { valueJson: JSON.stringify(val) },
          create: { taskId: task.id, fieldId, valueJson: JSON.stringify(val) },
        });
      }
    }

    // Log Activity
    await logActivity({
      taskId: task.id,
      userId: req.user.id,
      action: `Created task ${task.key}: "${task.title}"`,
    });

    // Notify assignees
    if (assigneeIds?.length) {
      for (const uid of assigneeIds) {
        if (uid !== req.user.id) {
          await createNotification({
            userId: uid,
            title: 'Task Assigned',
            message: `${req.user.name} assigned you to ${task.key}: ${task.title}`,
            type: 'TASK_ASSIGNED',
            entityType: 'TASK',
            entityId: task.id,
          });
        }
      }
    }

    // Trigger automations
    processAutomations({
      projectId,
      taskId: task.id,
      triggerType: 'TASK_CREATED',
      userId: req.user.id,
    });

    socketManager.broadcastToProject(projectId, SOCKET_EVENTS.TASK_CREATED, task);

    return res.status(201).json(task);
  } catch (error: any) {
    console.error('Error creating task:', error);
    return res.status(500).json({ error: 'Failed to create task', details: error.message });
  }
}

export async function updateTask(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const updates = req.body;

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        status: true,
        assignees: true,
      },
    });

    if (!existingTask) return res.status(404).json({ error: 'Task not found' });

    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.issueType !== undefined) updateData.issueType = updates.issueType;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.statusId !== undefined) updateData.statusId = updates.statusId;
    if (updates.sprintId !== undefined) updateData.sprintId = updates.sprintId || null;
    if (updates.epicId !== undefined) updateData.epicId = updates.epicId || null;
    if (updates.parentId !== undefined) updateData.parentId = updates.parentId || null;
    if (updates.storyPoints !== undefined) updateData.storyPoints = updates.storyPoints !== null ? Number(updates.storyPoints) : null;
    if (updates.tShirtSize !== undefined) updateData.tShirtSize = updates.tShirtSize;
    if (updates.timeEstimateMinutes !== undefined) updateData.timeEstimateMinutes = updates.timeEstimateMinutes;
    if (updates.startDate !== undefined) updateData.startDate = updates.startDate ? new Date(updates.startDate) : null;
    if (updates.dueDate !== undefined) updateData.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
    if (updates.labels !== undefined) updateData.labelsJson = JSON.stringify(updates.labels);
    if (updates.checklists !== undefined) updateData.checklistsJson = JSON.stringify(updates.checklists);
    if (updates.order !== undefined) updateData.order = updates.order;
    if (updates.isArchived !== undefined) updateData.isArchived = updates.isArchived;

    // Handle assignees update
    if (updates.assigneeIds !== undefined) {
      await prisma.taskAssignee.deleteMany({ where: { taskId: id } });
      if (updates.assigneeIds.length) {
        await prisma.taskAssignee.createMany({
          data: updates.assigneeIds.map((userId: string) => ({ taskId: id, userId })),
        });
      }
    }

    // Handle watchers update
    if (updates.watcherIds !== undefined) {
      await prisma.taskWatcher.deleteMany({ where: { taskId: id } });
      if (updates.watcherIds.length) {
        await prisma.taskWatcher.createMany({
          data: updates.watcherIds.map((userId: string) => ({ taskId: id, userId })),
        });
      }
    }

    // Handle custom fields
    if (updates.customFieldValues && typeof updates.customFieldValues === 'object') {
      for (const [fieldId, val] of Object.entries(updates.customFieldValues)) {
        await prisma.customFieldValue.upsert({
          where: { taskId_fieldId: { taskId: id, fieldId } },
          update: { valueJson: JSON.stringify(val) },
          create: { taskId: id, fieldId, valueJson: JSON.stringify(val) },
        });
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        status: true,
        assignees: { include: { user: true } },
        reporter: true,
        sprint: true,
        epic: true,
      },
    });

    // Check status change and log/automation
    if (updates.statusId && updates.statusId !== existingTask.statusId) {
      const newStatus = await prisma.status.findUnique({ where: { id: updates.statusId } });
      await logActivity({
        taskId: id,
        userId: req.user.id,
        action: `Moved task from ${existingTask.status.name} to ${newStatus?.name}`,
        field: 'status',
        oldValue: existingTask.status.name,
        newValue: newStatus?.name,
      });

      // Automation trigger
      processAutomations({
        projectId: existingTask.projectId,
        taskId: id,
        triggerType: 'STATUS_CHANGED',
        triggerData: { toStatusId: updates.statusId },
        userId: req.user.id,
      });
    }

    // Priority change
    if (updates.priority && updates.priority !== existingTask.priority) {
      await logActivity({
        taskId: id,
        userId: req.user.id,
        action: `Changed priority to ${updates.priority}`,
        field: 'priority',
        oldValue: existingTask.priority,
        newValue: updates.priority,
      });

      processAutomations({
        projectId: existingTask.projectId,
        taskId: id,
        triggerType: 'PRIORITY_CHANGED',
        triggerData: { priority: updates.priority },
        userId: req.user.id,
      });
    }

    socketManager.broadcastToProject(existingTask.projectId, SOCKET_EVENTS.TASK_UPDATED, updatedTask);
    socketManager.broadcastToTask(id, SOCKET_EVENTS.TASK_UPDATED, updatedTask);

    return res.json(updatedTask);
  } catch (error: any) {
    console.error('Error updating task:', error);
    return res.status(500).json({ error: 'Failed to update task', details: error.message });
  }
}

export async function bulkUpdateTasks(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { taskIds, statusId, priority, assigneeIds, sprintId, isArchived, deletePermanent } = req.body;

    if (!Array.isArray(taskIds) || !taskIds.length) {
      return res.status(400).json({ error: 'taskIds array is required' });
    }

    if (deletePermanent) {
      await prisma.task.deleteMany({ where: { id: { in: taskIds } } });
      return res.json({ success: true, count: taskIds.length });
    }

    const updateData: any = {};
    if (statusId !== undefined) updateData.statusId = statusId;
    if (priority !== undefined) updateData.priority = priority;
    if (sprintId !== undefined) updateData.sprintId = sprintId || null;
    if (isArchived !== undefined) updateData.isArchived = isArchived;

    await prisma.task.updateMany({
      where: { id: { in: taskIds } },
      data: updateData,
    });

    if (assigneeIds !== undefined) {
      for (const taskId of taskIds) {
        await prisma.taskAssignee.deleteMany({ where: { taskId } });
        if (assigneeIds.length) {
          await prisma.taskAssignee.createMany({
            data: assigneeIds.map((userId: string) => ({ taskId, userId })),
          });
        }
      }
    }

    return res.json({ success: true, count: taskIds.length });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to bulk update tasks' });
  }
}

export async function deleteTask(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    await prisma.task.delete({ where: { id } });
    socketManager.broadcastToProject(task.projectId, SOCKET_EVENTS.TASK_DELETED, { id, projectId: task.projectId });

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to delete task' });
  }
}

// Dependencies
export async function addDependency(req: AuthRequest, res: Response) {
  try {
    const { taskId, dependsOnTaskId, type } = req.body;
    if (!taskId || !dependsOnTaskId) {
      return res.status(400).json({ error: 'taskId and dependsOnTaskId are required' });
    }

    const dep = await prisma.taskDependency.create({
      data: {
        taskId,
        dependsOnTaskId,
        type: type || 'BLOCKS',
      },
      include: {
        dependsOnTask: true,
      },
    });

    return res.status(201).json(dep);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to add dependency' });
  }
}

export async function removeDependency(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.taskDependency.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to remove dependency' });
  }
}
