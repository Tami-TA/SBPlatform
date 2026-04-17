import type { OTBookContext } from "../context-types";

export const CONTEXT_NAM_TO_HAB: OTBookContext[] = [
  {
    id: "NAH",
    name: "Nahum",
    overview: {
      shortSummary: "God's judgment on Nineveh — the cruel Assyrian empire falls.",
      fullSummary: "Nahum announces God's just wrath on Nineveh, the capital of Assyria, about 150 years after Jonah's mission. Where Jonah saw Nineveh repent, Nahum sees it relapse and face destruction. The book is a poem of divine justice.",
      themes: ["Divine justice", "God as warrior", "Fall of the proud", "Comfort for the oppressed"],
      keyMessages: ["The LORD is slow to anger but great in power", "He will not leave the guilty unpunished", "Your wound is incurable"],
    },
    author: { traditional: "Nahum the Elkoshite", notes: "Location of Elkosh unknown; possibly Judah." },
    timePeriod: {
      eventsDate: "c.663-612 BC",
      writingDate: "c.650-620 BC",
      biblicalPlacement: "Minor Prophet",
      relationToEvents: "Written before Nineveh fell in 612 BC",
    },
    historicalSetting: {
      rulers: ["Josiah (Judah)", "Ashurbanipal (Assyria)"],
      israelKings: ["Josiah"],
      neighboringPowers: ["Assyria (target)", "Babylon (rising)", "Media"],
      politicalBackground: "Assyria had dominated the ancient world for centuries with extreme cruelty. Babylon and Media united to destroy Nineveh in 612 BC.",
    },
    mapLocations: [
      { name: "Nineveh", type: "battle", description: "Target of Nahum's oracle; destroyed 612 BC", svgX: 248, svgY: 128 },
      { name: "Thebes (No-Amon)", type: "city", description: "Egyptian city Assyria sacked; used as comparison", svgX: 130, svgY: 248 },
      { name: "Tigris River", type: "region", description: "Nineveh's flooding defense", svgX: 250, svgY: 130 },
    ],
    genealogy: {
      description: "Minimal genealogy.",
      nodes: [
        { id: "nahum", name: "Nahum", notes: "Elkoshite prophet" },
      ],
    },
    keyEvents: [
      { order: 1, title: "God's character declared", description: "Jealous, avenging, slow to anger, great in power", reference: "Nahum 1:2-8" },
      { order: 2, title: "Good news for Judah", description: "Your enemy will be cut off", reference: "Nahum 1:12-15" },
      { order: 3, title: "Siege of Nineveh", description: "Vivid poetic battle description", reference: "Nahum 2" },
      { order: 4, title: "Woe to the city of blood", description: "Judgment on Nineveh's cruelty", reference: "Nahum 3:1-7" },
      { order: 5, title: "No remedy for Nineveh", description: "Compared to fallen Thebes", reference: "Nahum 3:8-19" },
    ],
    culturalNotes: [
      { category: "social", title: "Assyrian cruelty", content: "Assyria impaled captives on stakes, flayed enemies, and deported entire peoples." },
      { category: "geography", title: "Nineveh's walls", content: "The city had massive double walls; the Khosr and Tigris rivers protected flanks." },
      { category: "customs", title: "Prophetic poetry", content: "Nahum is one of the most vivid military poems in Scripture." },
      { category: "law", title: "Divine justice delayed", content: "God waited ~150 years after Jonah before executing judgment." },
    ],
    didYouKnow: [
      "Nineveh was so completely destroyed that its exact location was unknown for centuries.",
      "Archaeologists rediscovered Nineveh in the 19th century near modern Mosul, Iraq.",
      "Nahum's name means 'comfort' — comfort for Judah, not Nineveh.",
      "The fall of Nineveh is described with remarkable historical accuracy.",
    ],
  },
  {
    id: "HAB",
    name: "Habakkuk",
    overview: {
      shortSummary: "A prophet wrestles with God over injustice and learns to rejoice in faith.",
      fullSummary: "Habakkuk argues with God: why does He tolerate Judah's wickedness, and why does He use wicked Babylon as His instrument? God answers that the just shall live by faith, and Habakkuk ends in trust and praise.",
      themes: ["Theodicy", "Living by faith", "God's sovereignty in history", "Praise despite circumstances"],
      keyMessages: ["The just shall live by faith", "The LORD is in His holy temple", "I will rejoice in the God of my salvation"],
    },
    author: { traditional: "Habakkuk", notes: "Name possibly means 'embrace'; otherwise unknown." },
    timePeriod: {
      eventsDate: "c.609-598 BC",
      writingDate: "c.605 BC",
      biblicalPlacement: "Minor Prophet",
      relationToEvents: "Babylon rising; Judah's last decades",
    },
    historicalSetting: {
      rulers: ["Jehoiakim (Judah)", "Nebuchadnezzar (Babylon)"],
      israelKings: ["Jehoiakim"],
      neighboringPowers: ["Babylon (dominant)", "Egypt (weakening)"],
      politicalBackground: "Babylon defeated Egypt at Carchemish (605 BC) and became the dominant power; Judah fell under its shadow.",
    },
    mapLocations: [
      { name: "Jerusalem", type: "city", description: "Habakkuk's ministry base", svgX: 160, svgY: 165 },
      { name: "Babylon", type: "city", description: "God's instrument of judgment", svgX: 272, svgY: 178 },
      { name: "Carchemish", type: "battle", description: "Babylon defeats Egypt 605 BC", svgX: 210, svgY: 118 },
    ],
    genealogy: {
      description: "Minimal.",
      nodes: [
        { id: "habakkuk", name: "Habakkuk", notes: "Possibly a temple prophet" },
      ],
    },
    keyEvents: [
      { order: 1, title: "First complaint", description: "Why do You tolerate injustice in Judah?", reference: "Habakkuk 1:1-4" },
      { order: 2, title: "God's answer: Babylon", description: "I am raising up the Chaldeans", reference: "Habakkuk 1:5-11" },
      { order: 3, title: "Second complaint", description: "How can You use wicked Babylon?", reference: "Habakkuk 1:12-2:1" },
      { order: 4, title: "Five woes on Babylon", description: "Babylon will fall too", reference: "Habakkuk 2:6-20" },
      { order: 5, title: "The just shall live by faith", description: "Central declaration", reference: "Habakkuk 2:4" },
      { order: 6, title: "Habakkuk's prayer and praise", description: "Trembling yet trusting", reference: "Habakkuk 3" },
    ],
    culturalNotes: [
      { category: "worship", title: "Watchtower prayer", content: "Habakkuk stood at his watchtower to wait for God's answer." },
      { category: "customs", title: "Musical notation", content: "Habakkuk 3 is a psalm with Selah and performance directions." },
      { category: "law", title: "The just shall live by faith", content: "Paul quotes Hab 2:4 three times (Rom 1:17, Gal 3:11, Heb 10:38)." },
      { category: "social", title: "Theodicy dialogue", content: "Habakkuk is unique — a dialogue where the prophet challenges God." },
    ],
    didYouKnow: [
      "Martin Luther's reading of 'the just shall live by faith' sparked the Reformation.",
      "Habakkuk 3 ends with one of the greatest faith statements in Scripture (3:17-19).",
      "The book is structured as a courtroom dialogue.",
      "Habakkuk is the only OT prophet who complains to God and receives a direct written answer.",
    ],
  },
];
