// JanSamachar — India Flag Color System
// Saffron #FF9933 | Navy Blue #000080 | White | Ashoka Chakra Blue #06038D

export const Colors = {
  light: {
    // Primary Brand
    primary: '#FF9933',         // Saffron — India flag
    primaryDark: '#E07000',     // Darker saffron for pressed states
    secondary: '#000080',       // Navy Blue — trust, authority
    accent: '#06038D',          // Ashoka Chakra Blue

    // Backgrounds
    background: '#F8F8F8',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    card: '#FFFFFF',

    // Text
    text: '#1A1A1A',
    textSecondary: '#555555',
    textMuted: '#888888',
    textInverse: '#FFFFFF',

    // Status
    live: '#E53935',            // Red — LIVE indicator
    liveGlow: 'rgba(229,57,53,0.2)',
    verified: '#2E7D32',        // Green — verified source
    breaking: '#FF5722',        // Deep orange — breaking news
    warning: '#FF9933',
    factCheck: '#1565C0',       // Blue — fact-checked

    // Borders & Dividers
    border: '#E8E8E8',
    divider: '#F0F0F0',

    // Tab bar
    tabBar: '#FFFFFF',
    tabBarBorder: '#E8E8E8',
    tabIconDefault: '#AAAAAA',
    tabIconSelected: '#FF9933',

    // Trust badge colors
    trustVerified: '#2E7D32',
    trustYoutube: '#CC0000',
    trustCitizen: '#F57C00',
    trustBreaking: '#E53935',
    trustDoc: '#1565C0',
    trustAI: '#6A1B9A',

    // Tint
    tint: '#FF9933',
    icon: '#555555',
  },

  dark: {
    // Primary Brand (stays vibrant on dark)
    primary: '#FF9933',
    primaryDark: '#E07000',
    secondary: '#4A90E2',       // Lighter blue for dark bg
    accent: '#7B8FFF',

    // Backgrounds
    background: '#0A0A0A',
    surface: '#161616',
    surfaceElevated: '#1E1E1E',
    card: '#1A1A1A',

    // Text
    text: '#F0F0F0',
    textSecondary: '#BBBBBB',
    textMuted: '#777777',
    textInverse: '#000000',

    // Status (same as light — these are semantic)
    live: '#FF5252',
    liveGlow: 'rgba(255,82,82,0.25)',
    verified: '#66BB6A',
    breaking: '#FF6E40',
    warning: '#FF9933',
    factCheck: '#42A5F5',

    // Borders
    border: '#2A2A2A',
    divider: '#222222',

    // Tab bar
    tabBar: '#111111',
    tabBarBorder: '#2A2A2A',
    tabIconDefault: '#555555',
    tabIconSelected: '#FF9933',

    // Trust badges
    trustVerified: '#4CAF50',
    trustYoutube: '#FF4444',
    trustCitizen: '#FFA726',
    trustBreaking: '#FF5252',
    trustDoc: '#42A5F5',
    trustAI: '#AB47BC',

    tint: '#FF9933',
    icon: '#BBBBBB',
  },
};
