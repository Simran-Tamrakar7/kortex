import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth';
import * as authCtrl from '../controllers/authController';
import * as orgCtrl from '../controllers/orgController';
import * as workspaceCtrl from '../controllers/workspaceController';
import * as projectCtrl from '../controllers/projectController';
import * as taskCtrl from '../controllers/taskController';
import * as sprintCtrl from '../controllers/sprintController';
import * as commentCtrl from '../controllers/commentController';
import * as attachmentCtrl from '../controllers/attachmentController';
import * as docCtrl from '../controllers/docController';
import * as automationCtrl from '../controllers/automationController';
import * as dashboardCtrl from '../controllers/dashboardController';
import * as timeCtrl from '../controllers/timeController';
import * as searchCtrl from '../controllers/searchController';
import * as integrationCtrl from '../controllers/integrationController';
import * as notificationCtrl from '../controllers/notificationController';

const router = Router();

// Auth (public)
router.post('/auth/register', authCtrl.register);
router.post('/auth/login', authCtrl.login);

// Authenticated routes
router.use(authenticate);

// Profile & Me
router.get('/auth/me', authCtrl.getMe);
router.put('/auth/profile', authCtrl.updateProfile);
router.get('/auth/api-keys', authCtrl.listApiKeys);
router.post('/auth/api-keys', authCtrl.createApiKey);
router.delete('/auth/api-keys/:id', authCtrl.deleteApiKey);

// Organizations
router.get('/orgs/:id', orgCtrl.getOrg);
router.put('/orgs/:id', requireRoles(['OWNER', 'ADMIN']), orgCtrl.updateOrg);
router.post('/orgs/:id/invite', requireRoles(['OWNER', 'ADMIN', 'MEMBER']), orgCtrl.inviteMember);
router.put('/orgs/:id/members/:memberId', requireRoles(['OWNER', 'ADMIN']), orgCtrl.updateMemberRole);
router.delete('/orgs/:id/members/:memberId', requireRoles(['OWNER', 'ADMIN']), orgCtrl.removeMember);

// Workspaces & Folders
router.get('/workspaces/tree', workspaceCtrl.getWorkspaceTree);
router.post('/workspaces', requireRoles(['OWNER', 'ADMIN', 'MEMBER']), workspaceCtrl.createWorkspace);
router.put('/workspaces/:id', requireRoles(['OWNER', 'ADMIN']), workspaceCtrl.updateWorkspace);
router.delete('/workspaces/:id', requireRoles(['OWNER', 'ADMIN']), workspaceCtrl.deleteWorkspace);
router.post('/folders', requireRoles(['OWNER', 'ADMIN', 'MEMBER']), workspaceCtrl.createFolder);
router.put('/folders/:id', requireRoles(['OWNER', 'ADMIN']), workspaceCtrl.updateFolder);
router.delete('/folders/:id', requireRoles(['OWNER', 'ADMIN']), workspaceCtrl.deleteFolder);

// Projects
router.get('/projects/:id', projectCtrl.getProject);
router.post('/projects', requireRoles(['OWNER', 'ADMIN', 'MEMBER']), projectCtrl.createProject);
router.put('/projects/:id', requireRoles(['OWNER', 'ADMIN']), projectCtrl.updateProject);
router.delete('/projects/:id', requireRoles(['OWNER', 'ADMIN']), projectCtrl.deleteProject);
router.put('/projects/:id/statuses', requireRoles(['OWNER', 'ADMIN']), projectCtrl.updateStatuses);
router.post('/projects/:id/custom-fields', requireRoles(['OWNER', 'ADMIN']), projectCtrl.createCustomField);
router.delete('/projects/:id/custom-fields/:fieldId', requireRoles(['OWNER', 'ADMIN']), projectCtrl.deleteCustomField);
router.post('/projects/:id/views', projectCtrl.saveViewConfig);

// Tasks
router.get('/tasks', taskCtrl.getTasks);
router.get('/tasks/:id', taskCtrl.getTask);
router.post('/tasks', requireRoles(['OWNER', 'ADMIN', 'MEMBER', 'GUEST']), taskCtrl.createTask);
router.put('/tasks/:id', requireRoles(['OWNER', 'ADMIN', 'MEMBER', 'GUEST']), taskCtrl.updateTask);
router.delete('/tasks/:id', requireRoles(['OWNER', 'ADMIN', 'MEMBER']), taskCtrl.deleteTask);
router.post('/tasks/bulk', requireRoles(['OWNER', 'ADMIN', 'MEMBER']), taskCtrl.bulkUpdateTasks);
router.post('/tasks/dependencies', requireRoles(['OWNER', 'ADMIN', 'MEMBER']), taskCtrl.addDependency);
router.delete('/tasks/dependencies/:id', requireRoles(['OWNER', 'ADMIN', 'MEMBER']), taskCtrl.removeDependency);

// Sprints
router.get('/sprints', sprintCtrl.getSprints);
router.post('/sprints', requireRoles(['OWNER', 'ADMIN', 'MEMBER']), sprintCtrl.createSprint);
router.put('/sprints/:id/start', requireRoles(['OWNER', 'ADMIN', 'MEMBER']), sprintCtrl.startSprint);
router.put('/sprints/:id/complete', requireRoles(['OWNER', 'ADMIN', 'MEMBER']), sprintCtrl.completeSprint);
router.get('/sprints/:id/report', sprintCtrl.getSprintReport);

// Comments
router.post('/comments', requireRoles(['OWNER', 'ADMIN', 'MEMBER', 'GUEST']), commentCtrl.createComment);
router.put('/comments/:id/react', commentCtrl.toggleReaction);
router.post('/comments/:id/reactions', commentCtrl.toggleReaction);
router.put('/comments/:id/reactions', commentCtrl.toggleReaction);
router.delete('/comments/:id', requireRoles(['OWNER', 'ADMIN', 'MEMBER']), commentCtrl.deleteComment);

// Attachments
router.post('/attachments', attachmentCtrl.uploadMiddleware.single('file'), attachmentCtrl.uploadAttachment);
router.delete('/attachments/:id', requireRoles(['OWNER', 'ADMIN', 'MEMBER']), attachmentCtrl.deleteAttachment);

// Docs
router.get('/docs', docCtrl.getDocs);
router.get('/docs/:id', docCtrl.getDoc);
router.post('/docs', requireRoles(['OWNER', 'ADMIN', 'MEMBER']), docCtrl.createDoc);
router.put('/docs/:id', requireRoles(['OWNER', 'ADMIN', 'MEMBER']), docCtrl.updateDoc);
router.delete('/docs/:id', requireRoles(['OWNER', 'ADMIN']), docCtrl.deleteDoc);

// Automations
router.get('/automations', automationCtrl.getAutomations);
router.post('/automations', requireRoles(['OWNER', 'ADMIN', 'MEMBER']), automationCtrl.createAutomation);
router.put('/automations/:id', requireRoles(['OWNER', 'ADMIN', 'MEMBER']), automationCtrl.updateAutomation);
router.delete('/automations/:id', requireRoles(['OWNER', 'ADMIN']), automationCtrl.deleteAutomation);
router.post('/automations/:id/test', requireRoles(['OWNER', 'ADMIN', 'MEMBER']), automationCtrl.testAutomation);

// Dashboards & Analytics
router.get('/dashboard/analytics', dashboardCtrl.getDashboardData);
router.get('/dashboards/analytics', dashboardCtrl.getDashboardData);
router.get('/dashboards', dashboardCtrl.getCustomDashboards);
router.post('/dashboards', dashboardCtrl.saveDashboard);

// Time Tracking
router.get('/time-entries', timeCtrl.getTimeEntries);
router.post('/time-entries', timeCtrl.logTime);
router.delete('/time-entries/:id', timeCtrl.deleteTimeEntry);

// Search
router.get('/search', searchCtrl.globalSearch);

// Notifications
router.get('/notifications', notificationCtrl.getNotifications);
router.put('/notifications/all/read', notificationCtrl.markAsRead);
router.put('/notifications/:id/read', notificationCtrl.markAsRead);

// Integrations & Webhooks
router.get('/webhooks', integrationCtrl.getWebhooks);
router.post('/webhooks', integrationCtrl.createWebhook);
router.delete('/webhooks/:id', integrationCtrl.deleteWebhook);
router.post('/integrations/github/webhook', integrationCtrl.handleGitHubWebhook);

export default router;
