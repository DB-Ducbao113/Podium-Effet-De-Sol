import { F1StartLightsPreloader } from './F1StartLightsPreloader';
import { isDocumentReload } from './documentReload';

// Module evaluation happens once for this document, independently of router remounts.
const showIntroForThisDocument = isDocumentReload();

export function DocumentIntroController() {
  return showIntroForThisDocument ? <F1StartLightsPreloader /> : null;
}
