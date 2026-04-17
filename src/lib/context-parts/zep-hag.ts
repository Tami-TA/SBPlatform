import type { OTBookContext } from "../context-types";

export const CONTEXT_ZEP_TO_HAG: OTBookContext[] = [
  {
    id: "ZEP",
    name: "Zephaniah",
    overview: {
      shortSummary: "A sweeping Day of the LORD oracle — judgment then joy.",
      fullSummary: "Zephaniah, a great-great-grandson of King Hezekiah, preached during Josiah's early reign. He announced worldwide judgment and called Judah to seek the LORD, ending with a song of God rejoicing over His restored people.",
      themes: ["Day of the LORD", "Universal judgment", "Remnant", "God's joy over His people"],
      keyMessages: ["Seek the LORD while He may be found", "The LORD your God is in your midst", "He will rejoice over you with singing"],
    },
    author: { traditional: "Zephaniah", notes: "Royal lineage — traced to Hezekiah." },
    timePeriod: {
      eventsDate: "c.640-609 BC",
      writingDate: "c.630 BC",
      biblicalPlacement: "Minor Prophet",
      relationToEvents: "During Josiah's early reign, before his reforms",
    },
    historicalSetting: {
      rulers: ["Josiah (Judah)"],
      israelKings: ["Josiah"],
      neighboringPowers: ["Assyria (waning)", "Babylon (rising)"],
      politicalBackground: "Manasseh's long evil reign left Judah deeply corrupted. Josiah began reversing it; Zephaniah may have helped spark the reform.",
    },
    mapLocations: [
      { name: "Jerusalem", type: "city", description: "Primary target of oracles", svgX: 160, svgY: 165 },
      { name: "Nineveh", type: "city", description: "Included in judgment oracle", svgX: 248, svgY: 128 },
      { name: "Philistia (Gaza, Ashkelon)", type: "region", description: "Nations under judgment", svgX: 140, svgY: 165 },
      { name: "Moab and Ammon", type: "region", description: "Nations under judgment", svgX: 175, svgY: 172 },
      { name: "Cush (Ethiopia)", type: "region", description: "Nations under judgment", svgX: 148, svgY: 262 },
    ],
    genealogy: {
      description: "Royal lineage.",
      nodes: [
        { id: "hezekiah", name: "Hezekiah (king)" },
        { id: "amariah", name: "Amariah", parentId: "hezekiah" },
        { id: "gedaliah", name: "Gedaliah", parentId: "amariah" },
        { id: "cushi", name: "Cushi", parentId: "gedaliah" },
        { id: "zephaniah", name: "Zephaniah", parentId: "cushi" },
      ],
    },
    keyEvents: [
      { order: 1, title: "Universal judgment announced", description: "I will sweep away everything", reference: "Zephaniah 1:2-3" },
      { order: 2, title: "Judgment on Jerusalem", description: "Officials, merchants, priests", reference: "Zephaniah 1:4-13" },
      { order: 3, title: "Day of the LORD described", description: "Day of wrath, trouble, ruin", reference: "Zephaniah 1:14-18" },
      { order: 4, title: "Call to seek the LORD", description: "Perhaps you will be sheltered", reference: "Zephaniah 2:1-3" },
      { order: 5, title: "Oracles against nations", description: "Philistia, Moab, Ammon, Cush, Assyria", reference: "Zephaniah 2:4-15" },
      { order: 6, title: "Woe to Jerusalem", description: "Corrupt leaders and prophets", reference: "Zephaniah 3:1-8" },
      { order: 7, title: "Song of restoration", description: "God rejoices over His people with singing", reference: "Zephaniah 3:14-17" },
    ],
    culturalNotes: [
      { category: "worship", title: "Baal and Molech worship", content: "Manasseh had introduced child sacrifice to Molech in Judah." },
      { category: "customs", title: "Threshold jumpers", content: "Zephaniah condemns a pagan ritual of jumping over thresholds." },
      { category: "social", title: "Meek of the land", content: "God protects the humble poor who trust Him." },
      { category: "law", title: "Day of the LORD", content: "Hebrew 'Yom YHWH' — decisive divine intervention in history." },
    ],
    didYouKnow: [
      "Zephaniah 3:17 — God singing over His people — is one of the most tender verses in the OT.",
      "Zephaniah is the only prophet to trace his ancestry back to a king (Hezekiah).",
      "The 'Dies Irae' (medieval requiem mass) draws from Zephaniah 1:15.",
      "\"Meek of the land\" (Zeph 2:3) parallels Jesus' Beatitudes (Matt 5:5).",
    ],
  },
  {
    id: "HAG",
    name: "Haggai",
    overview: {
      shortSummary: "Post-exilic prophet urges the returned exiles to rebuild the temple.",
      fullSummary: "Haggai delivered four short messages in 520 BC, just months apart. The returned exiles had built their own houses but left God's house in ruins. Haggai called them to prioritize the temple and promised God's presence.",
      themes: ["Priorities", "Temple rebuilding", "God's presence", "Future glory"],
      keyMessages: ["Consider your ways", "The glory of this temple will be greater", "From this day I will bless you"],
    },
    author: { traditional: "Haggai", notes: "One of three post-exilic prophets." },
    timePeriod: {
      eventsDate: "520 BC (very precise: 4 dated messages)",
      writingDate: "520 BC",
      biblicalPlacement: "Minor Prophet; post-exilic",
      relationToEvents: "Contemporary with Zechariah and Zerubbabel",
    },
    historicalSetting: {
      rulers: ["Darius I of Persia", "Zerubbabel (governor)", "Joshua the high priest"],
      israelKings: [],
      neighboringPowers: ["Persia (ruling empire)"],
      politicalBackground: "Exiles had returned 18 years earlier (538 BC) but temple rebuilding stalled due to opposition and discouragement.",
    },
    mapLocations: [
      { name: "Jerusalem", type: "city", description: "Temple site", svgX: 160, svgY: 165 },
      { name: "Mount Zion / Temple Mount", type: "city", description: "Center of rebuilding", svgX: 160, svgY: 165 },
    ],
    genealogy: {
      description: "Key leaders of the return.",
      nodes: [
        { id: "shealtiel", name: "Shealtiel" },
        { id: "zerubbabel", name: "Zerubbabel", parentId: "shealtiel", notes: "Governor, Davidic line" },
        { id: "jehozadak", name: "Jehozadak" },
        { id: "joshua", name: "Joshua", parentId: "jehozadak", notes: "High priest" },
        { id: "haggai", name: "Haggai", notes: "Prophet" },
      ],
    },
    keyEvents: [
      { order: 1, title: "First message: Consider your ways", description: "Build God's house, not just your own", reference: "Haggai 1:1-11" },
      { order: 2, title: "People obey", description: "Work begins again", reference: "Haggai 1:12-15" },
      { order: 3, title: "Second message: Greater glory", description: "Future glory will surpass Solomon's", reference: "Haggai 2:1-9" },
      { order: 4, title: "Third message: Holiness and blessing", description: "Uncleanness is contagious; now I bless", reference: "Haggai 2:10-19" },
      { order: 5, title: "Fourth message: Zerubbabel's signet", description: "Messianic promise to Davidic line", reference: "Haggai 2:20-23" },
    ],
    culturalNotes: [
      { category: "worship", title: "Misplaced priorities", content: "Haggai rebukes using cedar panels on own houses while God's house lay in ruins." },
      { category: "law", title: "Holiness transmission", content: "Holiness cannot be transmitted by touch; defilement can — a theological point about community." },
      { category: "customs", title: "Priestly rulings", content: "Haggai asks the priests legal questions as object lessons." },
      { category: "social", title: "Post-exilic discouragement", content: "The older returnees wept comparing the modest new temple to Solomon's." },
    ],
    didYouKnow: [
      "Haggai's four messages span only four months (Aug–Dec 520 BC).",
      "The temple was completed 4 years later, in 516 BC.",
      "Haggai 2:6-9 is quoted in Hebrews 12:26 about the final shaking.",
      "Zerubbabel as God's 'signet ring' reverses the curse on Jehoiachin (Jer 22:24).",
    ],
  },
];
