import { Router } from 'express';
import { authenticate } from '../middleware/auth';
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
router.put('/orgs/:id', orgCtrl.updateOrg);
router.post('/orgs/:id/invite', orgCtrl.inviteMember);
router.put('/orgs/:id/members/:memberId', orgCtrl.updateMemberRole);
router.delete('/orgs/:id/members/:memberId', orgCtrl.removeMember);

// Workspaces & Folders
router.get('/workspaces/tree', workspaceCtrl.getWorkspaceTree);
router.post('/workspaces', workspaceCtrl.createWorkspace);
router.put('/workspaces/:id', workspaceCtrl.updateWorkspace);
router.delete('/workspaces/:id', workspaceCtrl.deleteWorkspace);
router.post('/folders', workspaceCtrl.createFolder);
router.put('/folders/:id', workspaceCtrl.updateFolder);
router.delete('/folders/:id', workspaceCtrl.deleteFolder);

// Projects
router.get('/projects/:id', projectCtrl.getProject);
router.post('/projects', projectCtrl.createProject);
router.put('/projects/:id', projectCtrl.updateProject);
router.delete('/projects/:id', projectCtrl.deleteProject);
router.put('/projects/:id/statuses', projectCtrl.updateStatuses);
router.post('/projects/:id/custom-fields', projectCtrl.createCustomField);
router.delete('/projects/:id/custom-fields/:fieldId', projectCtrl.deleteCustomField);
router.post('/projects/:id/views', projectCtrl.saveViewConfig);

// Tasks
router.get('/tasks', taskCtrl.getTasks);
router.get('/tasks/:id', taskCtrl.getTask);
router.post('/tasks', taskCtrl.createTask);
router.put('/tasks/:id', taskCtrl.updateTask);
router.delete('/tasks/:id', taskCtrl.deleteTask);
router.post('/tasks/bulk', taskCtrl.bulkUpdateTasks);
router.post('/tasks/dependencies', taskCtrl.addDependency);
router.delete('/tasks/dependencies/:id', taskCtrl.removeDependency);

// Sprints
router.get('/sprints', sprintCtrl.getSprints);
router.post('/sprints', sprintCtrl.createSprint);
router.put('/sprints/:id/start', sprintCtrl.startSprint);
router.put('/sprints/:id/complete', sprintCtrl.completeSprint);
router.get('/sprints/:id/report', sprintCtrl.getSprintReport);

// Comments
router.post('/comments', commentCtrl.createComment);
router.put('/comments/:id/react', commentCtrl.toggleReaction);
router.post('/comments/:id/reactions', commentCtrl.toggleReaction);
router.put('/comments/:id/reactions', commentCtrl.toggleReaction);
router.delete('/comments/:id', commentCtrl.deleteComment);

// Attachments
router.post('/attachments', attachmentCtrl.uploadMiddleware.single('file'), attachmentCtrl.uploadAttachment);
router.delete('/attachments/:id', attachmentCtrl.deleteAttachment);

// Docs
router.get('/docs', docCtrl.getDocs);
router.get('/docs/:id', docCtrl.getDoc);
router.post('/docs', docCtrl.createDoc);
router.put('/docs/:id', docCtrl.updateDoc);
router.delete('/docs/:id', docCtrl.deleteDoc);

// Automations
router.get('/automations', automationCtrl.getAutomations);
router.post('/automations', automationCtrl.createAutomation);
router.put('/automations/:id', automationCtrl.updateAutomation);
router.delete('/automations/:id', automationCtrl.deleteAutomation);
router.post('/automations/:id/test', automationCtrl.testAutomation);

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
