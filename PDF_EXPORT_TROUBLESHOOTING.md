# PDF Export Troubleshooting Guide

## Issue: Cannot open exported PDF

The PDF export functionality uses Puppeteer to generate PDFs from HTML content. Here are the most common issues and solutions:

## Quick Test

1. Visit `/api/test-pdf` in your browser to test basic PDF generation
2. Check the browser console and server logs for error messages

## Common Issues & Solutions

### 1. Puppeteer Not Installed or Chromium Missing

**Symptoms:**

- Error: "Could not find Chromium"
- PDF export returns HTML instead of PDF

**Solution:**

```bash
# Reinstall puppeteer to download Chromium
npm uninstall puppeteer
npm install puppeteer

# Or force Chromium download
npx puppeteer browsers install chrome
```

### 2. Permission Issues (Linux/Docker)

**Symptoms:**

- Error: "Failed to launch the browser process"
- Permission denied errors

**Solution:**
Add these args to Puppeteer launch (already implemented):

```javascript
args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"];
```

### 3. Memory Issues

**Symptoms:**

- Browser crashes during PDF generation
- Out of memory errors

**Solution:**

- Increase available memory
- Use `--single-process` flag (already implemented)

### 4. Network/Firewall Issues

**Symptoms:**

- Timeout errors
- Cannot download Chromium

**Solution:**

- Check firewall settings
- Use corporate proxy if needed
- Set `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` and install Chrome manually

## Fallback Options

If PDF generation continues to fail, the system will:

1. **HTML Fallback**: Export as HTML file that can be printed to PDF in browser
2. **Text Fallback**: Export as structured text file

## Manual PDF Creation

If automatic PDF generation fails:

1. Export as HTML format
2. Open the HTML file in your browser
3. Use browser's "Print to PDF" function
4. Save as PDF

## Environment Variables

You can set these environment variables to configure Puppeteer:

```bash
# Skip Chromium download (use system Chrome)
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Use custom Chrome executable
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome

# Set custom cache directory
PUPPETEER_CACHE_DIR=/tmp/puppeteer
```

## Debugging Steps

1. Check server logs for detailed error messages
2. Test with `/api/test-pdf` endpoint
3. Verify Puppeteer installation: `npm list puppeteer`
4. Check available memory and disk space
5. Test in different environment (local vs production)

## Alternative PDF Libraries

If Puppeteer continues to cause issues, consider these alternatives:

1. **jsPDF** - Client-side PDF generation (limited styling)
2. **PDFKit** - Server-side PDF generation (programmatic)
3. **html-pdf** - HTML to PDF conversion (deprecated but stable)
4. **Playwright** - Similar to Puppeteer with better reliability

## Current Implementation Status

- ✅ Puppeteer installed and configured
- ✅ Fallback to HTML format implemented
- ✅ Enhanced error logging added
- ✅ Browser launch arguments optimized
- ✅ Test endpoint created (`/api/test-pdf`)

## Next Steps

1. Test the `/api/test-pdf` endpoint
2. Check server logs for specific error messages
3. Try the HTML fallback option
4. Consider alternative PDF libraries if issues persist
