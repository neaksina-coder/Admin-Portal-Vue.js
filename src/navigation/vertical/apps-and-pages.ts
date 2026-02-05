const usersNavItem = {
  title: 'Users',
  icon: { icon: 'tabler-users' },
  to: 'apps-user-list',
  action: 'read',
  subject: 'Users',
}

const operationsNavGroup = {
  title: 'Operations',
  icon: { icon: 'tabler-layout-grid' },
  children: [
    {
      title: 'Products & Services',
      to: 'apps-products',
      icon: { icon: 'tabler-box' },
      action: 'read',
      subject: 'Products',
    },
    {
      title: 'Categories',
      to: 'apps-products-categories',
      icon: { icon: 'tabler-tags' },
      action: 'read',
      subject: 'Products',
    },
    {
      title: 'Chat',
      icon: { icon: 'tabler-message-circle-2' },
      to: 'apps-chat',
      action: 'read',
      subject: 'Apps',
    },
    {
      title: 'Email',
      icon: { icon: 'tabler-mail' },
      to: 'apps-email',
      action: 'read',
      subject: 'Apps',
    },
    {
      title: 'Calendar',
      icon: { icon: 'tabler-calendar' },
      to: 'apps-calendar',
      action: 'read',
      subject: 'Apps',
    },
  ],
}

const tenantManagementNavGroup = {
  title: 'Tenant Management',
  icon: { icon: 'tabler-users-group' },
  children: [
    usersNavItem,
    {
      title: 'Businesses',
      icon: { icon: 'tabler-building-store' },
      to: { name: 'pages-misc-coming-soon' },
      action: 'read',
      subject: 'Apps',
    },
    {
      title: 'Plans',
      icon: { icon: 'tabler-package' },
      to: { name: 'pages-misc-coming-soon' },
      action: 'read',
      subject: 'Apps',
    },
    {
      title: 'Subscriptions',
      icon: { icon: 'tabler-calendar-event' },
      to: { name: 'pages-misc-coming-soon' },
      action: 'read',
      subject: 'Apps',
    },
  ],
}

const billingFinanceNavGroup = {
  title: 'Billing & Finance',
  icon: { icon: 'tabler-receipt' },
  children: [
    {
      title: 'Invoices & Billing',
      icon: { icon: 'tabler-receipt-2' },
      children: [
        {
          title: 'Invoice List',
          to: 'apps-invoice-list',
          action: 'read',
          subject: 'Apps',
        },
        {
          title: 'Payment Reports',
          to: { name: 'pages-misc-coming-soon' },
          action: 'read',
          subject: 'Apps',
        },
      ],
    },
    {
      title: 'Promo Codes',
      icon: { icon: 'tabler-ticket' },
      to: { name: 'pages-misc-coming-soon' },
      action: 'read',
      subject: 'Apps',
    },
  ],
}

const salesMarketingNavGroup = {
  title: 'Sales & Marketing',
  icon: { icon: 'tabler-target-arrow' },
  children: [
    {
      title: 'CRM',
      icon: { icon: 'tabler-users' },
      children: [
        {
          title: 'Customers',
          to: { name: 'pages-misc-coming-soon' },
          action: 'read',
          subject: 'Apps',
        },
      ],
    },
    {
      title: 'Sales & POS',
      icon: { icon: 'tabler-cash' },
      to: { name: 'pages-misc-coming-soon' },
      action: 'read',
      subject: 'Apps',
    },
    {
      title: 'Marketing',
      icon: { icon: 'tabler-mail' },
      children: [
        {
          title: 'Campaigns',
          to: { name: 'pages-misc-coming-soon' },
          action: 'read',
          subject: 'Apps',
        },
        {
          title: 'Email Logs',
          to: { name: 'pages-misc-coming-soon' },
          action: 'read',
          subject: 'Apps',
        },
      ],
    },
  ],
}

const analyticsAiNavGroup = {
  title: 'Analytics & AI',
  icon: { icon: 'tabler-chart-line' },
  children: [
    {
      title: 'Reports',
      icon: { icon: 'tabler-chart-bar' },
      children: [
        {
          title: 'Sales',
          to: { name: 'pages-misc-coming-soon' },
          action: 'read',
          subject: 'Apps',
        },
        {
          title: 'Customers',
          to: { name: 'pages-misc-coming-soon' },
          action: 'read',
          subject: 'Apps',
        },
        {
          title: 'Payments',
          to: { name: 'pages-misc-coming-soon' },
          action: 'read',
          subject: 'Apps',
        },
      ],
    },
    {
      title: 'AI Insights',
      icon: { icon: 'tabler-robot' },
      to: { name: 'pages-misc-coming-soon' },
      action: 'read',
      subject: 'Apps',
    },
    {
      title: 'Admin Digest',
      icon: { icon: 'tabler-news' },
      to: { name: 'pages-misc-coming-soon' },
      action: 'read',
      subject: 'Apps',
    },
  ],
}

const administrationNavGroup = {
  title: 'Administration',
  icon: { icon: 'tabler-shield-lock' },
  children: [
    {
      title: 'Audit Logs',
      icon: { icon: 'tabler-clipboard-list' },
      to: { name: 'pages-misc-coming-soon' },
      action: 'read',
      subject: 'Apps',
    },
    {
      title: 'Account Setting',
      icon: { icon: 'tabler-settings' },
      to: {
        name: 'pages-account-settings-tab',
        params: { tab: 'account' },
      },
    },
  ],
}

export default [
  operationsNavGroup,
  tenantManagementNavGroup,
  billingFinanceNavGroup,
  salesMarketingNavGroup,
  analyticsAiNavGroup,
  administrationNavGroup,
]
