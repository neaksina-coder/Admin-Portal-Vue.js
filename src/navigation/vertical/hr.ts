import type { VerticalNavItems } from '@layouts/types'

const hrNav = [
  {
    title: 'HR',
    icon: { icon: 'tabler-id-badge-2' },
    children: [
      {
        title: 'Dashboard',
        icon: { icon: 'tabler-layout-dashboard' },
        to: { name: 'hr-dashboard' },
        action: 'read',
        subject: 'Apps',
      },
      {
        title: 'Employees',
        icon: { icon: 'tabler-users' },
        to: { name: 'hr-employees' },
        action: 'read',
        subject: 'Apps',
      },
      {
        title: 'Leaves',
        icon: { icon: 'tabler-calendar-time' },
        to: { name: 'hr-leaves' },
        action: 'read',
        subject: 'Apps',
      },
      {
        title: 'Attendance',
        icon: { icon: 'tabler-clock' },
        to: { name: 'hr-attendance' },
        action: 'read',
        subject: 'Apps',
      },
      {
        title: 'Payroll',
        icon: { icon: 'tabler-cash' },
        to: { name: 'hr-payroll' },
        action: 'read',
        subject: 'Apps',
      },
    ],
  },
  {
    title: 'Account',
    icon: { icon: 'tabler-user-circle' },
    children: [
      {
        title: 'Account Setting',
        icon: { icon: 'tabler-settings' },
        to: {
          name: 'pages-account-settings-tab',
          params: { tab: 'account' },
        },
      },
    ],
  },
] as VerticalNavItems

export default hrNav
