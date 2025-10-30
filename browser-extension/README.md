# Job Application Tracker - Browser Extension

A Chrome/Edge browser extension to quickly add job applications from LinkedIn, Indeed, Glassdoor, and other job boards.

## Features

- **Auto-Extract Job Details**: Automatically extracts company name, position, location, salary, and description from job posting pages
- **One-Click Save**: Save job applications directly to your tracker with one click
- **Supported Job Boards**:
  - LinkedIn
  - Indeed
  - Glassdoor
  - ZipRecruiter
  - Lever
  - Greenhouse
  - And more (generic extraction for other sites)

## Installation

### Chrome/Edge

1. Open Chrome and go to `chrome://extensions/` (or `edge://extensions/` for Edge)
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Select the `browser-extension` folder from this project
5. The extension icon should now appear in your browser toolbar

## Usage

1. Navigate to any job posting on supported job boards
2. Click the extension icon in your toolbar
3. The extension will automatically extract job details
4. Review the extracted information
5. Edit any fields if needed
6. Click "Save Application" to add it to your tracker

## Requirements

- Your Job Application Tracker must be running on:
  - Frontend: `http://localhost:3000`
  - Backend: `http://localhost:8000`

- Make sure Docker containers are running:
  ```bash
  docker compose up -d
  ```

## Icon Setup

The extension currently uses placeholder icons. To add custom icons:

1. Create three PNG files:
   - `icons/icon16.png` (16x16px)
   - `icons/icon48.png` (48x48px)
   - `icons/icon128.png` (128x128px)

2. You can use a free icon from [Flaticon](https://www.flaticon.com/) or design your own

## Troubleshooting

**"Failed to save application"**
- Ensure the backend is running on `http://localhost:8000`
- Check that CORS is enabled in the backend
- Verify Docker containers are up: `docker compose ps`

**"Could not extract job details"**
- The current page may not be a supported job posting
- Try refreshing the page and clicking "Extract Again"
- Some job boards may have changed their HTML structure

**Extension not appearing**
- Make sure "Developer mode" is enabled in `chrome://extensions/`
- Try reloading the extension by clicking the reload icon
- Check the browser console for errors

## Privacy

This extension:
- Only extracts data from job posting pages when you click the extension icon
- Sends data directly to your local tracker (localhost)
- Does not collect or send any data to external servers
- Does not track your browsing history

## Development

To modify the extension:

1. Edit the files in `browser-extension/`
2. Go to `chrome://extensions/`
3. Click the reload icon on the extension card
4. Test your changes

## Permissions Explained

- **activeTab**: Allows the extension to read the current tab's content when you click the icon
- **storage**: Stores extension settings locally in your browser
- **host_permissions (localhost)**: Allows sending data to your local tracker

## Support

If you encounter issues:
1. Check the browser console (F12) for errors
2. Verify the tracker backend is running
3. Try the bookmarklet alternative (available in the "Add Application" dialog)
