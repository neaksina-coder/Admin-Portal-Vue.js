export default [
  {
    title: 'Dashboard',
    to: 'dashboards-crm',
    icon: { icon: 'tabler-cube' },
  },
  // {
  //   title: 'Front Pages',
  //   icon: { icon: 'tabler-files' },
  //   children: [
  //     {
  //       title: 'Landing',
  //       to: 'front-pages-landing-page',
  //       target: '_blank',
  //     },
  //     {
  //       title: 'Pricing',
  //       to: 'front-pages-pricing',
  //       target: '_blank',
  //     },
  //     {
  //       title: 'Payment',
  //       to: 'front-pages-payment',
  //       target: '_blank',
  //     },
  //     {
  //       title: 'Checkout',
  //       to: 'front-pages-checkout',
  //       target: '_blank',
  //     },
  //     {
  //       title: 'Help Center',
  //       to: 'front-pages-help-center',
  //       target: '_blank',
  //     },
  //   ],
  // },
  {
    title: 'Invoice',
    to: 'apps-invoice-list', // single link
    icon: { icon: 'tabler-file-dollar' },
    action: 'read',
    subject: 'Apps',
  },
  {
    title: 'Products & Services',
    to: 'apps-products', // single link
    icon: { icon: 'tabler-box' },
    action: 'read',
    subject: 'Products',
  },
  {
    title: ' Categories',
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
  },
]
