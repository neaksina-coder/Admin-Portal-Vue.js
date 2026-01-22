export default [
  {
    title: 'Apps',
    icon: { icon: 'tabler-layout-grid-add' },
    children: [

      {
        title: 'Chat',
        icon: { icon: 'tabler-message-circle' },
        to: 'apps-chat',
      },
      {
        title: 'Calendar',
        to: 'apps-calendar',
        icon: { icon: 'tabler-calendar' },
      },
      {
        title: 'Kanban',
        icon: { icon: 'tabler-layout-kanban' },
        to: 'apps-kanban',
      },
      {
        title: 'Invoice',
        icon: { icon: 'tabler-file-dollar' },
        children: [
          { title: 'List', to: 'apps-invoice-list' },
          { title: 'Preview', to: { name: 'apps-invoice-preview-id', params: { id: '5036' } } },
          { title: 'Edit', to: { name: 'apps-invoice-edit-id', params: { id: '5036' } } },
          { title: 'Add', to: 'apps-invoice-add' },
        ],
      },
      {
        title: 'User',
        icon: { icon: 'tabler-users' },
        action: 'read',
        subject: 'Users',
        children: [
          { title: 'List', to: 'apps-user-list', action: 'read', subject: 'Users' },
          { title: 'View', to: { name: 'apps-user-view-id', params: { id: 21 } }, action: 'read', subject: 'Users' },
        ],
      },
      {
        title: 'Roles & Permissions',
        icon: { icon: 'tabler-settings' },
        action: 'manage',
        subject: 'Roles',
        children: [
          { title: 'Roles', to: 'apps-roles', action: 'manage', subject: 'Roles' },
          { title: 'Permissions', to: 'apps-permissions', action: 'manage', subject: 'Permissions' },
        ],
      },
    ],
  },
]
