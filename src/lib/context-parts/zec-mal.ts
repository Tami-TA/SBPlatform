import type { OTBookContext } from "../context-types";

export const CONTEXT_ZEC_TO_MAL: OTBookContext[] = [
  {
    id: "ZEC",
    name: "Zechariah",
    overview: {
      shortSummary: "Eight night visions, messianic oracles, and the coming King on a donkey.",
      fullSummary: "Zechariah, contemporary of Haggai, encouraged the returned exiles through eight visions, four messages, and two apocalyptic oracles. He prophesied extensively about the Messiah — His triumphal entry, betrayal for 30 silver, piercing, and ultimate reign.",
      themes: ["Messianic hope", "Restoration", "God's Spirit", "Holy war and peace"],
      keyMessages: ["Not by might nor by power, but by My Spirit", "Your king comes to you, lowly on a donkey", "They will look on Me whom they pierced"],
    },
    author: { traditional: "Zechariah son of Berechiah", notes: "Post-exilic prophet; some scholars see two authors for chs 1-8 and 9-14." },
    timePeriod: {
      eventsDate: "c.520-480 BC",
      writingDate: "c.518-480 BC",
      biblicalPlacement: "Minor Prophet; second longest",
      relationToEvents: "Contemporary with Ezra, Nehemiah, Esther",
    },
    historicalSetting: {
      rulers: ["Darius I", "Zerubbabel", "Joshua the high priest"],
      israelKings: [],
      neighboringPowers: ["Persia", "Greece (looming)"],
      politicalBackground: "Post-exilic community rebuilding under Persian rule; temple completed in 516 BC.",
    },
    mapLocations: [
      { name: "Jerusalem", type: "city", description: "Center of visions and prophecy", svgX: 160, svgY: 165 },
      { name: "Mount of Olives", type: "city", description: "Will split at the LORD's coming", svgX: 162, svgY: 165 },
      { name: "Valley of Megiddo", type: "battle", description: "Mourning scene", svgX: 157, svgY: 148 },
      { name: "Bethel", type: "city", description: "Delegation inquires about fasting", svgX: 162, svgY: 158 },
    ],
    genealogy: {
      description: "Prophetic lineage.",
      nodes: [
        { id: "iddo", name: "Iddo (prophet)" },
        { id: "berechiah", name: "Berechiah", parentId: "iddo" },
        { id: "zechariah", name: "Zechariah", parentId: "berechiah", notes: "Post-exilic prophet" },
      ],
    },
    keyEvents: [
      { order: 1, title: "Call to return to the LORD", description: "Do not be like your fathers", reference: "Zechariah 1:1-6" },
      { order: 2, title: "Eight night visions", description: "Horses, horns, measuring line, lampstand, flying scroll, and more", reference: "Zechariah 1-6" },
      { order: 3, title: "Joshua crowned", description: "Symbolic messianic crowning of high priest", reference: "Zechariah 6:9-15" },
      { order: 4, title: "True fasting", description: "Justice and mercy, not empty ritual", reference: "Zechariah 7-8" },
      { order: 5, title: "King on a donkey", description: "Humble Messiah enters Jerusalem", reference: "Zechariah 9:9" },
      { order: 6, title: "30 pieces of silver", description: "Shepherd's price; thrown into the house of the LORD", reference: "Zechariah 11:12-13" },
      { order: 7, title: "They will look on Me whom they pierced", description: "Mourning for the one killed", reference: "Zechariah 12:10" },
      { order: 8, title: "Fountain for sin and uncleanness", description: "Opened for David's house", reference: "Zechariah 13:1" },
      { order: 9, title: "LORD becomes king of all the earth", description: "Final battle and eternal reign", reference: "Zechariah 14" },
    ],
    culturalNotes: [
      { category: "worship", title: "Night visions", content: "Eight symbolic visions received in a single night." },
      { category: "customs", title: "Fasting questioned", content: "Post-exilic Jews fasted over the temple's destruction; God asks if they fasted for Him." },
      { category: "law", title: "Branch (Tsemach)", content: "Messianic title 'the Branch' runs through Zechariah." },
      { category: "social", title: "Apocalyptic imagery", content: "Zechariah bridges classical and apocalyptic prophecy, paving way for Revelation." },
    ],
    didYouKnow: [
      "Zechariah is quoted more in the Passion narratives than any other OT book.",
      "Matthew 21:5 (triumphal entry) and 27:9-10 (30 silver pieces) both come from Zechariah.",
      "John 19:37 ('they will look on Him whom they pierced') quotes Zechariah 12:10.",
      "Zechariah's father Berechiah was murdered in the temple (Matt 23:35).",
    ],
  },
  {
    id: "MAL",
    name: "Malachi",
    overview: {
      shortSummary: "Final OT prophet rebukes post-exilic apathy and promises Elijah before the Day of the LORD.",
      fullSummary: "Malachi (meaning 'my messenger') closes the OT with six disputation oracles rebuking corrupt priests, unfaithfulness in marriage and tithing, and spiritual coldness. He promises a coming messenger and the return of Elijah before the great Day of the LORD.",
      themes: ["Covenant faithfulness", "Priestly integrity", "Tithes and offerings", "Elijah's return"],
      keyMessages: ["I have loved you, says the LORD", "Bring the full tithe", "I will send Elijah before the great day"],
    },
    author: { traditional: "Malachi", notes: "Name means 'my messenger'; some think it is a title." },
    timePeriod: {
      eventsDate: "c.450-430 BC",
      writingDate: "c.445-430 BC",
      biblicalPlacement: "Last of the Minor Prophets; last book of the OT",
      relationToEvents: "Contemporary with Nehemiah's second visit",
    },
    historicalSetting: {
      rulers: ["Artaxerxes I (Persia)", "Nehemiah (governor)"],
      israelKings: [],
      neighboringPowers: ["Persia"],
      politicalBackground: "The early excitement of return had cooled. Temple worship was perfunctory; mixed marriages and divorce were widespread; tithes had stopped.",
    },
    mapLocations: [
      { name: "Jerusalem", type: "city", description: "Malachi's ministry base", svgX: 160, svgY: 165 },
      { name: "Temple Mount", type: "city", description: "Scene of corrupted worship", svgX: 160, svgY: 165 },
      { name: "Edom", type: "region", description: "Contrasted with Israel in opening oracle", svgX: 170, svgY: 185 },
    ],
    genealogy: {
      description: "No genealogy recorded.",
      nodes: [
        { id: "malachi", name: "Malachi", notes: "Final OT prophet" },
        { id: "messenger", name: "The Messenger", notes: "Promised forerunner — John the Baptist" },
        { id: "elijah", name: "Elijah (to come)", notes: "Fulfilled by John the Baptist (Luke 1:17)" },
      ],
    },
    keyEvents: [
      { order: 1, title: "God's love affirmed", description: "I have loved Jacob but Esau I have hated", reference: "Malachi 1:2-5" },
      { order: 2, title: "Corrupt priests rebuked", description: "Blemished sacrifices dishonor God", reference: "Malachi 1:6-2:9" },
      { order: 3, title: "Divorce condemned", description: "The LORD hates divorce", reference: "Malachi 2:13-16" },
      { order: 4, title: "My messenger promised", description: "Will prepare the way before Me", reference: "Malachi 3:1" },
      { order: 5, title: "Tithes and robbery", description: "Bring the full tithe into the storehouse", reference: "Malachi 3:10" },
      { order: 6, title: "Book of remembrance", description: "Those who feared the LORD recorded", reference: "Malachi 3:16" },
      { order: 7, title: "Elijah promised", description: "Before the great and dreadful day of the LORD", reference: "Malachi 4:5-6" },
    ],
    culturalNotes: [
      { category: "worship", title: "Disputation oracles", content: "Each oracle follows: God's statement → people's objection → God's answer." },
      { category: "law", title: "Tithing", content: "A tenth of agricultural produce and livestock belonged to the LORD." },
      { category: "social", title: "Mixed marriages", content: "Marrying foreign women who worshipped other gods undermined covenant community." },
      { category: "customs", title: "400 years of silence", content: "After Malachi, no canonical prophecy until John the Baptist — the inter-testamental period." },
    ],
    didYouKnow: [
      "Malachi is the last word of the OT; the NT opens with John the Baptist fulfilling its promise.",
      "Jesus identified John the Baptist as the promised Elijah (Matt 11:14).",
      "Malachi 3:1 is the OT's clearest promise of a forerunner for the Messiah.",
      "The 400 years between Malachi and Matthew are called the 'silent years.'",
    ],
  },
];
