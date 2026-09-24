import type { DocumentBlock } from '../types/document';

export const DEMO_POLICY_TITLE = 'Acme Service Terms — Demo Policy';

export const demoPolicyBlocks: DocumentBlock[] = [
  {
    id: 'demo-data-sharing',
    heading: 'Data Sharing',
    order: 0,
    text: 'We may share information about you with our advertising and analytics partners to improve our services and show relevant content.',
  },
  {
    id: 'demo-renewal',
    heading: 'Subscription and Automatic Renewal',
    order: 1,
    text: 'Your paid subscription will automatically renew for another monthly term unless you cancel at least 48 hours before the renewal date.',
  },
  {
    id: 'demo-cancellation',
    heading: 'Cancellation',
    order: 2,
    text: 'You may cancel from account settings before your next billing date. Payments already made are non-refundable except where required by law.',
  },
  {
    id: 'demo-termination',
    heading: 'Account Termination',
    order: 3,
    text: 'We may suspend or terminate your account if you materially breach these terms or misuse the service.',
  },
  {
    id: 'demo-license',
    heading: 'Your Content',
    order: 4,
    text: 'You grant us a worldwide, non-exclusive, royalty-free license to host and display content you submit only for operating and improving the service.',
  },
];

export const demoOldPolicyBlocks: DocumentBlock[] = demoPolicyBlocks.map((block) => ({
  ...block,
  id: `old-${block.id}`,
  text: block.id === 'demo-renewal' ? block.text.replace('48 hours', '24 hours')
    : block.id === 'demo-data-sharing' ? 'We may share information about you with analytics partners only to operate the service.'
      : block.id === 'demo-license' ? block.text.replace('operating and improving', 'operating') : block.text,
}));
