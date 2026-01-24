import { title } from "node:process"

const userData = useCookie<any>('userData')
const isSuperuser = userData.value?.role === 'superuser'

const usersNavItem = {
  title: 'Users',
  icon: { icon: 'tabler-users' },
  to: 'apps-user-list',
  action: 'read',
  subject: 'Users',
}


export default [
  // { heading: 'Apps & Pages' },
  // // {
  //   title: 'Email',
  //   icon: { icon: 'tabler-mail' },
  //   to: 'apps-email',
  // },
  // {
  //   title: 'Chat',
  //   icon: { icon: 'tabler-message-circle-2' },
  //   to: 'apps-chat',
  // },
  // {
  //   title: 'Calendar',
  //   icon: { icon: 'tabler-calendar' },
  //   to: 'apps-calendar',
  // },
  // {
  //   title: 'Kanban',
  //   icon: { icon: 'tabler-layout-kanban' },
  //   to: 'apps-kanban',
  // },

  usersNavItem,

{
  title: 'Account Setting',
  icon: { icon: 'tabler-settings' },
  to: {
    name: 'pages-account-settings-tab',
    params: { tab: 'account' },
  },
},




  // {
  //   title: 'Authentication',
  //   icon: { icon: 'tabler-shield-lock' },
  //   children: [
  //     {
  //       title: 'Login',
  //       children: [
  //         { title: 'Login v1', to: 'pages-authentication-login-v1', target: '_blank' },
  //         { title: 'Login v2', to: 'pages-authentication-login-v2', target: 'blank' },
  //       ],
  //     },
  //     {
  //       title: 'Register',
  //       children: [
  //         { title: 'Register v1', to: 'pages-authentication-register-v1', target: '_blank' },
  //         { title: 'Register v2', to: 'pages-authentication-register-v2', target: '_blank' },
  //         { title: 'Register Multi-Steps', to: 'pages-authentication-register-multi-steps', target: '_blank' },
  //       ],
  //     },
  //     {
  //       title: 'Verify Email',
  //       children: [
  //         { title: 'Verify Email v1', to: 'pages-authentication-verify-email-v1', target: '_blank' },
  //         { title: 'Verify Email v2', to: 'pages-authentication-verify-email-v2', target: '_blank' },
  //       ],
  //     },
  //     {
  //       title: 'Forgot Password',
  //       children: [
  //         { title: 'Forgot Password v1', to: 'pages-authentication-forgot-password-v1', target: '_blank' },
  //         { title: 'Forgot Password v2', to: 'pages-authentication-forgot-password-v2', target: '_blank' },
  //       ],
  //     },
  //     {
  //       title: 'Reset Password',
  //       children: [
  //         { title: 'Reset Password v1', to: 'pages-authentication-reset-password-v1', target: '_blank' },
  //         { title: 'Reset Password v2', to: 'pages-authentication-reset-password-v2', target: '_blank' },
  //       ],
  //     },
  //     {
  //       title: 'Two Steps',
  //       children: [
  //         { title: 'Two Steps v1', to: 'pages-authentication-two-steps-v1', target: '_blank' },
  //         { title: 'Two Steps v2', to: 'pages-authentication-two-steps-v2', target: '_blank' },
  //       ],
  //     },
  //   ],
  // },
  // {
  //   title: 'Wizard Examples',
  //   icon: { icon: 'tabler-dots' },
  //   children: [
  //     { title: 'Checkout', to: { name: 'wizard-examples-checkout' } },
  //     { title: 'Property Listing', to: { name: 'wizard-examples-property-listing' } },
  //     { title: 'Create Deal', to: { name: 'wizard-examples-create-deal' } },
  //   ],
  // },
  // {
  //   title: 'Dialog Examples',
  //   icon: { icon: 'tabler-square' },
  //   to: 'pages-dialog-examples',
  // },
]
