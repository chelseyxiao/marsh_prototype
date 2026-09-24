export async function simulateProcessing(
  onProgress: (progress: number, label: string) => void,
): Promise<void> {
  const steps = [
    { label: 'Documents uploaded', progress: 16 },
    { label: 'Documents classified', progress: 32 },
    { label: 'Tables extracted', progress: 52 },
    { label: 'Mapping fields to data book', progress: 72 },
    { label: 'Validating results', progress: 88 },
    { label: 'Preparing review', progress: 100 },
  ]

  for (const step of steps) {
    onProgress(step.progress, step.label)
    await new Promise((resolve) => window.setTimeout(resolve, 430))
  }
}
