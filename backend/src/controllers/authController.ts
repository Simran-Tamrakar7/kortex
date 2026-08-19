import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../db';
import { generateTokens, AuthRequest } from '../middleware/auth';

export async function register(req: Request, res: Response) {
  try {
    const { email, password, name, orgName } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      },
    });

    // Auto-create Organization and default Workspace for the user
    const slug = (orgName || `${name}'s Org`).toLowerCase().replace(/[^a-z0-9]/g, '-');
    const org = await prisma.organization.create({
      data: {
        name: orgName || `${name}'s Org`,
        slug: `${slug}-${Math.floor(1000 + Math.random() * 9000)}`,
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: 'OWNER',
          },
        },
      },
    });

    const workspace = await prisma.workspace.create({
      data: {
        orgId: org.id,
        name: 'General Space',
        slug: 'general-space',
        description: 'Main workspace for company projects and initiatives',
        members: {
          create: {
            userId: user.id,
            role: 'OWNER',
          },
        },
      },
    });

    const tokens = generateTokens(user);

    return res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl },
      organization: org,
      workspaces: [workspace],
      ...tokens,
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Registration failed', details: error.message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const orgMemberships = await prisma.orgMember.findMany({
      where: { userId: user.id },
      include: { org: true },
    });

    const org = orgMemberships[0]?.org || null;
    const workspaces = org
      ? await prisma.workspace.findMany({
          where: { orgId: org.id },
          include: { projects: true },
        })
      : [];

    const tokens = generateTokens(user);

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        timezone: user.timezone,
      },
      organization: org,
      workspaces,
      ...tokens,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed', details: error.message });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        timezone: true,
        workingHoursJson: true,
        notificationPreferencesJson: true,
        createdAt: true,
      },
    });

    const orgMemberships = await prisma.orgMember.findMany({
      where: { userId: req.user.id },
      include: { org: true },
    });

    const org = orgMemberships[0]?.org || null;
    const workspaces = org
      ? await prisma.workspace.findMany({
          where: { orgId: org.id },
          include: {
            folders: {
              include: { projects: true },
            },
            projects: true,
          },
        })
      : [];

    return res.json({
      user,
      organization: org,
      workspaces,
      role: orgMemberships[0]?.role || 'MEMBER',
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch user profile', details: error.message });
  }
}

export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { name, avatarUrl, timezone, workingHours, notificationPreferences } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(timezone && { timezone }),
        ...(workingHours && { workingHoursJson: JSON.stringify(workingHours) }),
        ...(notificationPreferences && {
          notificationPreferencesJson: JSON.stringify(notificationPreferences),
        }),
      },
    });

    return res.json({ user });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update profile', details: error.message });
  }
}

export async function listApiKeys(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const keys = await prisma.apiKey.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(keys);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to list API keys' });
  }
}

export async function createApiKey(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { name } = req.body;
    const key = `kor_${crypto.randomBytes(24).toString('hex')}`;

    const apiKey = await prisma.apiKey.create({
      data: {
        userId: req.user.id,
        name: name || 'Default Token',
        key,
      },
    });

    return res.status(201).json(apiKey);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to create API key' });
  }
}

export async function deleteApiKey(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    await prisma.apiKey.delete({
      where: { id, userId: req.user.id },
    });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to delete API key' });
  }
}
