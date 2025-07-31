# DigiByte Stats

## Project Overview

DigiByte Stats is a React-based web application that provides real-time statistics and visualizations for the DigiByte blockchain. The application displays comprehensive metrics including blockchain statistics, mining pool distribution, node geography, hashrate analysis, and more.

## Design System

### Theme Consistency
- **UI Framework**: Material-UI (MUI) v5
- **Color Scheme**: Dark theme with gradient backgrounds
- **Card-based Layouts**: Consistent hover effects and shadows
- **Typography**: Hierarchical structure with responsive sizing

### Component Patterns
- **Hero Sections**: Page header with title and description
- **Stat Cards**: Reusable metric display components
- **Loading States**: Consistent "Loading..." indicators
- **WebSocket Integration**: Real-time data updates
- **Responsive Design**: Mobile-first approach

## Page Structure

Each page follows a consistent structure:

1. **Hero Section** - Page title and descriptive text
2. **Main Content** - Cards, charts, or visualizations
3. **Educational Content** - Explanatory sections when applicable
4. **Stats/Summary** - Key metrics and totals

## Technical Standards

### Performance
- Optimized D3.js and Chart.js rendering
- Efficient WebSocket management
- Memoized computations for expensive operations
- Responsive chart sizing

### Code Quality
- Functional React components with hooks
- Clear separation of concerns
- Comprehensive error handling
- Mobile-responsive design

### Data Visualization
- **D3.js**: Geographic maps and custom charts
- **Chart.js**: Time series and line charts
- **Real-time Updates**: WebSocket-driven data

## Development Guidelines

When adding features or making changes:

1. **Maintain Visual Consistency**: Follow existing card patterns and color schemes
2. **Ensure Responsiveness**: Test on mobile and desktop viewports
3. **Handle Loading States**: Show appropriate loading indicators
4. **Optimize Performance**: Use React.memo and useMemo where appropriate
5. **Follow Component Structure**: Hero → Content → Stats pattern

## Testing

The project maintains 100% test coverage with:
- Unit tests (Vitest)
- E2E tests (Playwright)
- Cross-browser compatibility
- Mobile viewport testing