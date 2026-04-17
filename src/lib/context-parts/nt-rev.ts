import type { OTBookContext } from "../context-types";

export const CONTEXT_REV: OTBookContext[] = [
  {
    id: "REV",
    name: "Revelation",
    overview: {
      shortSummary: "The Lamb wins — a vision of God's ultimate victory over evil and the new creation.",
      fullSummary: "Revelation is John's apocalyptic vision given on Patmos, addressed to seven churches in Asia Minor. Using rich symbolic imagery drawn from Daniel, Ezekiel, and Isaiah, it depicts cosmic spiritual warfare, the judgment of Rome ('Babylon'), and the final triumph of Christ as King of kings. It ends with the new heaven, new earth, and New Jerusalem.",
      themes: ["Victory of the Lamb", "Judgment on evil", "Perseverance of the saints", "New creation", "Worship of God"],
      keyMessages: ["Worthy is the Lamb", "He who overcomes will inherit all this", "Behold, I am making all things new"],
    },
    author: { traditional: "John the Apostle", notes: "Written from exile on Patmos, c.AD 94-96 under Domitian." },
    timePeriod: { eventsDate: "c.AD 94-96", writingDate: "c.AD 94-96", biblicalPlacement: "Twenty-seventh NT book; last book of the Bible", relationToEvents: "Written during Domitian's persecution of Christians" },
    historicalSetting: {
      rulers: ["Domitian"],
      israelKings: [],
      neighboringPowers: ["Roman Empire"],
      politicalBackground: "Domitian demanded to be addressed as 'Lord and God.' Christians refusing to offer incense to his image faced death. Revelation is addressed to embattled believers across Asia Minor.",
    },
    mapLocations: [
      { name: "Patmos", type: "city", description: "Island of John's exile; where vision was received", svgX: 110, svgY: 155 },
      { name: "Ephesus", type: "city", description: "First of the seven churches", svgX: 112, svgY: 150 },
      { name: "Smyrna", type: "city", description: "Church of suffering; 'be faithful unto death'", svgX: 110, svgY: 147 },
      { name: "Pergamum", type: "city", description: "Where Satan's throne is", svgX: 108, svgY: 143 },
      { name: "Thyatira", type: "city", description: "Church tolerating Jezebel", svgX: 110, svgY: 145 },
      { name: "Sardis", type: "city", description: "The dead church", svgX: 112, svgY: 148 },
      { name: "Philadelphia", type: "city", description: "Open door church; commended", svgX: 114, svgY: 150 },
      { name: "Laodicea", type: "city", description: "The lukewarm church", svgX: 128, svgY: 153 },
    ],
    genealogy: {
      description: "Key figures in Revelation.",
      nodes: [
        { id: "godfather", name: "God the Father", notes: "The one on the throne; Alpha and Omega" },
        { id: "lamb", name: "The Lamb (Jesus)", parentId: "godfather", notes: "Worthy to open the seals" },
        { id: "john", name: "John the Apostle", notes: "Received the vision on Patmos" },
        { id: "babylon", name: "Babylon the Great", notes: "Rome; the harlot on seven hills" },
        { id: "beast", name: "The Beast", notes: "666; Roman imperial power" },
        { id: "bride", name: "The Bride (New Jerusalem)", notes: "The church; holy city descending" },
      ],
    },
    keyEvents: [
      { order: 1, title: "Vision of the risen Christ", description: "Eyes of fire; voice like many waters; seven stars", reference: "Revelation 1" },
      { order: 2, title: "Letters to the seven churches", description: "Commendations, rebukes, and calls to overcome", reference: "Revelation 2-3" },
      { order: 3, title: "Throne room vision", description: "Four living creatures; 24 elders; worthy is the Lamb", reference: "Revelation 4-5" },
      { order: 4, title: "Seven seals opened", description: "Four horsemen, martyrs, cosmic signs", reference: "Revelation 6-8" },
      { order: 5, title: "Seven trumpets", description: "Plagues on the earth; angel with the little scroll", reference: "Revelation 8-11" },
      { order: 6, title: "Woman, dragon, and beasts", description: "War in heaven; dragon wages war on the saints", reference: "Revelation 12-13" },
      { order: 7, title: "Seven bowls of wrath", description: "Final judgments poured out on the beast's kingdom", reference: "Revelation 15-16" },
      { order: 8, title: "Fall of Babylon", description: "Rome judged; merchants weep; heaven rejoices", reference: "Revelation 17-18" },
      { order: 9, title: "Marriage supper of the Lamb", description: "Christ returns as King of kings; beast defeated", reference: "Revelation 19" },
      { order: 10, title: "Thousand-year reign and final judgment", description: "Satan bound; white throne judgment", reference: "Revelation 20" },
      { order: 11, title: "New heaven and new earth", description: "Former things passed away; God dwells with man", reference: "Revelation 21-22" },
    ],
    culturalNotes: [
      { category: "worship", title: "Apocalyptic genre", content: "Apocalyptic literature used symbolic numbers and imagery as code — not literal, but deeply meaningful to its first readers." },
      { category: "social", title: "Emperor worship", content: "Refusal to offer incense to Domitian's image meant social exclusion, economic boycott, and potential death." },
      { category: "law", title: "666 — number of the beast", content: "In Greek and Hebrew, letters have numeric values (gematria). 666 likely encodes 'Nero Caesar' in Hebrew — a historical figure representing all imperial evil." },
      { category: "customs", title: "Seven churches", content: "These were real congregations on a Roman mail route; the letters were read aloud in each before passing on." },
    ],
    didYouKnow: [
      "Revelation is the most-quoted OT-saturated NT book — over 400 OT allusions with no direct quotes.",
      "The word 'Revelation' (apokalypsis) means 'unveiling' — not primarily about the future but about seeing reality clearly.",
      "The Lamb is mentioned 28 times in Revelation — the most dominant title for Jesus in the book.",
      "Revelation ends with the same garden imagery as Genesis begins — Scripture is a unified story.",
    ],
  },
];
