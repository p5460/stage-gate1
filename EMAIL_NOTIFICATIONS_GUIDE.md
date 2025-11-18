# Email Notifications System

This document outlines the comprehensive email notification system implemented in the CSIR Stage-Gate Platform.

## Overview

The platform now sends email notifications for various project activities, ensuring team members stay informed about important updates. Users can customize their notification preferences through the settings page.

## Notification Types

### 1. Review Notifications

- **Review Assignments**: When a user is assigned to review a project
- **Review Submissions**: When reviews are submitted for projects you're involved in

### 2. Project Updates

- **Project Updates**: General project changes and modifications
- **Status Changes**: When project status or stage changes
- **Milestone Reminders**: Reminders about upcoming milestones (3 days, 1 day before due)
- **Milestone Completions**: When milestones are marked as completed

### 3. Alerts & Documents

- **Red Flag Alerts**: When red flags are raised on projects (sent to all stakeholders)
- **Document Uploads**: When new documents are uploaded to projects

### 4. Digest & Summary

- **Weekly Digest**: Weekly summary of project activities (planned feature)

## Email Templates

All emails are professionally formatted with:

- Responsive HTML design
- Plain text fallback
- Consistent branding
- Clear call-to-action buttons
- Project context and details

## User Preferences

Users can control their email notifications through `/settings`:

- **Master Toggle**: Enable/disable all email notifications
- **Category-specific**: Control each notification type individually
- **Real-time Updates**: Changes take effect immediately

## Technical Implementation

### Core Files

1. **`lib/email.ts`**: Email service and templates
2. **`lib/notifications.ts`**: Notification logic and recipient management
3. **`actions/notifications.ts`**: User preference management
4. **`components/settings/notification-settings.tsx`**: Settings UI

### Email Service

Uses **Resend** as the email provider:

- Reliable delivery
- Professional templates
- Error handling and logging
- Fallback text versions

### Notification Triggers

Email notifications are triggered from:

- **Project Actions**: Status changes, updates
- **Review Actions**: Assignments, submissions
- **Document Actions**: Uploads, approvals
- **Milestone Actions**: Creation, completion, reminders
- **Red Flag Actions**: Creation, resolution

### Scheduled Notifications

Automated reminders via API routes:

- **Milestone Reminders**: Daily check for upcoming milestones
- **Weekly Digest**: Weekly project summaries (planned)

## Setup Instructions

### 1. Environment Variables

Add to your `.env` file:

```env
# Resend API Key
RESEND_API_KEY=your_resend_api_key

# Email Configuration
EMAIL_FROM=CSIR Stage-Gate Platform <noreply@csir-stagegate.com>

# Scheduled Notifications
CRON_SECRET=your-secure-cron-secret-token
```

### 2. Database Schema

The `NotificationPreference` model is already included in the Prisma schema:

```prisma
model NotificationPreference {
  id                    String  @id @default(cuid())
  userId                String  @unique
  emailNotifications    Boolean @default(true)
  reviewAssignments     Boolean @default(true)
  reviewSubmissions     Boolean @default(true)
  projectUpdates        Boolean @default(true)
  redFlagAlerts         Boolean @default(true)
  documentUploads       Boolean @default(false)
  statusChanges         Boolean @default(true)
  milestoneReminders    Boolean @default(true)
  weeklyDigest          Boolean @default(false)
  // ... other fields
}
```

### 3. Scheduled Jobs

Set up cron jobs or use a service like Vercel Cron to call:

**Daily Milestone Reminders:**

```bash
curl -X POST "https://your-domain.com/api/notifications/scheduled?type=milestone-reminders" \
  -H "Authorization: Bearer your-cron-secret"
```

**Weekly Digest (planned):**

```bash
curl -X POST "https://your-domain.com/api/notifications/scheduled?type=weekly-digest" \
  -H "Authorization: Bearer your-cron-secret"
```

## Notification Recipients

### Automatic Recipients

The system automatically determines recipients based on:

1. **Project Team Members**:
   - Project Lead
   - Project Members
   - Document uploaders (for their own uploads)

2. **Administrative Users**:
   - Admins (for red flags and critical issues)
   - Gatekeepers (for review-related notifications)

3. **Review-specific**:
   - Assigned reviewers
   - Review requesters

### Recipient Filtering

- Users are excluded from notifications they triggered themselves
- Notifications respect user preferences
- Invalid email addresses are filtered out
- Duplicate recipients are removed

## Error Handling

- Email failures don't break core functionality
- Errors are logged for monitoring
- Graceful degradation when email service is unavailable
- Retry logic for transient failures

## Customization

### Adding New Notification Types

1. **Add to Prisma Schema**: Update `NotificationPreference` model
2. **Update Types**: Add to `NotificationPreferenceKey` type
3. **Create Template**: Add email template to `emailTemplates`
4. **Add Notification Function**: Create sender function in `lib/notifications.ts`
5. **Update UI**: Add to notification settings component
6. **Trigger**: Call from appropriate action

### Email Template Customization

Templates are in `lib/email.ts` and include:

- HTML version with inline CSS
- Plain text fallback
- Dynamic content injection
- Responsive design

## Monitoring and Analytics

- Email delivery status logging
- User preference analytics
- Notification frequency tracking
- Error rate monitoring

## Best Practices

1. **Respect User Preferences**: Always check before sending
2. **Batch Operations**: Group related notifications
3. **Rate Limiting**: Avoid spam-like behavior
4. **Clear Unsubscribe**: Provide easy opt-out options
5. **Mobile-Friendly**: Ensure emails work on all devices

## Troubleshooting

### Common Issues

1. **Emails Not Sending**:
   - Check Resend API key
   - Verify environment variables
   - Check email address validity

2. **Users Not Receiving Emails**:
   - Check user notification preferences
   - Verify email address in user profile
   - Check spam folders

3. **Template Issues**:
   - Test with different email clients
   - Validate HTML structure
   - Check plain text fallback

### Debug Mode

Enable detailed logging by setting:

```env
NODE_ENV=development
```

This will log all email attempts and errors to the console.

## Future Enhancements

1. **Weekly Digest Implementation**: Complete the weekly summary feature
2. **Email Analytics**: Track open rates and engagement
3. **Advanced Filtering**: More granular notification controls
4. **Mobile Push**: Extend to mobile push notifications
5. **Slack Integration**: Optional Slack notifications
6. **Email Templates**: More template customization options

## Security Considerations

- API keys are stored securely in environment variables
- Cron endpoints are protected with secret tokens
- User email addresses are validated
- No sensitive data in email content
- Secure email transmission via Resend

## Support

For issues or questions about the email notification system:

1. Check the logs for error messages
2. Verify environment configuration
3. Test with a single user first
4. Monitor Resend dashboard for delivery status
