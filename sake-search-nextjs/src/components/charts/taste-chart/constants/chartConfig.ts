export const CHART_CONFIG = {
  layout: {
    padding: {
      top: 30,
      bottom: 30,
      left: 10,
      right: 10
    }
  },
  scales: {
    x: {
      type: 'linear' as const,
      position: 'bottom' as const,
      min: -5,
      max: 5,
      display: false,
    },
    y: {
      type: 'linear' as const,
      min: -3,
      max: 3,
      display: false,
    }
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: true,
    }
  },
  elements: {
    point: {
      radius: 6,
      hoverRadius: 8,
    },
  },
  maintainAspectRatio: false,
  responsive: true,
  interaction: {
    intersect: false,
    mode: 'nearest' as const,
  },
} as const;

export const QUADRANT_LABELS = {
  topLeft: { text: '甘・濃醇', x: -4, y: 2.5 },
  topRight: { text: '濃醇', x: 4, y: 2.5 },
  bottomLeft: { text: '甘・淡麗', x: -4, y: -2.5 },
  bottomRight: { text: '辛・淡麗', x: 4, y: -2.5 }
} as const;

export const AXIS_LABELS = {
  horizontal: {
    left: { text: '甘', x: -4.5, y: -0.3 },
    right: { text: '辛', x: 4.5, y: -0.3 }
  },
  vertical: {
    top: { text: '濃醇', x: 0, y: 2.7 },
    bottom: { text: '淡麗', x: 0, y: -2.7 }
  }
} as const;