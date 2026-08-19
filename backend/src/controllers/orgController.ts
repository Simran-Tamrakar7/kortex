import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';
import { Role } from '@kortex/shared';

export async function getOrg(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true, timezone: true },
            },
          },
        },
        workspaces: {
          include: {
            projects: true,
          },
        },
      },
    });

    if (!org) return res.status(404).json({ error: 'Organization not found' });
    return res.json(org);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch organization', details: error.message });
  }
}

export async function updateOrg(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, plan, logoUrl } = req.body;

    const org = await prisma.organization.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(plan && { plan }),
        ...(logoUrl !== undefined && { logoUrl }),
      },
    });

    return res.json(org);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update organization' });
  }
}

export async function inviteMember(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params; // orgId
    const { email, role } = req.body;

    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Check if user exists
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Create user placeholder so they can login or accept invite
      user = await prisma.user.create({
        data: {
          email,
          passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456', // temp placeholder
          name: email.split('@')[0],
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
        },
      });
    }

    const membership = await prisma.orgMember.upsert({
      where: {
        orgId_userId: { orgId: id, userId: user.id },
      },
      update: {
        role: (role as Role) || 'MEMBER',
        inviteStatus: 'ACCEPTED',
      },
      create: {
        orgId: id,
        userId: user.id,
        role: (role as Role) || 'MEMBER',
        invitedEmail: email,
        inviteStatus: 'ACCEPTED',
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    return res.status(201).json(membership);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to invite member', details: error.message });
  }
}

export async function updateMemberRole(req: AuthRequest, res: Response) {
  try {
    const { id, memberId } = req.params;
    const { role } = req.body;

    const member = await prisma.orgMember.update({
      where: { id: memberId },
      data: { role: role as Role },
      include: { user: true },
    });

    return res.json(member);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update member role' });
  }
}

export async function removeMember(req: AuthRequest, res: Response) {
  try {
    const { memberId } = req.params;
    await prisma.orgMember.delete({ where: { id: memberId } });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to remove member' });
  }
}
