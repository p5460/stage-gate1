# Dark Mode Implementation

## Overview

Dark mode has been successfully implemented across the CSIR Stage-Gate Platform using Next.js themes and Tailwind CSS.

## Features Added

### 1. Theme Toggle Components

- **ThemeToggle**: Dropdown menu with Light/Dark/System options
- **ThemeToggleButton**: Simple toggle button for quick switching
- **ThemeSettings**: Comprehensive theme settings page

### 2. Integration Points

- **Header**: Theme toggle in the main header
- **Mobile Navigation**: Theme toggle in mobile sidebar
- **User Dropdown**: Theme options in user menu
- **Settings Page**: Dedicated theme settings tab

### 3. Dark Mode Support

- All major components updated with proper dark mode classes
- Sidebar, header, and navigation components fully themed
- CSS variables configured for both light and dark themes
- Smooth transitions between themes

## Usage

### Quick Toggle

Users can toggle between light and dark modes using:

- The sun/moon icon in the header
- The theme dropdown in the user menu
- The mobile navigation theme toggle

### Theme Settings

For more control, users can visit Settings > Theme to:

- Choose between Light, Dark, or System themes
- See descriptions of each theme option
- Have their preference automatically saved

### System Theme

The "System" option automatically follows the user's operating system theme preference and switches accordingly.

## Technical Implementation

### CSS Variables

The implementation uses CSS custom properties defined in `app/globals.css`:

- Light theme variables in `:root`
- Dark theme variables in `.dark`
- Semantic color tokens for consistent theming

### Components Updated

- `components/dashboard/header.tsx`
- `components/dashboard/sidebar.tsx`
- `components/layout/mobile-nav.tsx`
- `app/(protected)/settings/page.tsx`

### New Components Created

- `components/theme-toggle.tsx`
- `components/ui/theme-toggle-button.tsx`
- `components/settings/theme-settings.tsx`
- `components/ui/radio-group.tsx`

## Configuration

The theme provider is configured in `app/layout.tsx` with:

- `attribute="class"` - Uses class-based theme switching
- `defaultTheme="system"` - Defaults to system preference
- `enableSystem` - Enables system theme detection
- `disableTransitionOnChange` - Prevents flash during theme changes

## Browser Support

- Modern browsers with CSS custom properties support
- Automatic fallbacks for older browsers
- Respects user's `prefers-color-scheme` media query

The dark mode implementation is now complete and ready for use across the entire application.
