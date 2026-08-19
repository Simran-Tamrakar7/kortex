import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';
import { Role } from '@kortex/shared';

export async function getWorkspaceTree(req: AuthRequest, res: Response) {
  try {
    const { orgId } = req.query;
    if (!orgId) return res.status(400).json({ error: 'orgId is required' });

    const workspaces = await prisma.workspace.findMany({
      where: { orgId: String(orgId) },
      include: {
        folders: {
          include: {
            projects: {
              include: {
                statuses: { orderBy: { order: 'asc' } },
                views: true,
                _count: { select: { tasks: true } },
              },
            },
          },
        },
        projects: {
          where: { folderId: null },
          include: {
            statuses: { orderBy: { order: 'asc' } },
            views: true,
            _count: { select: { tasks: true } },
          },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.json(workspaces);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch workspaces', details: error.message });
  }
}

export async function createWorkspace(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { orgId, name, description, icon, color } = req.body;
    if (!orgId || !name) return res.status(400).json({ error: 'orgId and name are required' });

    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const workspace = await prisma.workspace.create({
      data: {
        orgId,
        name,
        slug: `${slug}-${Math.floor(100 + Math.random() * 900)}`,
        description,
        icon: icon || 'Layers',
        color: color || '#6366f1',
        members: {
          create: {
            userId: req.user.id,
            role: 'OWNER',
          },
        },
      },
    });

    return res.status(201).json(workspace);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to create workspace', details: error.message });
  }
}

export async function updateWorkspace(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, icon, color } = req.body;

    const workspace = await prisma.workspace.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(icon && { icon }),
        ...(color && { color }),
      },
    });

    return res.json(workspace);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update workspace' });
  }
}

export async function deleteWorkspace(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.workspace.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to delete workspace' });
  }
}

// Folders
export async function createFolder(req: AuthRequest, res: Response) {
  try {
    const { workspaceId, name, color, icon } = req.body;
    if (!workspaceId || !name) return res.status(400).json({ error: 'workspaceId and name are required' });

    const folder = await prisma.folder.create({
      data: {
        workspaceId,
        name,
        color: color || '#8b5cf6',
        icon: icon || 'Folder',
      },
    });

    return res.status(201).json(folder);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to create folder' });
  }
}

export async function updateFolder(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, color, icon } = req.body;

    const folder = await prisma.folder.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(color && { color }),
        ...(icon && { icon }),
      },
    });

    return res.json(folder);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update folder' });
  }
}

export async function deleteFolder(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.folder.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to delete folder' });
  }
}
