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
import { CONTEXT_MAT_TO_JHN } from "./context-parts/nt-mat-jhn";
import { CONTEXT_ACT_TO_2CO } from "./context-parts/nt-act-2co";
import { CONTEXT_GAL_TO_COL } from "./context-parts/nt-gal-col";
import { CONTEXT_1TH_TO_2TH } from "./context-parts/nt-1th-2th";
import { CONTEXT_1TI_TO_PHM } from "./context-parts/nt-1ti-phm";
import { CONTEXT_HEB_TO_2PE } from "./context-parts/nt-heb-2pe";
import { CONTEXT_1JN_TO_JUD } from "./context-parts/nt-1jn-jud";
import { CONTEXT_REV } from "./context-parts/nt-rev";

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

export const NT_BOOKS_CONTEXT: OTBookContext[] = [
  ...CONTEXT_MAT_TO_JHN,
  ...CONTEXT_ACT_TO_2CO,
  ...CONTEXT_GAL_TO_COL,
  ...CONTEXT_1TH_TO_2TH,
  ...CONTEXT_1TI_TO_PHM,
  ...CONTEXT_HEB_TO_2PE,
  ...CONTEXT_1JN_TO_JUD,
  ...CONTEXT_REV,
];

export const ALL_BOOKS_CONTEXT: OTBookContext[] = [
  ...OT_BOOKS_CONTEXT,
  ...NT_BOOKS_CONTEXT,
];

export function getBookContext(bookId: string): OTBookContext | undefined {
  return ALL_BOOKS_CONTEXT.find((b) => b.id === bookId);
}
