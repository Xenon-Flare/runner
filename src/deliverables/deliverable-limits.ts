/** Mirrors limits in `functions/src/workspaceJobs.ts`. */

export const MAX_FILE_CONTENT_CHARS = 48_000;
/** Hard cap on spec files per run (abuse / payload size), not a product tier limit. */
export const MAX_FILES = 24;
export const MAX_CHARTS = 12;
export const MAX_DATASETS = 8;
export const MAX_SVGS = 8;
export const MAX_LISTS = 12;
export const MAX_CHECKLISTS = 8;
export const MAX_LIST_ITEMS = 48;
export const MAX_CHECKLIST_ITEMS = 64;
export const MAX_CHECKLIST_LABEL_CHARS = 320;
export const MAX_SCATTER_SERIES = 6;
export const MAX_SCATTER_POINTS_PER_SERIES = 48;
export const MAX_LIST_ITEM_CHARS = 512;
export const MAX_SVG_CONTENT_CHARS = 64_000;
export const MAX_BAR_LABELS = 32;
export const MAX_BAR_SERIES = 8;
export const MAX_PIE_SEGMENTS = 24;
export const MAX_TABLE_COLUMNS = 12;
export const MAX_TABLE_ROWS = 80;
export const MAX_CELL_CHARS = 512;
