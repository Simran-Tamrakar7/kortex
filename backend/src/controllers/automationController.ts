import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';
import { processAutomations } from '../services/automationService';

export async function getAutomations(req: AuthRequest, res: Response) {
  try {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ error: 'projectId is required' });

    const rules = await prisma.automationRule.findMany({
      where: { projectId: String(projectId) },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = rules.map((r) => {
      let trigger = { type: 'STATUS_CHANGED', config: {} };
      let conditions: any[] = [];
      let actions: any[] = [];

      try { trigger = JSON.parse(r.triggerJson); } catch (e) {}
      try { conditions = JSON.parse(r.conditionsJson); } catch (e) {}
      try { actions = JSON.parse(r.actionsJson); } catch (e) {}

      return {
        ...r,
        trigger,
        conditions,
        actions,
      };
    });

    return res.json(formatted);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch automation rules' });
  }
}

export async function createAutomation(req: AuthRequest, res: Response) {
  try {
    const { projectId, name, description, trigger, conditions, actions, isEnabled } = req.body;
    if (!projectId || !name || !trigger || !actions) {
      return res.status(400).json({ error: 'projectId, name, trigger, and actions are required' });
    }

    const rule = await prisma.automationRule.create({
      data: {
        projectId,
        name,
        description,
        isEnabled: isEnabled !== undefined ? !!isEnabled : true,
        triggerJson: JSON.stringify(trigger),
        conditionsJson: JSON.stringify(conditions || []),
        actionsJson: JSON.stringify(actions || []),
      },
    });

    return res.status(201).json(rule);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to create automation rule' });
  }
}

export async function updateAutomation(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, trigger, conditions, actions, isEnabled } = req.body;

    const rule = await prisma.automationRule.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isEnabled !== undefined && { isEnabled }),
        ...(trigger && { triggerJson: JSON.stringify(trigger) }),
        ...(conditions && { conditionsJson: JSON.stringify(conditions) }),
        ...(actions && { actionsJson: JSON.stringify(actions) }),
      },
    });

    return res.json(rule);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update automation rule' });
  }
}

export async function deleteAutomation(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.automationRule.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to delete automation rule' });
  }
}

export async function testAutomation(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { taskId } = req.body;

    const rule = await prisma.automationRule.findUnique({ where: { id } });
    if (!rule) return res.status(404).json({ error: 'Rule not found' });

    let trigger = { type: 'TASK_CREATED' };
    try { trigger = JSON.parse(rule.triggerJson); } catch (e) {}

    await processAutomations({
      projectId: rule.projectId,
      taskId,
      triggerType: trigger.type as any,
      userId: req.user?.id,
    });

    return res.json({ success: true, message: 'Automation executed successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to test automation', details: error.message });
  }
}
