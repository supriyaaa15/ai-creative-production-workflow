export const NODE_DEFS = {
  input: {
    label: 'Batch Input',
    step: 1,
    description: 'Your source assets',
    configurable: false,
    toggleable: false,
  },
  generate: {
    label: 'Generate Variant',
    step: 2,
    description: 'AI creates N variants per asset',
    configurable: true,
    toggleable: false, // core step, can't be turned off in v1
    fields: [
      { key: 'promptTemplate', label: 'Prompt template', type: 'textarea',
        placeholder: 'Leave blank to auto-build from the brief' },
    ],
  },
  upscale: {
    label: 'Upscale',
    step: 3,
    description: 'Sharpen and enlarge each variant',
    configurable: true,
    toggleable: true,
    fields: [
      { key: 'scale', label: 'Scale factor', type: 'select', options: [2, 4] },
    ],
  },
  caption: {
    label: 'Caption',
    step: 4,
    description: 'Write a caption per variant',
    configurable: true,
    toggleable: true,
    fields: [
      { key: 'tone', label: 'Tone', type: 'select', options: ['marketing', 'descriptive', 'minimal'] },
    ],
  },
  export: {
    label: 'Export',
    step: 5,
    description: 'Package reviewed variants — runs after you review results, not during generation',
    configurable: true,
    toggleable: false,
    terminal: true,
    fields: [
      { key: 'namingPattern', label: 'File naming pattern', type: 'text' },
    ],
  },
};
