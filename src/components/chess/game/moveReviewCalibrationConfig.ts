import { DEFAULT_MOVE_REVIEW_CONFIG } from './moveReviewConfig';
import {
  DEFAULT_EXPECTED_POINTS_MODEL_CONFIG,
  type ExpectedPointsModelConfig,
} from './moveReviewExpectedPoints';
import type { MoveReviewConfig } from './moveReviewTypes';

export interface MoveReviewCalibrationConfig {
  reviewConfig: MoveReviewConfig;
  expectedPointsModelConfig: ExpectedPointsModelConfig;
}

export const DEFAULT_MOVE_REVIEW_CALIBRATION_CONFIG: MoveReviewCalibrationConfig = {
  reviewConfig: DEFAULT_MOVE_REVIEW_CONFIG,
  expectedPointsModelConfig: DEFAULT_EXPECTED_POINTS_MODEL_CONFIG,
};
