export interface GenealogyNode {
  id: string;
  name: string;
  title?: string;
  lifespan?: string;
  significance?: string;
  children?: GenealogyNode[];
  spouses?: string[];
  highlight?: boolean;
}

export interface MapLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: "city" | "region" | "journey" | "battle" | "landmark";
  description: string;
  significance?: string;
}

export interface KeyEvent {
  id: string;
  year?: string;
  title: string;
  description: string;
  chapter?: string;
  significance: "major" | "minor" | "pivotal";
  category: "covenant" | "war" | "prophecy" | "miracle" | "sin" | "restoration" | "creation" | "genealogy" | "law" | "worship";
}

export interface CulturalNote {
  id: string;
  title: string;
  content: string;
  category: "customs" | "law" | "worship" | "economy" | "family" | "warfare" | "language" | "agriculture";
}

export interface BookContext {
  bookId: string;
  bookName: string;
  testament: "OT" | "NT";
  emoji: string;
  overview: {
    shortSummary: string;
    fullSummary: string;
    themes: string[];
    keyMessages: string[];
    didYouKnow: string[];
  };
  author: {
    traditional: string;
    debate?: string;
    background: string;
  };
  timePeriod: {
    writtenApprox: string;
    coversPeriod?: string;
    globalContext: string;
    beforeAfter: string[];
  };
  historicalSetting: {
    rulers: { role: string; name: string; notes?: string }[];
    worldPowers: { name: string; relevance: string }[];
    politicalContext: string;
  };
  mapLocations: MapLocation[];
  genealogy?: {
    title: string;
    description: string;
    rootNode: GenealogyNode;
  };
  keyEvents: KeyEvent[];
  culturalNotes: CulturalNote[];
  crossReferences: { bookId: string; bookName: string; connection: string }[];
  keyVerses: { ref: string; text: string; bookId: string; chapter: number; verse: number }[];
}
