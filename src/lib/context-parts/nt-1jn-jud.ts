import type { OTBookContext } from "../context-types";

export const CONTEXT_1JN_TO_JUD: OTBookContext[] = [
  {
    id: "1JN",
    name: "1 John",
    overview: {
      shortSummary: "Walking in light and love — tests of authentic faith and fellowship with God.",
      fullSummary: "1 John was written to combat early Gnostic teaching that denied Jesus came in the flesh. John gives three tests of genuine Christianity: doctrinal (confess the Son), moral (keep His commandments), and social (love one another). Assurance and love are central.",
      themes: ["Fellowship with God", "Love", "Assurance", "Truth vs. falsehood", "Light vs. darkness"],
      keyMessages: ["God is love", "We love because He first loved us", "These things I write that you may know you have eternal life"],
    },
    author: { traditional: "John the Apostle", notes: "Same author as the Gospel of John; written c.AD 85-95 from Ephesus." },
    timePeriod: { eventsDate: "c.AD 85-95", writingDate: "c.AD 85-95", biblicalPlacement: "Twenty-third NT book", relationToEvents: "Written late in John's life to combat proto-Gnostic error" },
    historicalSetting: {
      rulers: ["Domitian (or end of Nero's successors)"],
      israelKings: [],
      neighboringPowers: ["Roman Empire"],
      politicalBackground: "Docetists and proto-Gnostics were teaching that Christ only appeared to have a body — denying the Incarnation and its saving significance.",
    },
    mapLocations: [
      { name: "Ephesus", type: "city", description: "John's base in old age", svgX: 112, svgY: 150 },
    ],
    genealogy: {
      description: "The elder John and his community.",
      nodes: [
        { id: "john", name: "John the Apostle", notes: "The elder; beloved disciple" },
        { id: "antichrists", name: "The antichrists", notes: "Those who left; denied the Son" },
      ],
    },
    keyEvents: [
      { order: 1, title: "God is light", description: "Walk in the light; confess sin; cleansed by Christ", reference: "1 John 1" },
      { order: 2, title: "Do not love the world", description: "Lust of eyes, flesh, pride of life", reference: "1 John 2:15-17" },
      { order: 3, title: "Antichrists", description: "They went out from us — denied the Son", reference: "1 John 2:18-27" },
      { order: 4, title: "God is love", description: "He sent His Son as propitiation", reference: "1 John 4:8-10" },
      { order: 5, title: "Assurance of eternal life", description: "Written so you may know", reference: "1 John 5:13" },
      { order: 6, title: "Three witnesses", description: "Spirit, water, blood — reliable testimony", reference: "1 John 5:6-8" },
    ],
    culturalNotes: [
      { category: "worship", title: "Propitiation (hilasmos)", content: "Christ as the wrath-absorbing sacrifice — satisfying divine justice." },
      { category: "social", title: "Docetism", content: "Greek word for 'seem' — Jesus only seemed to have a body; dangerous heresy John combats." },
      { category: "law", title: "Three tests", content: "Doctrinal (believe in the Son), moral (keep commandments), social (love the brothers)." },
      { category: "customs", title: "Elder", content: "John as the aged apostle addressed smaller house churches under his care." },
    ],
    didYouKnow: [
      "1 John uses the word 'know' (ginosko) 25 times — assurance is his purpose.",
      "1 John 4:8 — 'God is love' — is one of the most profound theological statements in the Bible.",
      "The Johannine epistles likely circulated among house churches in the Ephesus region.",
      "The 'antichrists' were former church members — false teaching from within is the warning.",
    ],
  },
  {
    id: "2JN",
    name: "2 John",
    overview: {
      shortSummary: "A short letter warning against receiving false teachers into your home.",
      fullSummary: "2 John is addressed to 'the elect lady and her children' — likely a house church. It repeats the love command and warns: do not welcome teachers who deny Christ came in the flesh, lest you share in their evil work.",
      themes: ["Truth and love together", "Discernment", "Christian hospitality limits"],
      keyMessages: ["Walk in love", "Do not receive false teachers", "Anyone who does not abide in the teaching of Christ does not have God"],
    },
    author: { traditional: "John the Apostle (the Elder)", notes: "Same author as 1 John; written c.AD 85-95." },
    timePeriod: { eventsDate: "c.AD 85-95", writingDate: "c.AD 85-95", biblicalPlacement: "Twenty-fourth NT book; shortest NT book", relationToEvents: "Same setting as 1 John" },
    historicalSetting: {
      rulers: ["Domitian"],
      israelKings: [],
      neighboringPowers: ["Roman Empire"],
      politicalBackground: "Itinerant teachers traveled between house churches; hospitality was expected. False teachers exploited this system.",
    },
    mapLocations: [
      { name: "Ephesus region", type: "region", description: "Likely destination", svgX: 112, svgY: 150 },
    ],
    genealogy: {
      description: "The elder and his recipients.",
      nodes: [
        { id: "john", name: "The Elder (John)" },
        { id: "electlady", name: "Elect Lady", notes: "A house church or its leader" },
        { id: "electsister", name: "Elect Sister", notes: "Sending church (v.13)" },
      ],
    },
    keyEvents: [
      { order: 1, title: "Walk in love", description: "The old commandment — love one another", reference: "2 John 5-6" },
      { order: 2, title: "Warning against deceivers", description: "Who deny Jesus came in the flesh", reference: "2 John 7" },
      { order: 3, title: "Do not receive them", description: "Not even a greeting; sharing evil works", reference: "2 John 10-11" },
    ],
    culturalNotes: [
      { category: "customs", title: "Christian hospitality", content: "Traveling teachers depended on house church hospitality; John limits this to orthodox teachers." },
      { category: "worship", title: "Abide in the teaching", content: "Orthodoxy ('right teaching') is the condition for fellowship with God and the church." },
      { category: "social", title: "Greeting as endorsement", content: "In the ancient world, greeting a teacher publicly endorsed his message." },
      { category: "law", title: "Truth and love", content: "2 John insists these cannot be separated — love without truth enables error." },
    ],
    didYouKnow: [
      "2 John is only 13 verses — the shortest book in the NT.",
      "The 'elect lady' may be a metaphor for a congregation rather than a literal woman.",
      "John's refusal of hospitality to false teachers seems harsh but protects the whole church.",
      "2 and 3 John are the only NT letters written to specific individuals outside Paul's letters.",
    ],
  },
  {
    id: "3JN",
    name: "3 John",
    overview: {
      shortSummary: "Personal note commending Gaius and rebuking Diotrephes — church authority and hospitality.",
      fullSummary: "3 John is the most personal of John's letters. He commends Gaius for welcoming traveling missionaries, rebukes the domineering Diotrephes who refused to receive them, and commends Demetrius as a model of truth.",
      themes: ["Christian hospitality", "Church authority abused", "Truth walking", "Imitate good not evil"],
      keyMessages: ["Imitate what is good", "I have no greater joy than to hear my children walk in truth"],
    },
    author: { traditional: "John the Apostle (the Elder)", notes: "Same author; written c.AD 85-95." },
    timePeriod: { eventsDate: "c.AD 85-95", writingDate: "c.AD 85-95", biblicalPlacement: "Twenty-fifth NT book", relationToEvents: "Same setting as 1-2 John" },
    historicalSetting: {
      rulers: ["Domitian"],
      israelKings: [],
      neighboringPowers: ["Roman Empire"],
      politicalBackground: "A local church leader (Diotrephes) was accumulating power and refusing to recognize John's apostolic authority.",
    },
    mapLocations: [
      { name: "Ephesus region", type: "region", description: "Likely location of recipients", svgX: 112, svgY: 150 },
    ],
    genealogy: {
      description: "Three named individuals.",
      nodes: [
        { id: "john", name: "The Elder (John)" },
        { id: "gaius", name: "Gaius", notes: "Commended for hospitality and truth" },
        { id: "diotrephes", name: "Diotrephes", notes: "Loves preeminence; rebuked" },
        { id: "demetrius", name: "Demetrius", notes: "Good testimony from all" },
      ],
    },
    keyEvents: [
      { order: 1, title: "Gaius commended", description: "Walking in truth; caring for missionaries", reference: "3 John 1-8" },
      { order: 2, title: "Diotrephes rebuked", description: "Loves preeminence; refuses hospitality; gossips", reference: "3 John 9-10" },
      { order: 3, title: "Demetrius endorsed", description: "Well spoken of by all; by the truth itself", reference: "3 John 12" },
    ],
    culturalNotes: [
      { category: "social", title: "Diotrephes", content: "A model of church leadership gone wrong — using position for self-promotion." },
      { category: "customs", title: "Missionaries depending on hospitality", content: "NT missionaries went out 'for the sake of the Name, taking nothing from the Gentiles.'" },
      { category: "worship", title: "Walking in truth", content: "John's recurring phrase links doctrinal truth with practical life." },
      { category: "law", title: "Church discipline precedent", content: "John threatens to come and personally address Diotrephes' behavior." },
    ],
    didYouKnow: [
      "3 John is the only NT book that does not explicitly mention Jesus by name.",
      "Diotrephes is one of the few individuals in the NT criticized by name.",
      "Gaius is a common Roman name — there are four different Gaiuses in the NT.",
      "3 John gives a rare glimpse into the organizational tensions of early churches.",
    ],
  },
  {
    id: "JUD",
    name: "Jude",
    overview: {
      shortSummary: "Contend earnestly for the faith — a fierce warning against ungodly teachers.",
      fullSummary: "Jude, brother of James and Jesus, set out to write about salvation but was compelled to warn against false teachers who turned grace into a license for immorality. He draws on OT examples and Jewish tradition to argue that such people face certain judgment.",
      themes: ["Contending for the faith", "Judgment on ungodliness", "Mercy for doubters", "Keep yourselves in God's love"],
      keyMessages: ["Contend earnestly for the faith", "Keep yourselves in the love of God", "To Him who is able to keep you from stumbling"],
    },
    author: { traditional: "Jude, brother of James (and Jesus)", notes: "Humble — calls himself 'servant' not 'brother of Jesus.'" },
    timePeriod: { eventsDate: "c.AD 65-80", writingDate: "c.AD 65-80", biblicalPlacement: "Twenty-sixth NT book; last General Epistle", relationToEvents: "Likely after or near the time of 2 Peter" },
    historicalSetting: {
      rulers: ["Nero or Vespasian"],
      israelKings: [],
      neighboringPowers: ["Roman Empire"],
      politicalBackground: "Antinomian teachers (using grace as license for sin) were infiltrating churches claiming special revelations.",
    },
    mapLocations: [
      { name: "Palestine region", type: "region", description: "Likely audience in Judea or Syria", svgX: 162, svgY: 160 },
    ],
    genealogy: {
      description: "Jude's identity.",
      nodes: [
        { id: "joseph", name: "Joseph" },
        { id: "james", name: "James", parentId: "joseph" },
        { id: "jude", name: "Jude (Judas)", parentId: "joseph", notes: "Servant of Jesus Christ" },
        { id: "jesus", name: "Jesus", parentId: "joseph" },
      ],
    },
    keyEvents: [
      { order: 1, title: "Contend for the faith", description: "Once for all delivered to the saints", reference: "Jude 3" },
      { order: 2, title: "Three OT examples", description: "Egypt, fallen angels, Sodom — judgment is real", reference: "Jude 5-7" },
      { order: 3, title: "Three rebel types", description: "Way of Cain, error of Balaam, rebellion of Korah", reference: "Jude 11" },
      { order: 4, title: "Build yourself up", description: "Pray in the Spirit; keep yourselves in love", reference: "Jude 20-21" },
      { order: 5, title: "Doxology", description: "To Him who is able to keep you from stumbling — glory forever", reference: "Jude 24-25" },
    ],
    culturalNotes: [
      { category: "customs", title: "Enoch quoted", content: "Jude quotes 1 Enoch (a Jewish apocryphal book) — showing early Christians engaged Jewish tradition." },
      { category: "law", title: "Disputing over Moses' body", content: "Jude alludes to a tradition (from the Assumption of Moses) about Michael and Satan." },
      { category: "worship", title: "Love feast", content: "Jude mentions the 'agape feast' — early church shared meals alongside communion." },
      { category: "social", title: "Mercy and fire", content: "Jude calls for mercy toward doubters while 'hating the garment stained by the flesh.'" },
    ],
    didYouKnow: [
      "Jude 24-25 is one of the most beloved doxologies in all of Scripture.",
      "Jude shares nearly identical content with 2 Peter 2 — one likely used the other.",
      "Jude is only 25 verses — one of the shortest NT books.",
      "Jude quotes non-canonical Jewish texts, showing the NT authors engaged their full cultural world.",
    ],
  },
];
