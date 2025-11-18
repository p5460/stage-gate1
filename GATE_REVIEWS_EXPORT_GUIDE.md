# Gate Reviews Export Functionality

## Overview

A comprehensive export system has been implemented for gate reviews, allowing authorized users to export review data in multiple formats with advanced filtering capabilities.

## Features

### 🔐 **Access Control**

- **Authorized Roles**: Admin, Gatekeeper, Project Lead
- **Permission Checking**: Automatic role validation
- **Secure API**: Protected endpoints with authentication

### 📊 **Export Formats**

1. **CSV Format**
   - Compatible with Excel and Google Sheets
   - Includes all review data and metadata
   - Easy to filter and analyze

2. **JSON Format**
   - Machine-readable format
   - Preserves data structure
   - Ideal for API integration

3. **Excel Format**
   - Multiple worksheets
   - Includes summary statistics
   - Professional formatting

### 🔍 **Advanced Filtering**

- **Project ID**: Filter by specific project
- **Stage**: Filter by review stage (Stage 0-3)
- **Reviewer**: Filter by specific reviewer
- **Decision**: Filter by review decision (GO, RECYCLE, HOLD, STOP)
- **Date Range**: Filter by review date range
- **Completion Status**: Filter completed vs pending reviews

### 📈 **Preview & Statistics**

- **Real-time Preview**: See export summary before downloading
- **Statistics Dashboard**:
  - Total reviews count
  - Completed vs pending breakdown
  - Completion rate percentage
  - Decision distribution

## Exported Data Fields

### Core Review Data

- Review ID and timestamps
- Project information (ID, name, cluster)
- Review stage and decision
- Reviewer details (name, email, role, department)
- Scores and comments
- Completion status

### Related Project Data

- Project lead information
- Current project status
- Project cluster details
- Review dates and history

## How to Use

### 1. **Access the Export Page**

```
Navigate to: /reviews/export
Or click "Export Reviews" button on the main reviews page
```

### 2. **Select Export Format**

- Choose from CSV, JSON, or Excel
- Each format has specific advantages for different use cases

### 3. **Apply Filters (Optional)**

- Set any combination of filters to narrow down the data
- Leave filters empty to export all reviews

### 4. **Preview Results**

- Click "Load Preview" to see export statistics
- Verify the number of reviews that will be exported

### 5. **Export Data**

- Click "Export [FORMAT]" to download the file
- File will be automatically downloaded to your device

## API Endpoints

### GET `/api/gate-reviews/export`

Export gate reviews with query parameters:

**Query Parameters:**

- `format`: Export format (csv, json, excel)
- `projectId`: Filter by project ID
- `stage`: Filter by stage (STAGE_0, STAGE_1, STAGE_2, STAGE_3)
- `reviewerId`: Filter by reviewer ID
- `decision`: Filter by decision (GO, RECYCLE, HOLD, STOP)
- `dateFrom`: Filter from date (YYYY-MM-DD)
- `dateTo`: Filter to date (YYYY-MM-DD)
- `isCompleted`: Filter by completion status (true/false)
- `preview`: Return preview data only (true/false)

**Example:**

```bash
GET /api/gate-reviews/export?format=csv&stage=STAGE_1&decision=GO&preview=true
```

### POST `/api/gate-reviews/export`

Export with complex filters in request body:

**Request Body:**

```json
{
  "format": "csv",
  "filters": {
    "projectId": "PROJ-001",
    "stage": "STAGE_1",
    "decision": "GO",
    "dateFrom": "2024-01-01",
    "dateTo": "2024-12-31",
    "isCompleted": true
  }
}
```

## File Formats Details

### CSV Format

```csv
Review ID,Project ID,Project Name,Cluster,Project Lead,Project Status,Current Stage,Review Stage,Reviewer Name,Reviewer Email,Reviewer Role,Reviewer Department,Decision,Score,Comments,Review Date,Is Completed,Created At,Updated At
```

### JSON Format

```json
[
  {
    "id": "review-id",
    "projectId": "project-id",
    "stage": "STAGE_1",
    "reviewerId": "reviewer-id",
    "decision": "GO",
    "score": 8.5,
    "comments": "Review comments",
    "reviewDate": "2024-01-15T10:00:00Z",
    "isCompleted": true,
    "project": {
      "projectId": "PROJ-001",
      "name": "Project Name",
      "status": "ACTIVE",
      "cluster": { "name": "Research Cluster" },
      "lead": { "name": "John Doe", "email": "john@example.com" }
    },
    "reviewer": {
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "GATEKEEPER",
      "department": "Research"
    }
  }
]
```

### Excel Format

- **Worksheet 1**: Gate Reviews (all review data)
- **Worksheet 2**: Summary (export statistics and filters applied)

## Security & Permissions

### Role-Based Access

- **Admin**: Can export all reviews
- **Gatekeeper**: Can export all reviews
- **Project Lead**: Can export all reviews
- **Other Roles**: Access denied

### Data Protection

- No sensitive personal information exposed
- Secure API endpoints with authentication
- Audit trail of export activities

## Performance Considerations

### Large Datasets

- Efficient database queries with proper indexing
- Streaming for large exports
- Pagination support for preview

### Rate Limiting

- API endpoints protected against abuse
- Reasonable export size limits
- Error handling for timeouts

## Troubleshooting

### Common Issues

**1. Access Denied**

- Verify user has appropriate role (Admin, Gatekeeper, or Project Lead)
- Check authentication status

**2. No Data in Export**

- Verify filters are not too restrictive
- Check if reviews exist for the specified criteria
- Use preview to verify data availability

**3. Export Fails**

- Check browser console for error messages
- Verify network connectivity
- Try with smaller date ranges or fewer filters

**4. File Won't Download**

- Check browser download settings
- Verify popup blockers aren't interfering
- Try different export format

### Error Messages

- **"Unauthorized"**: User doesn't have permission to export
- **"No reviews found"**: No data matches the specified filters
- **"Export failed"**: Server error during export generation

## Integration Examples

### JavaScript/TypeScript

```typescript
// Export reviews with filters
const exportReviews = async (filters: any, format: string) => {
  const response = await fetch("/api/gate-reviews/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ format, filters }),
  });

  if (response.ok) {
    const blob = await response.blob();
    // Handle file download
  }
};
```

### cURL

```bash
# Export all reviews as CSV
curl -X GET "/api/gate-reviews/export?format=csv" \
  -H "Authorization: Bearer your-token"

# Export with filters
curl -X POST "/api/gate-reviews/export" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"format":"json","filters":{"stage":"STAGE_1"}}'
```

## Future Enhancements

### Planned Features

1. **Scheduled Exports**: Automatic periodic exports
2. **Email Delivery**: Send exports via email
3. **Custom Templates**: User-defined export formats
4. **Advanced Analytics**: Statistical analysis in exports
5. **Bulk Operations**: Export multiple projects at once

### Performance Improvements

1. **Caching**: Cache frequently requested exports
2. **Background Processing**: Async export for large datasets
3. **Compression**: Compress large export files
4. **CDN Integration**: Faster file delivery

## Support

For issues or questions about the gate reviews export functionality:

1. Check this documentation first
2. Verify user permissions and authentication
3. Test with smaller datasets
4. Check browser console for error messages
5. Contact system administrator if issues persist

The gate reviews export system provides comprehensive data export capabilities with robust filtering, multiple format support, and enterprise-grade security.
