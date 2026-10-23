import React from 'react';
import { TeamId } from '../../types';

interface F1CarSponsors3DProps {
  teamId: TeamId;
  showSponsors?: boolean;
}

/**
 * Sponsor logos and liveries are now mapped directly onto the 3D car's UV mesh materials
 * via F1CarTextures.ts, eliminating all floating billboard planes in empty space.
 */
export const F1CarSponsors3D: React.FC<F1CarSponsors3DProps> = () => {
  return null;
};
