import { create } from 'zustand';
import { 
  mockUsers, 
  mockLocations, 
  mockAssets, 
  mockWorkOrders, 
  mockRequests,
  mockCategories,
  mockInventory, 
  mockPMSchedules, 
  mockDashboardKPI,
  mockChartData, 
  mockActivities, 
  mockNotifications 
} from '../data/mockData.js';

const useStore = create((set, get) => ({
  // Data
  users: mockUsers,
  locations: mockLocations,
  assets: mockAssets,
  workOrders: mockWorkOrders,
  requests: mockRequests,
  categories: mockCategories,
  inventory: mockInventory,
  pmSchedules: mockPMSchedules,
  dashboardKPI: mockDashboardKPI,
  chartData: mockChartData,
  activities: mockActivities,
  notifications: mockNotifications,

  // UI State
  sidebarOpen: true,
  darkMode: false,
  currentUser: null,

  // Actions
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  setCurrentUser: (user) => set({ currentUser: user }),

  // Work Order Actions
  addWorkOrder: (workOrder) => {
    const created = { ...workOrder, id: `WO-${Date.now()}` };
    set((state) => ({ workOrders: [...state.workOrders, created] }));
    return created;
  },

  // Category Actions
  addCategory: (category) => {
    const next = {
      id: `CAT-${Date.now()}`,
      name: category?.name || 'Category',
      createdBy: category?.createdBy || 'System',
      createdAt: category?.createdAt || new Date().toISOString(),
    };
    set((state) => ({ categories: [...state.categories, next] }));
    return next;
  },

  updateCategory: (id, updates) => set((state) => ({
    categories: state.categories.map((c) => (c.id === id ? { ...c, ...updates } : c))
  })),

  deleteCategory: (id) => set((state) => ({
    categories: state.categories.filter((c) => c.id !== id)
  })),

  // Request Actions
  addRequest: (request) => {
    const created = {
      ...request,
      id: `RQ-${Date.now()}`,
      status: request?.status || 'open',
      priority: request?.priority || 'low',
      createdAt: request?.createdAt || new Date().toISOString(),
    };
    set((state) => ({ requests: [...state.requests, created] }));
    return created;
  },

  updateRequest: (id, updates) => set((state) => ({
    requests: state.requests.map((r) => (r.id === id ? { ...r, ...updates } : r))
  })),

  deleteRequest: (id) => set((state) => ({
    requests: state.requests.filter((r) => r.id !== id)
  })),

  convertRequestToWorkOrder: (requestId, overrides = {}) => {
    const { requests, addWorkOrder } = get();
    const req = requests.find((r) => r.id === requestId);
    if (!req) return null;

    const created = addWorkOrder({
      title: req.title || 'Request',
      description: req.description || '',
      assetId: req.assetId || '',
      locationId: req.locationId || '',
      priority: req.priority || 'low',
      status: 'open',
      assigneeId: req.assigneeId || '',
      createdBy: req.createdBy || 'system',
      createdAt: new Date().toISOString(),
      attachments: req.attachments || [],
      sourceRequestId: req.id,
      ...overrides,
    });

    set((state) => ({
      requests: state.requests.map((r) => (r.id === requestId ? { ...r, status: 'converted', convertedWorkOrderId: created.id } : r))
    }));

    return created;
  },

  // Entity creation helpers (used by forms when datasets start empty)
  addUser: (user) => {
    const next = {
      id: `U-${Date.now()}`,
      name: user?.name || 'User',
      email: user?.email || '',
      role: user?.role || 'viewer',
      status: user?.status || 'active',
    };
    set((state) => ({ users: [...state.users, next] }));
    return next;
  },

  addLocation: (location) => {
    const next = {
      id: `L-${Date.now()}`,
      name: location?.name || 'Location',
      type: location?.type || 'site',
      parentId: location?.parentId,
      address: location?.address,
    };
    set((state) => ({ locations: [...state.locations, next] }));
    return next;
  },

  addAsset: (asset) => {
    const next = {
      id: `A-${Date.now()}`,
      name: asset?.name || 'Asset',
      category: asset?.category || 'Uncategorized',
      locationId: asset?.locationId || '',
      status: asset?.status || 'running',
      description: asset?.description,
      criticality: asset?.criticality,
      year: asset?.year,
      serialNumber: asset?.serialNumber,
      model: asset?.model,
      manufacturer: asset?.manufacturer,
      teamsInCharge: asset?.teamsInCharge,
      barcode: asset?.barcode,
      assetType: asset?.assetType,
      vendor: asset?.vendor,
      parts: asset?.parts,
      parentAssetId: asset?.parentAssetId,
      pictures: asset?.pictures,
      files: asset?.files,
      installDate: asset?.installDate,
      warrantyExpiry: asset?.warrantyExpiry,
      lastMaintenanceDate: asset?.lastMaintenanceDate,
      nextMaintenanceDate: asset?.nextMaintenanceDate,
    };
    set((state) => ({ assets: [...state.assets, next] }));
    return next;
  },

  updateWorkOrder: (id, updates) => set((state) => ({
    workOrders: state.workOrders.map(wo => 
      wo.id === id ? { ...wo, ...updates } : wo
    )
  })),

  deleteWorkOrder: (id) => set((state) => ({
    workOrders: state.workOrders.filter(wo => wo.id !== id)
  })),

  // Asset Actions
  updateAssetStatus: (id, status) => set((state) => ({
    assets: state.assets.map(asset => 
      asset.id === id ? { ...asset, status } : asset
    )
  })),

  // Inventory Actions
  updateInventoryStock: (id, quantity) => set((state) => ({
    inventory: state.inventory.map(item => 
      item.id === id ? { ...item, currentStock: quantity } : item
    )
  })),

  // Notification Actions
  markNotificationAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    )
  })),

  markAllNotificationsAsRead: () => set((state) => ({
    notifications: state.notifications.map(notif => ({ ...notif, read: true }))
  })),

  // PM Schedule Actions
  addPMSchedule: (schedule) => set((state) => ({
    pmSchedules: [...state.pmSchedules, { ...schedule, id: `PM-${Date.now()}` }]
  })),

  updatePMSchedule: (id, updates) => set((state) => ({
    pmSchedules: state.pmSchedules.map(pm => 
      pm.id === id ? { ...pm, ...updates } : pm
    )
  })),

  // Activity Actions
  addActivity: (activity) => set((state) => ({
    activities: [activity, ...state.activities]
  })),

  // Getters
  getWorkOrdersByStatus: (status) => {
    const { workOrders } = get();
    return workOrders.filter(wo => wo.status === status);
  },

  getAssetsByStatus: (status) => {
    const { assets } = get();
    return assets.filter(asset => asset.status === status);
  },

  getLowStockItems: () => {
    const { inventory } = get();
    return inventory.filter(item => item.currentStock <= item.minStockLevel);
  },

  getOverdueWorkOrders: () => {
    const { workOrders } = get();
    const now = new Date();
    return workOrders.filter(wo => 
      wo.dueDate && new Date(wo.dueDate) < now && wo.status !== 'completed'
    );
  },

  getUpcomingPM: () => {
    const { pmSchedules } = get();
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return pmSchedules
      .filter(pm => pm.isActive && new Date(pm.nextDue) <= thirtyDaysFromNow)
      .sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue));
  },

  getUnreadNotifications: () => {
    const { notifications } = get();
    return notifications.filter(notif => !notif.read);
  }
}));

export default useStore;
