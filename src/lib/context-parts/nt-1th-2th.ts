import type { OTBookContext } from "../context-types";

export const CONTEXT_1TH_TO_2TH: OTBookContext[] = [
  {
    id: "1TH",
    name: "1 Thessalonians",
    overview: {
      shortSummary: "Paul encourages a young church facing persecution and teaches on Christ's return.",
      fullSummary: "1 Thessalonians is one of Paul's earliest letters. He had been forced out of Thessalonica and sent Timothy to check on the church. The letter commends their faith, addresses grief over Christians who died before Christ's return, and calls to holy living.",
      themes: ["Hope in Christ's return", "Holy living", "Encouragement under persecution", "The resurrection"],
      keyMessages: ["The Lord Himself will descend with a shout", "Encourage one another with these words", "Rejoice always, pray without ceasing, give thanks in all circumstances"],
    },
    author: { traditional: "Paul the Apostle", notes: "Written from Corinth, c.AD 50-51 — among Paul's earliest letters." },
    timePeriod: {
      eventsDate: "c.AD 50-51",
      writingDate: "c.AD 50-51",
      biblicalPlacement: "Thirteenth NT book; possibly Paul's earliest surviving letter",
      relationToEvents: "Written shortly after founding the church (Acts 17)",
    },
    historicalSetting: {
      rulers: ["Claudius Caesar"],
      israelKings: [],
      neighboringPowers: ["Roman Empire"],
      politicalBackground: "Thessalonica was the capital of Macedonia, on the Via Egnatia. Paul was expelled after a riot; Jewish opponents stirred trouble.",
    },
    mapLocations: [
      { name: "Thessalonica", type: "city", description: "Recipient church; capital of Macedonia", svgX: 110, svgY: 156 },
      { name: "Corinth", type: "city", description: "Where Paul wrote the letter", svgX: 102, svgY: 165 },
      { name: "Berea", type: "city", description: "Where Paul fled from Thessalonica", svgX: 108, svgY: 158 },
      { name: "Athens", type: "city", description: "Timothy sent back from here", svgX: 105, svgY: 168 },
    ],
    genealogy: {
      description: "Paul's team and the Thessalonian church.",
      nodes: [
        { id: "paul", name: "Paul" },
        { id: "silas", name: "Silas/Silvanus", notes: "Co-sender" },
        { id: "timothy", name: "Timothy", notes: "Co-sender; sent to check on church" },
        { id: "jason", name: "Jason", notes: "Hosted Paul in Thessalonica" },
      ],
    },
    keyEvents: [
      { order: 1, title: "Commendation of faith", description: "Your faith is known everywhere", reference: "1 Thessalonians 1" },
      { order: 2, title: "Paul's founding visit recalled", description: "Gentle as a nursing mother", reference: "1 Thessalonians 2" },
      { order: 3, title: "Timothy's good report", description: "Relief at their steadfastness", reference: "1 Thessalonians 3" },
      { order: 4, title: "Call to holy living", description: "Sexual purity; love one another", reference: "1 Thessalonians 4:1-12" },
      { order: 5, title: "The dead in Christ", description: "Those asleep will rise first", reference: "1 Thessalonians 4:13-18" },
      { order: 6, title: "Day of the Lord", description: "Comes like a thief in the night; children of light", reference: "1 Thessalonians 5" },
    ],
    culturalNotes: [
      { category: "customs", title: "Parousia", content: "Greek term for official royal visit; Paul uses it for Christ's return." },
      { category: "social", title: "Manual labor", content: "Paul worked with his hands to not burden the church — counter to cultural patron expectations." },
      { category: "worship", title: "Maranatha", content: "Earliest Christians prayed 'Come, Lord' — eschatological hope was central." },
      { category: "law", title: "Sexual ethics", content: "Thessalonica's pagan culture accepted promiscuity; Paul's call to holiness was radical." },
    ],
    didYouKnow: [
      "1 Thessalonians may be the oldest written document in the New Testament.",
      "Paul's description of the rapture (4:16-17) is the primary NT text on the topic.",
      "The Thessalonian church was founded on Paul's second missionary journey.",
      "Paul had to leave Thessalonica after only 3 weeks due to persecution.",
    ],
  },
  {
    id: "2TH",
    name: "2 Thessalonians",
    overview: {
      shortSummary: "Correcting false teaching about the Day of the Lord — it has not already come.",
      fullSummary: "Someone was circulating a letter claiming the Day of the Lord had already come. Paul corrects this, describes signs that must precede the end, rebukes idleness, and calls the church to stand firm.",
      themes: ["Correcting false eschatology", "Perseverance under persecution", "The man of lawlessness", "Work and discipline"],
      keyMessages: ["Stand firm and hold the traditions", "If anyone is not willing to work, let him not eat", "The Lord is faithful"],
    },
    author: { traditional: "Paul the Apostle", notes: "Written from Corinth, c.AD 51, shortly after 1 Thessalonians." },
    timePeriod: {
      eventsDate: "c.AD 51",
      writingDate: "c.AD 51",
      biblicalPlacement: "Fourteenth NT book",
      relationToEvents: "Written months after 1 Thessalonians to address new problems",
    },
    historicalSetting: {
      rulers: ["Claudius Caesar"],
      israelKings: [],
      neighboringPowers: ["Roman Empire"],
      politicalBackground: "A forged letter had been circulating; some believers had stopped working in expectation of the imminent end.",
    },
    mapLocations: [
      { name: "Thessalonica", type: "city", description: "Recipient church", svgX: 110, svgY: 156 },
      { name: "Corinth", type: "city", description: "Where Paul wrote", svgX: 102, svgY: 165 },
    ],
    genealogy: {
      description: "Same team as 1 Thessalonians.",
      nodes: [
        { id: "paul", name: "Paul" },
        { id: "silas", name: "Silvanus" },
        { id: "timothy", name: "Timothy" },
        { id: "lawless", name: "The Man of Lawlessness", notes: "Future figure to be revealed" },
      ],
    },
    keyEvents: [
      { order: 1, title: "Perseverance commended", description: "Faith growing; love increasing despite persecution", reference: "2 Thessalonians 1" },
      { order: 2, title: "Day of the Lord corrected", description: "Has not come yet; signs must come first", reference: "2 Thessalonians 2:1-3" },
      { order: 3, title: "Man of lawlessness", description: "Restrained now; will be revealed and destroyed", reference: "2 Thessalonians 2:3-12" },
      { order: 4, title: "Stand firm", description: "Hold to the traditions taught", reference: "2 Thessalonians 2:15" },
      { order: 5, title: "Work or don't eat", description: "Discipline for the idle", reference: "2 Thessalonians 3:10" },
    ],
    culturalNotes: [
      { category: "social", title: "Idleness (ataktos)", content: "Some believers quit work expecting the end; Paul commands orderly, productive living." },
      { category: "worship", title: "The restrainer", content: "Paul alludes to a restraining force holding back the man of lawlessness — much debated." },
      { category: "customs", title: "Forged letters", content: "Paul warns against forged letters using his name; authenticates this letter by his own signature." },
      { category: "law", title: "Already/not yet", content: "The tension between present and future fulfillment is central to NT eschatology." },
    ],
    didYouKnow: [
      "Paul hand-signs 2 Thessalonians to authenticate it against forgeries (3:17).",
      "The 'man of lawlessness' passage is one of the most debated in NT prophecy.",
      "The command 'if you won't work, you won't eat' was radical in a patron-client culture.",
      "Written within a year of 1 Thessalonians to the same church.",
    ],
  },
];
