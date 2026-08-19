import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';
import { socketManager } from '../sockets/socketManager';
import { SOCKET_EVENTS } from '@kortex/shared';

export async function getDocs(req: AuthRequest, res: Response) {
  try {
    const { workspaceId, projectId } = req.query;
    if (!workspaceId) return res.status(400).json({ error: 'workspaceId is required' });

    const where: any = { workspaceId: String(workspaceId) };
    if (projectId) where.projectId = String(projectId);

    const docs = await prisma.doc.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return res.json(docs);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch docs' });
  }
}

export async function getDoc(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const doc = await prisma.doc.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        project: true,
      },
    });

    if (!doc) return res.status(404).json({ error: 'Doc not found' });
    return res.json(doc);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch doc' });
  }
}

export async function createDoc(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { workspaceId, projectId, title, content, icon, coverUrl } = req.body;

    if (!workspaceId || !title) {
      return res.status(400).json({ error: 'workspaceId and title are required' });
    }

    const doc = await prisma.doc.create({
      data: {
        workspaceId,
        projectId: projectId || null,
        title,
        content: content || '# ' + title + '\n\nStart typing here...',
        icon: icon || 'FileText',
        coverUrl,
        authorId: req.user.id,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    socketManager.broadcastToWorkspace(workspaceId, SOCKET_EVENTS.DOC_UPDATED, doc);
    return res.status(201).json(doc);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to create doc' });
  }
}

export async function updateDoc(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { title, content, icon, coverUrl, isPublished } = req.body;

    const doc = await prisma.doc.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content !== undefined && { content }),
        ...(icon && { icon }),
        ...(coverUrl !== undefined && { coverUrl }),
        ...(isPublished !== undefined && { isPublished }),
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    socketManager.broadcastToWorkspace(doc.workspaceId, SOCKET_EVENTS.DOC_UPDATED, doc);
    return res.json(doc);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update doc' });
  }
}

export async function deleteDoc(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.doc.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to delete doc' });
  }
}
