import type {
  RunnerChart,
  RunnerDatasetTable,
  RunnerFile,
  RunnerList,
  RunnerSvg,
} from "../deliverables/deliverable-validation.js";

export type RunnerAccumulator = {
  files: RunnerFile[];
  charts: RunnerChart[];
  datasets: RunnerDatasetTable[];
  svgs: RunnerSvg[];
  lists: RunnerList[];
};
