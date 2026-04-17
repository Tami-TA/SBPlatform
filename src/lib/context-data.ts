import type { OTBookContext } from "./context-types";
import { CONTEXT_GEN_TO_NUM } from "./context-parts/gen-num";
import { CONTEXT_DEU_TO_RUT } from "./context-parts/deu-rut";
import { CONTEXT_1SA_TO_2KI } from "./context-parts/1sa-2ki";
import { CONTEXT_1CH_TO_NEH } from "./context-parts/1ch-neh";
import { CONTEXT_EST_TO_PRO } from "./context-parts/est-pro";
import { CONTEXT_ECC_TO_JER } from "./context-parts/ecc-jer";
import { CONTEXT_LAM_TO_HOS } from "./context-parts/lam-hos";
import { CONTEXT_JOL_TO_MIC } from "./context-parts/jol-mic";
import { CONTEXT_NAM_TO_HAB } from "./context-parts/nam-hab";
import { CONTEXT_ZEP_TO_HAG } from "./context-parts/zep-hag";
import { CONTEXT_ZEC_TO_MAL } from "./context-parts/zec-mal";

export const OT_BOOKS_CONTEXT: OTBookContext[] = [
  ...CONTEXT_GEN_TO_NUM,
  ...CONTEXT_DEU_TO_RUT,
  ...CONTEXT_1SA_TO_2KI,
  ...CONTEXT_1CH_TO_NEH,
  ...CONTEXT_EST_TO_PRO,
  ...CONTEXT_ECC_TO_JER,
  ...CONTEXT_LAM_TO_HOS,
  ...CONTEXT_JOL_TO_MIC,
  ...CONTEXT_NAM_TO_HAB,
  ...CONTEXT_ZEP_TO_HAG,
  ...CONTEXT_ZEC_TO_MAL,
];

export function getBookContext(bookId: string): OTBookContext | undefined {
  return OT_BOOKS_CONTEXT.find((b) => b.id === bookId);
}
