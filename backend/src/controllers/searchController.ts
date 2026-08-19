import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';

export async function globalSearch(req: AuthRequest, res: Response) {
  try {
    const { q, orgId, workspaceId } = req.query;
    if (!q || String(q).trim() === '') {
      return res.json({ tasks: [], docs: [], projects: [], comments: [] });
    }

    const query = String(q).toLowerCase().trim();

    // 1. Search Tasks
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
          { key: { contains: query } },
        ],
      },
      include: {
        status: true,
        project: { select: { id: true, name: true, key: true } },
        assignees: { include: { user: true } },
      },
      take: 15,
    });

    // 2. Search Docs
    const docs = await prisma.doc.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { content: { contains: query } },
        ],
      },
      include: {
        project: { select: { id: true, name: true } },
      },
      take: 10,
    });

    // 3. Search Projects
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { key: { contains: query } },
          { description: { contains: query } },
        ],
      },
      take: 10,
    });

    // 4. Search Comments
    const comments = await prisma.comment.findMany({
      where: {
        content: { contains: query },
      },
      include: {
        task: { select: { id: true, key: true, title: true, projectId: true } },
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
      take: 10,
    });

    return res.json({
      tasks,
      docs,
      projects,
      comments,
      totalResults: tasks.length + docs.length + projects.length + comments.length,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Global search failed', details: error.message });
  }
}
