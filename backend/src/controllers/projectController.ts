import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';
import { ProjectType } from '@kortex/shared';

export async function getProject(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        statuses: { orderBy: { order: 'asc' } },
        views: { orderBy: { createdAt: 'asc' } },
        customFields: true,
        sprints: { orderBy: { createdAt: 'desc' } },
        slaConfig: true,
        workspace: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, email: true, avatarUrl: true } },
              },
            },
          },
        },
      },
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });
    return res.json(project);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch project', details: error.message });
  }
}

export async function createProject(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { workspaceId, folderId, name, key, type, description, icon, estimationType } = req.body;

    if (!workspaceId || !name || !key) {
      return res.status(400).json({ error: 'workspaceId, name, and key are required' });
    }

    const projectKey = key.toUpperCase().trim();

    // Determine initial statuses based on project type
    let defaultStatuses = [
      { name: 'To Do', category: 'TODO', color: '#64748b', order: 0 },
      { name: 'In Progress', category: 'IN_PROGRESS', color: '#3b82f6', order: 1 },
      { name: 'Review', category: 'IN_REVIEW', color: '#f59e0b', order: 2 },
      { name: 'Done', category: 'DONE', color: '#10b981', order: 3 },
    ];

    if (type === 'SOFTWARE_SCRUM') {
      defaultStatuses = [
        { name: 'Backlog', category: 'TODO', color: '#64748b', order: 0 },
        { name: 'To Do', category: 'TODO', color: '#3b82f6', order: 1 },
        { name: 'In Progress', category: 'IN_PROGRESS', color: '#8b5cf6', order: 2 },
        { name: 'Code Review', category: 'IN_REVIEW', color: '#f59e0b', order: 3 },
        { name: 'Done', category: 'DONE', color: '#10b981', order: 4 },
      ];
    } else if (type === 'SERVICE_DESK') {
      defaultStatuses = [
        { name: 'Open', category: 'TODO', color: '#ef4444', order: 0 },
        { name: 'In Progress', category: 'IN_PROGRESS', color: '#3b82f6', order: 1 },
        { name: 'Waiting for Customer', category: 'IN_REVIEW', color: '#f59e0b', order: 2 },
        { name: 'Resolved', category: 'DONE', color: '#10b981', order: 3 },
      ];
    }

    const project = await prisma.project.create({
      data: {
        workspaceId,
        folderId: folderId || null,
        name,
        key: projectKey,
        type: type || 'SOFTWARE_SCRUM',
        description,
        icon: icon || (type === 'SERVICE_DESK' ? 'LifeBuoy' : 'FolderGit2'),
        leadId: req.user.id,
        estimationType: estimationType || 'STORY_POINTS_FIBONACCI',
        statuses: {
          create: defaultStatuses,
        },
        views: {
          create: [
            { name: 'List', type: 'LIST', isDefault: true, configJson: JSON.stringify({ groupBy: 'status' }) },
            { name: 'Kanban Board', type: 'BOARD', isDefault: false, configJson: JSON.stringify({ groupBy: 'status' }) },
            { name: 'Sprint Backlog', type: 'BACKLOG', isDefault: false, configJson: JSON.stringify({}) },
            { name: 'Timeline / Gantt', type: 'GANTT', isDefault: false, configJson: JSON.stringify({}) },
            { name: 'Calendar', type: 'CALENDAR', isDefault: false, configJson: JSON.stringify({}) },
            { name: 'Workload', type: 'WORKLOAD', isDefault: false, configJson: JSON.stringify({}) },
            { name: 'Mind Map', type: 'MINDMAP', isDefault: false, configJson: JSON.stringify({}) },
            { name: 'Spreadsheet', type: 'TABLE', isDefault: false, configJson: JSON.stringify({}) },
          ],
        },
        customFields: {
          create: [
            { name: 'Priority Level', type: 'DROPDOWN', optionsJson: JSON.stringify(['P0 - Blocker', 'P1 - Critical', 'P2 - Major', 'P3 - Minor']) },
            { name: 'Release Version', type: 'TEXT' },
            { name: 'Client / Department', type: 'TEXT' },
          ],
        },
      },
      include: {
        statuses: true,
        views: true,
        customFields: true,
      },
    });

    if (type === 'SERVICE_DESK') {
      await prisma.sLAConfig.create({
        data: {
          projectId: project.id,
          firstResponseMinutes: 60,
          resolutionMinutes: 480,
        },
      });
    }

    return res.status(201).json(project);
  } catch (error: any) {
    console.error('Error creating project:', error);
    return res.status(500).json({ error: 'Failed to create project', details: error.message });
  }
}

export async function updateProject(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, icon, leadId, estimationType } = req.body;

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(icon && { icon }),
        ...(leadId && { leadId }),
        ...(estimationType && { estimationType }),
      },
    });

    return res.json(project);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update project' });
  }
}

export async function deleteProject(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.project.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to delete project' });
  }
}

// Statuses / Workflow
export async function updateStatuses(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params; // projectId
    const { statuses } = req.body; // array of status objects

    if (!Array.isArray(statuses)) {
      return res.status(400).json({ error: 'statuses array is required' });
    }

    for (let i = 0; i < statuses.length; i++) {
      const s = statuses[i];
      if (s.id && !s.id.startsWith('temp-')) {
        await prisma.status.update({
          where: { id: s.id },
          data: {
            name: s.name,
            category: s.category,
            color: s.color,
            order: i,
            wipLimit: s.wipLimit ?? null,
            allowedTransitionIds: s.allowedTransitionIds ? JSON.stringify(s.allowedTransitionIds) : '[]',
          },
        });
      } else {
        await prisma.status.create({
          data: {
            projectId: id,
            name: s.name,
            category: s.category || 'TODO',
            color: s.color || '#3b82f6',
            order: i,
            wipLimit: s.wipLimit ?? null,
          },
        });
      }
    }

    const updated = await prisma.status.findMany({
      where: { projectId: id },
      orderBy: { order: 'asc' },
    });

    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update statuses', details: error.message });
  }
}

// Custom Fields
export async function createCustomField(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params; // projectId
    const { name, type, options, formulaExpression, currencyCode, isRequired } = req.body;

    const field = await prisma.customField.create({
      data: {
        projectId: id,
        name,
        type,
        optionsJson: options ? JSON.stringify(options) : '[]',
        formulaExpression,
        currencyCode: currencyCode || 'USD',
        isRequired: !!isRequired,
      },
    });

    return res.status(201).json(field);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to create custom field' });
  }
}

export async function deleteCustomField(req: AuthRequest, res: Response) {
  try {
    const { fieldId } = req.params;
    await prisma.customField.delete({ where: { id: fieldId } });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to delete custom field' });
  }
}

// Views
export async function saveViewConfig(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params; // projectId
    const { viewId, name, type, config, isDefault } = req.body;

    let view;
    if (viewId) {
      view = await prisma.viewConfig.update({
        where: { id: viewId },
        data: {
          ...(name && { name }),
          ...(type && { type }),
          ...(config && { configJson: JSON.stringify(config) }),
          ...(isDefault !== undefined && { isDefault }),
        },
      });
    } else {
      view = await prisma.viewConfig.create({
        data: {
          projectId: id,
          name: name || 'Custom View',
          type: type || 'LIST',
          configJson: JSON.stringify(config || {}),
          isDefault: !!isDefault,
        },
      });
    }

    return res.json(view);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to save view config' });
  }
}
