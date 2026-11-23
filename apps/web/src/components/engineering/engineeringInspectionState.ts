export interface EngineeringInspectionState {
  readonly selectedPartId: string | null;
  readonly isolatedPartId: string | null;
  readonly orbitMode: boolean;
}

export interface EngineeringInspectionPose {
  readonly tx: number;
  readonly ty: number;
  readonly tz: number;
  readonly rx: number;
  readonly ry: number;
  readonly rz: number;
}

type EngineeringPoseVector = readonly [number, number, number];

export function resolveEngineeringInspectionPose(
  storyPose: EngineeringInspectionPose,
  explodeOffset: EngineeringPoseVector,
  explodeEuler: EngineeringPoseVector,
  isolated: boolean,
  isolationProgress = 1,
): EngineeringInspectionPose {
  if (!isolated) return storyPose;
  const progress = Math.max(0, Math.min(1, isolationProgress));
  return {
    tx: storyPose.tx + (explodeOffset[0] - storyPose.tx) * progress,
    ty: storyPose.ty + (explodeOffset[1] - storyPose.ty) * progress,
    tz: storyPose.tz + (explodeOffset[2] - storyPose.tz) * progress,
    rx: storyPose.rx + (explodeEuler[0] - storyPose.rx) * progress,
    ry: storyPose.ry + (explodeEuler[1] - storyPose.ry) * progress,
    rz: storyPose.rz + (explodeEuler[2] - storyPose.rz) * progress,
  };
}

export type EngineeringInspectionAction =
  | { readonly type: "select"; readonly partId: string | null }
  | { readonly type: "isolate" }
  | { readonly type: "reassemble" }
  | { readonly type: "reset" }
  | { readonly type: "enter-orbit" }
  | { readonly type: "exit-orbit" }
  | { readonly type: "chapter-change" };

export const INITIAL_ENGINEERING_INSPECTION_STATE: EngineeringInspectionState =
  {
    selectedPartId: null,
    isolatedPartId: null,
    orbitMode: false,
  };

export function engineeringInspectionReducer(
  state: EngineeringInspectionState,
  action: EngineeringInspectionAction,
): EngineeringInspectionState {
  switch (action.type) {
    case "select":
      if (!action.partId) return INITIAL_ENGINEERING_INSPECTION_STATE;
      return {
        ...state,
        selectedPartId: action.partId,
        isolatedPartId: state.isolatedPartId ? action.partId : null,
      };
    case "isolate":
      if (!state.selectedPartId) return state;
      return {
        ...state,
        isolatedPartId: state.selectedPartId,
        orbitMode: true,
      };
    case "reassemble":
    case "chapter-change":
      if (state.isolatedPartId === null && !state.orbitMode) return state;
      return { ...state, isolatedPartId: null, orbitMode: false };
    case "reset":
      if (
        state.selectedPartId === null &&
        state.isolatedPartId === null &&
        !state.orbitMode
      ) {
        return state;
      }
      return INITIAL_ENGINEERING_INSPECTION_STATE;
    case "enter-orbit":
      return { ...state, orbitMode: true };
    case "exit-orbit":
      return { ...state, orbitMode: false };
    default:
      return state;
  }
}
