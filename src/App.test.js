import { describe, it, expect, vi } from 'vitest';
import { screen, render } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import App from './App';

// Create a default theme for tests
const theme = createTheme();

// Mock the config
vi.mock('./config', () => ({
  default: {
    apiBaseUrl: 'http://localhost:5001',
    wsBaseUrl: 'ws://localhost:5002'
  }
}));

// Mock Chart.js
vi.mock('chart.js', () => {
  const Chart = vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn(),
    render: vi.fn(),
    resize: vi.fn(),
    clear: vi.fn(),
    stop: vi.fn(),
    data: {},
    options: {}
  }));
  Chart.register = vi.fn();
  return {
    Chart,
    registerables: [],
    LineController: {},
    CategoryScale: {},
    LinearScale: {},
    PointElement: {},
    LineElement: {},
    Title: {},
    Tooltip: {},
    Legend: {},
    TimeScale: {},
    LogarithmicScale: {}
  };
});

// Mock chartjs-adapter-luxon
vi.mock('chartjs-adapter-luxon', () => ({}));

// Mock D3
vi.mock('d3', () => ({
  select: vi.fn(() => ({
    append: vi.fn().mockReturnThis(),
    attr: vi.fn().mockReturnThis(),
    style: vi.fn().mockReturnThis(),
    selectAll: vi.fn().mockReturnThis(),
    data: vi.fn().mockReturnThis(),
    enter: vi.fn().mockReturnThis(),
    exit: vi.fn().mockReturnThis(),
    remove: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    nodes: vi.fn(() => [])
  })),
  arc: vi.fn(() => ({
    innerRadius: vi.fn().mockReturnThis(),
    outerRadius: vi.fn().mockReturnThis()
  })),
  pie: vi.fn(() => ({
    value: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis()
  })),
  scaleOrdinal: vi.fn(() => vi.fn()),
  schemeSet3: ['#1', '#2', '#3'],
  geoNaturalEarth1: vi.fn(() => ({
    fitSize: vi.fn().mockReturnThis(),
    translate: vi.fn(() => [0, 0]),
    scale: vi.fn(() => 1)
  })),
  geoPath: vi.fn(() => vi.fn()),
  zoom: vi.fn(() => ({
    scaleExtent: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis()
  }))
}));

describe('App', () => {
  // Helper function to render App with theme
  const renderApp = () => {
    return render(
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    );
  };

  it('renders the header', () => {
    renderApp();
    // The header should contain a logo with alt text
    const logos = screen.getAllByAltText(/logo/i);
    expect(logos.length).toBeGreaterThan(0);
  });

  it('renders the home page by default', () => {
    renderApp();
    // There might be multiple elements with this text, so just check that at least one exists
    const headings = screen.getAllByText(/DigiByte Blockchain Statistics/i);
    expect(headings.length).toBeGreaterThan(0);
  });

  it('renders the footer', () => {
    renderApp();
    // Check for footer content - adjust based on actual footer text
    const footerElement = screen.getByRole('contentinfo');
    expect(footerElement).toBeInTheDocument();
  });
});