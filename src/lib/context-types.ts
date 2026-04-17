export interface MapLocation {
  name: string;
  type: "city" | "region" | "journey" | "battle" | "exile";
  description: string;
  svgX: number;
  svgY: number;
}

export interface GenealogyNode {
  id: string;
  name: string;
  parentId?: string;
  notes?: string;
}

export interface KeyEvent {
  order: number;
  title: string;
  description: string;
  reference: string;
}

export interface CulturalNote {
  category: "customs" | "law" | "worship" | "social" | "geography";
  title: string;
  content: string;
}

export interface OTBookContext {
  id: string;
  name: string;
  overview: {
    shortSummary: string;
    fullSummary: string;
    themes: string[];
    keyMessages: string[];
  };
  author: {
    traditional: string;
    notes: string;
  };
  timePeriod: {
    eventsDate: string;
    writingDate: string;
    biblicalPlacement: string;
    relationToEvents: string;
  };
  historicalSetting: {
    rulers: string[];
    israelKings: string[];
    neighboringPowers: string[];
    politicalBackground: string;
  };
  mapLocations: MapLocation[];
  genealogy: {
    description: string;
    nodes: GenealogyNode[];
  };
  keyEvents: KeyEvent[];
  culturalNotes: CulturalNote[];
  didYouKnow: string[];
}
