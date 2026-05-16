const analyzeJSON = (value) => {
  const summary = {
    keys: 0,
    objects: 0,
    arrays: 0,
    maxDepth: 0,
    size: formatBytes(byteSize(JSON.stringify(value)))
  };

  visit(value, 1, summary);

  return summary;
}

const visit = (value, depth, summary) => {
  if (value === null || typeof value !== "object") {
    summary.maxDepth = Math.max(summary.maxDepth, depth);
    return;
  }

  summary.maxDepth = Math.max(summary.maxDepth, depth);

  if (Array.isArray(value)) {
    summary.arrays += 1;
    for (const item of value) {
      visit(item, depth + 1, summary);
    }
    return;
  }

  summary.objects += 1;
  const entries = Object.entries(value);
  summary.keys += entries.length;

  for (const [, child] of entries) {
    visit(child, depth + 1, summary);
  }
}

const byteSize = (value) => {
  return new Blob([value]).size;
}

const formatBytes = (bytes) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(1)} MB`;
}

export {
  analyzeJSON,
  visit,
  byteSize,
  formatBytes
}