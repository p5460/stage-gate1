# Comment System

A comprehensive comment system with nested replies, editing, deletion, and export functionality.

## Features

- ✅ Create comments and replies
- ✅ Edit and delete comments (with permissions)
- ✅ Nested comment threads
- ✅ Export comments as JSON or CSV
- ✅ Real-time updates with revalidation
- ✅ Activity logging for project comments
- ✅ Role-based permissions

## Components

### CommentSection

Full-featured comment section with all functionality.

```tsx
import { CommentSection } from "@/components/comments";

<CommentSection
  projectId="project-123"
  title="Project Discussion"
  showExport={true}
/>;
```

### CommentForm

Simple form for adding comments or replies.

```tsx
import { CommentForm } from "@/components/comments";

<CommentForm
  projectId="project-123"
  placeholder="Add your comment..."
  onSuccess={() => console.log("Comment added!")}
/>;
```

### CommentList

Display-only comment list with optional editing.

```tsx
import { CommentList } from "@/components/comments";

<CommentList
  projectId="project-123"
  maxComments={5}
  showReplies={true}
  onReply={(commentId) => handleReply(commentId)}
  onEdit={(commentId, content) => handleEdit(commentId, content)}
/>;
```

## Server Actions

### createComment

```tsx
const result = await createComment(content, projectId?, parentId?);
```

### updateComment

```tsx
const result = await updateComment(commentId, newContent);
```

### deleteComment

```tsx
const result = await deleteComment(commentId);
```

### getComments

```tsx
const result = await getComments(projectId?, parentId?);
```

### exportComments

```tsx
const result = await exportComments(projectId, "json" | "csv");
```

## API Routes

### Export Comments

```
GET /api/comments/export?projectId=123&format=json
POST /api/comments/export { projectId: "123", format: "csv" }
```

## Database Schema

The Comment model includes:

- `id`: Unique identifier
- `content`: Comment text
- `authorId`: User who created the comment
- `projectId`: Associated project (optional)
- `parentId`: Parent comment for replies (optional)
- `createdAt` / `updatedAt`: Timestamps

## Permissions

- **Create**: Any authenticated user
- **Edit**: Comment author only
- **Delete**: Comment author or admin
- **Export**: Any authenticated user (for project comments)

## Usage Examples

### Basic Project Comments

```tsx
// In your project page
<CommentSection projectId={project.id} />
```

### Quick Comment Form

```tsx
// Add a simple comment form
<CommentForm
  projectId={project.id}
  onSuccess={() => {
    toast.success("Comment added!");
    router.refresh();
  }}
/>
```

### Recent Comments Widget

```tsx
// Show last 3 comments
<CommentList projectId={project.id} maxComments={3} showReplies={false} />
```

## Migration

To add the comment system to your existing project:

1. Update your Prisma schema with the Comment model
2. Run `npx prisma generate` and `npx prisma db push`
3. Import and use the components where needed
4. The system will automatically handle activity logging for project comments
