import React, { useState, useMemo, useRef, useEffect } from "react";

/* ------------------------------------------------------------------ */
/*  Suites                                                             */
/* ------------------------------------------------------------------ */

const SUITES = [
  "Present tenses",
  "Past tenses",
  "Perfect tenses",
  "Future forms",
  "Modal verbs",
  "Conditionals & wish",
  "Passive voice",
  "Reported speech",
  "Articles & quantifiers",
  "Gerund vs infinitive",
  "Relative clauses",
  "Prepositions",
  "Comparison",
  "Questions & word order",
  "Linking & structure",
  "Perfect vs Past Simple",
  "Adjectives & adverbs",
  "Agreement & uncountables",
  "Determiners",
  "Causative & complex object",
];

/* ------------------------------------------------------------------ */
/*  Questions                                                          */
/* ------------------------------------------------------------------ */

const Q = [
  // 1. Present tenses
  { s: 0, lvl: "A2", t: "mc", q: "Water ______ at 100 degrees Celsius.", o: ["boil", "boils", "is boiling", "are boiling"], a: 1, note: "Постійний факт → Present Simple, 3-тя особа однини: boils." },
  { s: 0, lvl: "A2", t: "gap", q: "Be quiet! The baby ______ (sleep) in the next room.", accept: ["is sleeping", "'s sleeping"], show: "is sleeping", note: "Дія прямо зараз → Present Continuous: is sleeping." },
  { s: 0, lvl: "B1", t: "mc", q: "Look! That man ______ to open your car.", o: ["tries", "try", "is trying", "has tried"], a: 2, note: "Дія в момент мовлення → Present Continuous: is trying." },
  { s: 0, lvl: "B1", t: "gap", q: "Sorry, I ______ (not / understand) what you mean.", accept: ["don't understand", "do not understand", "dont understand"], show: "don't understand", note: "understand — стативне дієслово, не вживається в Continuous." },

  // 2. Past tenses
  { s: 1, lvl: "A2", t: "mc", q: "We ______ to the cinema last night.", o: ["go", "went", "have gone", "were going"], a: 1, note: "last night — завершений момент у минулому → Past Simple: went." },
  { s: 1, lvl: "A2", t: "gap", q: "She ______ (not / come) to the party yesterday.", accept: ["didn't come", "did not come", "didnt come"], show: "didn't come", note: "Заперечення в Past Simple: didn't + перша форма дієслова." },
  { s: 1, lvl: "B1", t: "mc", q: "While I ______ dinner, the phone rang.", o: ["cooked", "was cooking", "had cooked", "cook"], a: 1, note: "Довша фонова дія → Past Continuous, коротка дія → Past Simple." },
  { s: 1, lvl: "B1", t: "gap", q: "I ______ to play football every day when I was a child.", accept: ["used"], show: "used", note: "used to + інфінітив — регулярна звичка в минулому, якої вже немає." },

  // 3. Perfect tenses
  { s: 2, lvl: "B1", t: "mc", q: "I ______ my keys, so I can't open the door.", o: ["lost", "have lost", "had lost", "am losing"], a: 1, note: "Минула дія з результатом зараз → Present Perfect." },
  { s: 2, lvl: "B1", t: "gap", q: "She ______ (live) in this city since 2015.", accept: ["has lived", "'s lived", "has been living", "'s been living"], show: "has lived", note: "since + Present Perfect: дія почалася в минулому і триває." },
  { s: 2, lvl: "B2", t: "mc", q: "When we got to the platform, the train ______.", o: ["already left", "has already left", "had already left", "was already leaving"], a: 2, note: "Дія сталася раніше за іншу минулу дію → Past Perfect." },
  { s: 2, lvl: "B2", t: "gap", q: "I'm exhausted — I ______ (work) on this bug all morning.", accept: ["have been working", "'ve been working", "ve been working"], show: "have been working", note: "Тривалість до теперішнього моменту з видимим результатом → Present Perfect Continuous." },

  // 4. Future forms
  { s: 3, lvl: "A2", t: "mc", q: "Look at those clouds! It ______ rain.", o: ["will", "is going to", "goes to", "would"], a: 1, note: "Прогноз на основі того, що ми бачимо → be going to." },
  { s: 3, lvl: "B1", t: "gap", q: "I ______ (meet) the client at 4 p.m. tomorrow — it's already arranged.", accept: ["am meeting", "'m meeting", "m meeting", "am going to meet"], show: "am meeting", note: "Домовлена зустріч у майбутньому → Present Continuous." },
  { s: 3, lvl: "B1", t: "mc", q: "That bag looks heavy. Wait, I ______ help you.", o: ["will", "am going to", "am", "would"], a: 0, note: "Спонтанне рішення в момент мовлення → will." },
  { s: 3, lvl: "B2", t: "gap", q: "By this time next year I ______ (finish) the course.", accept: ["will have finished", "'ll have finished", "ll have finished"], show: "will have finished", note: "By + момент у майбутньому → Future Perfect." },

  // 5. Modal verbs
  { s: 4, lvl: "A2", t: "mc", q: "You ______ smoke here — it's strictly forbidden.", o: ["don't have to", "needn't", "mustn't", "didn't have to"], a: 2, note: "Заборона → mustn't. don't have to = «не обов'язково»." },
  { s: 4, lvl: "B1", t: "mc", q: "It's Sunday, so you ______ get up early.", o: ["mustn't", "don't have to", "can't", "shouldn't have"], a: 1, note: "Відсутність необхідності → don't have to." },
  { s: 4, lvl: "B2", t: "gap", q: "All the lights are off. They ______ (must / go) out.", accept: ["must have gone", "must've gone"], show: "must have gone", note: "Впевнене припущення про минуле → must have + V3." },
  { s: 4, lvl: "B2", t: "mc", q: "You ______ told me earlier — now it's too late to fix it.", o: ["should", "should have", "must have", "would"], a: 1, note: "Докір про минуле → should have + V3." },

  // 6. Conditionals & wish
  { s: 5, lvl: "B1", t: "mc", q: "If it ______ tomorrow, we'll stay at home.", o: ["will rain", "rains", "rained", "would rain"], a: 1, note: "First Conditional: if + Present Simple, will + інфінітив." },
  { s: 5, lvl: "B1", t: "gap", q: "If I ______ (be) you, I would accept the offer.", accept: ["were", "was"], show: "were", note: "Second Conditional: if I were you — стандартна порада." },
  { s: 5, lvl: "B2", t: "mc", q: "If she had studied harder, she ______ the exam.", o: ["would pass", "passed", "would have passed", "will pass"], a: 2, note: "Third Conditional: if + Past Perfect, would have + V3." },
  { s: 5, lvl: "B2", t: "gap", q: "I wish I ______ (can) speak German fluently.", accept: ["could"], show: "could", note: "Після wish дієслово зсувається в минуле: can → could." },

  // 7. Passive voice
  { s: 6, lvl: "A2", t: "mc", q: "This bridge ______ in 1890.", o: ["built", "was built", "has built", "is building"], a: 1, note: "Past Simple Passive: was/were + V3." },
  { s: 6, lvl: "B1", t: "gap", q: "The report ______ (send) to the client yesterday.", accept: ["was sent"], show: "was sent", note: "Пасив у минулому: was + sent." },
  { s: 6, lvl: "B2", t: "mc", q: "Don't worry, the bug ______ before the release.", o: ["will fix", "will be fixed", "is fixing", "would fix"], a: 1, note: "Future Passive: will be + V3." },
  { s: 6, lvl: "B2", t: "gap", q: "The new office ______ (build) at the moment.", accept: ["is being built"], show: "is being built", note: "Present Continuous Passive: is being + V3." },

  // 8. Reported speech
  { s: 7, lvl: "B1", t: "mc", q: "He said he ______ very tired.", o: ["is", "was", "has been", "will be"], a: 1, note: "Узгодження часів: is → was." },
  { s: 7, lvl: "B1", t: "gap", q: '"I\'ll call you tonight," she said. → She said she ______ call me that night.', accept: ["would"], show: "would", note: "will → would у непрямій мові." },
  { s: 7, lvl: "B2", t: "mc", q: "She asked me where ______.", o: ["did I live", "do I live", "I lived", "I live"], a: 2, note: "У непрямому питанні — прямий порядок слів, без допоміжного do." },
  { s: 7, lvl: "B2", t: "gap", q: "He told me ______ (not / worry) about the deadline.", accept: ["not to worry"], show: "not to worry", note: "tell somebody (not) to do — інфінітивна конструкція." },

  // 9. Articles & quantifiers
  { s: 8, lvl: "A2", t: "mc", q: "My sister is ______ engineer.", o: ["a", "an", "the", "—"], a: 1, note: "Перед голосним звуком — an." },
  { s: 8, lvl: "A2", t: "gap", q: "There isn't ______ milk left in the fridge.", accept: ["any"], show: "any", note: "У заперечних реченнях — any, не some." },
  { s: 8, lvl: "B1", t: "mc", q: "I don't have ______ free time this week.", o: ["many", "much", "a few", "a lot"], a: 1, note: "time — незлічуване → much." },
  { s: 8, lvl: "B1", t: "gap", q: "She plays ______ piano really well.", accept: ["the"], show: "the", note: "Музичні інструменти вживаються з the." },

  // 10. Gerund vs infinitive
  { s: 9, lvl: "B1", t: "mc", q: "I really enjoy ______ new testing tools.", o: ["to learn", "learning", "learn", "learned"], a: 1, note: "Після enjoy завжди -ing." },
  { s: 9, lvl: "B1", t: "gap", q: "We decided ______ (change) the framework.", accept: ["to change"], show: "to change", note: "Після decide — інфінітив з to." },
  { s: 9, lvl: "B2", t: "mc", q: "He stopped ______ coffee because of his health.", o: ["to drink", "drinking", "drink", "drunk"], a: 1, note: "stop doing = припинити дію; stop to do = зупинитися, щоб зробити." },
  { s: 9, lvl: "B2", t: "gap", q: "I look forward to ______ (hear) from you.", accept: ["hearing"], show: "hearing", note: "look forward to — тут to є прийменником, далі -ing." },

  // 11. Relative clauses
  { s: 10, lvl: "A2", t: "mc", q: "That's the woman ______ helped me yesterday.", o: ["which", "what", "who", "whose"], a: 2, note: "Про людину — who." },
  { s: 10, lvl: "B1", t: "gap", q: "This is the laptop ______ I bought last year.", accept: ["that", "which"], show: "that", note: "Про річ — that або which." },
  { s: 10, lvl: "B2", t: "mc", q: "My brother, ______ lives in Kyiv, is a doctor.", o: ["that", "who", "which", "what"], a: 1, note: "У неозначальному підрядному (з комами) that не вживається." },
  { s: 10, lvl: "B2", t: "gap", q: "The engineer ______ code we reviewed has left the company.", accept: ["whose"], show: "whose", note: "Належність → whose." },

  // 12. Prepositions
  { s: 11, lvl: "A2", t: "mc", q: "The meeting is ______ Monday ______ 10 a.m.", o: ["in / on", "on / at", "at / in", "on / in"], a: 1, note: "on + день тижня, at + точний час." },
  { s: 11, lvl: "A2", t: "gap", q: "I've worked in this company ______ 2019.", accept: ["since"], show: "since", note: "since + точка в часі, for + тривалість." },
  { s: 11, lvl: "B1", t: "gap", q: "She's really good ______ solving complex problems.", accept: ["at"], show: "at", note: "Стійке сполучення: good at something." },
  { s: 11, lvl: "B2", t: "mc", q: "We need to focus ______ the main issue first.", o: ["at", "on", "in", "to"], a: 1, note: "focus on — фіксований прийменник." },

  // 13. Comparison
  { s: 12, lvl: "A2", t: "mc", q: "This test is ______ than the last one.", o: ["more easy", "easier", "easiest", "the easier"], a: 1, note: "Короткі прикметники: -er, без more." },
  { s: 12, lvl: "A2", t: "gap", q: "He is the ______ (good) developer in the team.", accept: ["best"], show: "best", note: "Неправильний ступінь: good – better – best." },
  { s: 12, lvl: "B1", t: "gap", q: "My new phone is as fast ______ my old one.", accept: ["as"], show: "as", note: "Конструкція рівності: as + прикметник + as." },
  { s: 12, lvl: "B2", t: "mc", q: "The more you practise, ______.", o: ["better you speak", "the better you speak", "you speak better", "the best you speak"], a: 1, note: "Подвійний порівняльний: the more… the better…" },

  // 14. Questions & word order
  { s: 13, lvl: "A2", t: "mc", q: "______ she work at the weekend?", o: ["Do", "Does", "Is", "Has"], a: 1, note: "Present Simple, 3-тя особа → Does + інфінітив." },
  { s: 13, lvl: "A2", t: "gap", q: "Where ______ you go last summer?", accept: ["did"], show: "did", note: "Питання в Past Simple: did + перша форма." },
  { s: 13, lvl: "B1", t: "mc", q: "Do you know where ______?", o: ["is the station", "the station is", "does the station be", "is station"], a: 1, note: "Вбудоване питання — прямий порядок слів." },
  { s: 13, lvl: "B2", t: "gap", q: "You're coming to the demo tonight, ______ ______? (2 слова)", accept: ["aren't you", "are not you", "arent you"], show: "aren't you", note: "Розділове питання: стверджувальне речення → заперечний хвостик." },

  // 15. Linking & structure
  { s: 14, lvl: "B1", t: "mc", q: "______ it was raining, we went for a walk.", o: ["Because", "So", "Although", "However"], a: 2, note: "Although + підрядне речення; However — окреме речення з комою." },
  { s: 14, lvl: "B1", t: "gap", q: "It was ______ a difficult task that nobody finished it.", accept: ["such"], show: "such", note: "such + a + прикметник + іменник; so + прикметник без іменника." },
  { s: 14, lvl: "B2", t: "mc", q: "He isn't experienced ______ to lead the team.", o: ["too", "enough", "so", "such"], a: 1, note: "enough стоїть після прикметника: experienced enough." },
  { s: 14, lvl: "B2", t: "gap", q: "I was really tired. ______, I finished the report on time.", accept: ["however", "nevertheless", "nonetheless", "still"], show: "However", note: "Контраст між двома реченнями → However + кома." },
];

/* ------------------------------------------------------------------ */
/*  Extra pool — 2 more per suite/level/type slot                      */
/* ------------------------------------------------------------------ */

const Q2 = [
  // 1. Present tenses
  { s: 0, lvl: "A2", t: "mc", q: "My brother ______ in a bank.", o: ["work", "works", "working", "is work"], a: 1, note: "Present Simple, 3-тя особа однини: works." },
  { s: 0, lvl: "A2", t: "mc", q: "They usually ______ lunch at one o'clock.", o: ["has", "is having", "have", "having"], a: 2, note: "they → have, без -s." },
  { s: 0, lvl: "A2", t: "gap", q: "Listen! Someone ______ (knock) at the door.", accept: ["is knocking", "'s knocking"], show: "is knocking", note: "Listen! — сигнал дії прямо зараз → Present Continuous." },
  { s: 0, lvl: "A2", t: "gap", q: "She ______ (go) to the gym every Saturday.", accept: ["goes"], show: "goes", note: "Регулярна дія → Present Simple; go → goes." },
  { s: 0, lvl: "B1", t: "mc", q: "I ______ a book about testing at the moment.", o: ["read", "am reading", "reads", "have read"], a: 1, note: "at the moment → Present Continuous." },
  { s: 0, lvl: "B1", t: "mc", q: "How often ______ your team release to production?", o: ["is", "does", "do", "are"], a: 1, note: "team як одне ціле → does." },
  { s: 0, lvl: "B1", t: "gap", q: "This bug ______ (not / happen) very often.", accept: ["doesn't happen", "does not happen", "doesnt happen"], show: "doesn't happen", note: "Заперечення в Present Simple: doesn't + інфінітив." },
  { s: 0, lvl: "B1", t: "gap", q: "I ______ (think) your idea is excellent.", accept: ["think"], show: "think", note: "think у значенні «вважаю» — стативне, без Continuous." },

  // 2. Past tenses
  { s: 1, lvl: "A2", t: "mc", q: "She ______ born in 1995.", o: ["is", "was", "were", "has been"], a: 1, note: "be born у минулому: was/were born." },
  { s: 1, lvl: "A2", t: "mc", q: "I ______ my homework yesterday evening.", o: ["do", "did", "have done", "was doing"], a: 1, note: "yesterday → Past Simple." },
  { s: 1, lvl: "A2", t: "gap", q: "We ______ (be) at the office last Friday.", accept: ["were"], show: "were", note: "we → were." },
  { s: 1, lvl: "A2", t: "gap", q: "He ______ (buy) a new car two weeks ago.", accept: ["bought"], show: "bought", note: "ago → Past Simple; buy → bought." },
  { s: 1, lvl: "B1", t: "mc", q: "The sun ______ when we arrived at the beach.", o: ["shone", "was shining", "has shone", "had shone"], a: 1, note: "Фонова обставина → Past Continuous." },
  { s: 1, lvl: "B1", t: "mc", q: "I ______ TV when the power went off.", o: ["watched", "was watching", "had watched", "watch"], a: 1, note: "Тривала дія, перервана короткою → Past Continuous." },
  { s: 1, lvl: "B1", t: "gap", q: "There ______ to be a small café here, but they closed it.", accept: ["used"], show: "used", note: "used to — стан у минулому, якого вже немає." },
  { s: 1, lvl: "B1", t: "gap", q: "While she ______ (drive) home, she saw an accident.", accept: ["was driving"], show: "was driving", note: "While + Past Continuous." },

  // 3. Perfect tenses
  { s: 2, lvl: "B1", t: "mc", q: "I've known him ______ five years.", o: ["since", "for", "from", "during"], a: 1, note: "for + тривалість, since + точка старту." },
  { s: 2, lvl: "B1", t: "mc", q: "______ you ever ______ to London?", o: ["Did / go", "Have / been", "Have / gone", "Are / been"], a: 1, note: "Досвід життя → Have you ever been…? (been = був і повернувся)." },
  { s: 2, lvl: "B1", t: "gap", q: "We ______ (not / finish) the regression yet.", accept: ["haven't finished", "have not finished", "havent finished"], show: "haven't finished", note: "yet → Present Perfect у запереченні." },
  { s: 2, lvl: "B1", t: "gap", q: "She ______ (just / send) the report.", accept: ["has just sent", "'s just sent", "s just sent"], show: "has just sent", note: "just стоїть між has і V3." },
  { s: 2, lvl: "B2", t: "mc", q: "He told me he ______ the film before.", o: ["saw", "has seen", "had seen", "was seeing"], a: 2, note: "Дія до іншої минулої дії → Past Perfect." },
  { s: 2, lvl: "B2", t: "mc", q: "By 2020 they ______ three offices in Europe.", o: ["opened", "have opened", "had opened", "were opening"], a: 2, note: "By + минулий рік → Past Perfect." },
  { s: 2, lvl: "B2", t: "gap", q: "Her eyes are red — she ______ (cry).", accept: ["has been crying", "'s been crying", "s been crying"], show: "has been crying", note: "Видимий результат недавньої тривалої дії → Present Perfect Continuous." },
  { s: 2, lvl: "B2", t: "gap", q: "I ______ (study) English for six months before I moved here.", accept: ["had been studying", "had studied", "'d been studying", "'d studied"], show: "had been studying", note: "Тривалість до моменту в минулому → Past Perfect (Continuous)." },

  // 4. Future forms
  { s: 3, lvl: "A2", t: "mc", q: "I think it ______ be cold tomorrow.", o: ["is going to", "will", "is", "would"], a: 1, note: "Після I think — прогноз-думка → will." },
  { s: 3, lvl: "A2", t: "mc", q: "We ______ visit my parents next weekend — we've already booked the tickets.", o: ["will", "are going to", "would", "are"], a: 1, note: "Заздалегідь запланований намір → be going to." },
  { s: 3, lvl: "B1", t: "mc", q: "It's freezing outside. I think I ______ take a taxi.", o: ["am going to", "'ll", "am", "would"], a: 1, note: "Рішення в момент мовлення → will." },
  { s: 3, lvl: "B1", t: "mc", q: "A: The phone's ringing. B: OK, I ______ it.", o: ["'ll answer", "am answering", "answer", "am going to answer"], a: 0, note: "Миттєва реакція → will." },
  { s: 3, lvl: "B1", t: "gap", q: "I ______ (fly) to Berlin on Monday — the tickets are booked.", accept: ["am flying", "'m flying", "m flying", "am going to fly"], show: "am flying", note: "Тверда домовленість → Present Continuous." },
  { s: 3, lvl: "B1", t: "gap", q: "She ______ (start) a new job next month; everything is agreed.", accept: ["is starting", "'s starting", "s starting", "is going to start"], show: "is starting", note: "Домовлений план → Present Continuous." },
  { s: 3, lvl: "B2", t: "gap", q: "This time tomorrow I ______ (fly) to Warsaw.", accept: ["will be flying", "'ll be flying", "ll be flying"], show: "will be flying", note: "Процес у конкретний момент майбутнього → Future Continuous." },
  { s: 3, lvl: "B2", t: "gap", q: "By the end of the sprint we ______ (close) all the tickets.", accept: ["will have closed", "'ll have closed", "ll have closed"], show: "will have closed", note: "By the end of… → Future Perfect." },

  // 5. Modal verbs
  { s: 4, lvl: "A2", t: "mc", q: "______ I use your laptop for a minute?", o: ["Must", "Can", "Should have", "Am"], a: 1, note: "Прохання про дозвіл → Can I…?" },
  { s: 4, lvl: "A2", t: "mc", q: "You ______ wear a helmet on site — it's a rule.", o: ["can", "must", "might", "would"], a: 1, note: "Сувора вимога → must." },
  { s: 4, lvl: "B1", t: "mc", q: "You ______ book a table — the place is never full.", o: ["mustn't", "don't need to", "can't", "shouldn't have"], a: 1, note: "Немає потреби → don't need to." },
  { s: 4, lvl: "B1", t: "mc", q: "He ______ be at work — I've just seen his car outside.", o: ["must", "can't", "needn't", "would"], a: 0, note: "Упевнене припущення про теперішнє → must." },
  { s: 4, lvl: "B2", t: "mc", q: "He ______ have passed the exam — he didn't even open the book.", o: ["can't", "mustn't", "shouldn't", "needn't"], a: 0, note: "Упевненість, що це неможливо → can't have + V3." },
  { s: 4, lvl: "B2", t: "mc", q: "We ______ have taken a taxi — the bus was completely empty.", o: ["needn't", "mustn't", "can't", "shouldn't"], a: 0, note: "needn't have + V3 — зробили те, що було зайвим." },
  { s: 4, lvl: "B2", t: "gap", q: "She isn't answering. She ______ (may / leave) already.", accept: ["may have left", "might have left", "must have left"], show: "may have left", note: "Припущення про минуле → may/might have + V3." },
  { s: 4, lvl: "B2", t: "gap", q: "I can't find my badge. I ______ (must / drop) it somewhere.", accept: ["must have dropped", "must've dropped"], show: "must have dropped", note: "Логічний висновок про минуле → must have + V3." },

  // 6. Conditionals & wish
  { s: 5, lvl: "B1", t: "mc", q: "If you heat ice, it ______.", o: ["melts", "will melt", "melted", "would melt"], a: 0, note: "Zero Conditional: обидві частини в Present Simple." },
  { s: 5, lvl: "B1", t: "mc", q: "I'll call you when I ______ home.", o: ["will get", "get", "got", "would get"], a: 1, note: "Після when/if про майбутнє — теперішній час, без will." },
  { s: 5, lvl: "B1", t: "gap", q: "If we ______ (leave) now, we'll catch the train.", accept: ["leave"], show: "leave", note: "First Conditional: if + Present Simple." },
  { s: 5, lvl: "B1", t: "gap", q: "She would travel more if she ______ (have) more free time.", accept: ["had"], show: "had", note: "Second Conditional: if + Past Simple, would + інфінітив." },
  { s: 5, lvl: "B2", t: "mc", q: "If I hadn't missed the bus, I ______ late.", o: ["wouldn't be", "wouldn't have been", "won't be", "hadn't been"], a: 1, note: "Third Conditional: would have + V3." },
  { s: 5, lvl: "B2", t: "mc", q: "I wish I ______ that email yesterday.", o: ["didn't send", "hadn't sent", "wouldn't send", "haven't sent"], a: 1, note: "Жаль про минуле → wish + Past Perfect." },
  { s: 5, lvl: "B2", t: "gap", q: "If I ______ (know) about the meeting, I would have joined.", accept: ["had known", "'d known", "d known"], show: "had known", note: "Third Conditional: if + Past Perfect." },
  { s: 5, lvl: "B2", t: "gap", q: "I wish it ______ (stop) raining — I want to go out.", accept: ["would stop"], show: "would stop", note: "Роздратування чужою/зовнішньою дією → wish + would." },

  // 7. Passive voice
  { s: 6, lvl: "A2", t: "mc", q: "English ______ all over the world.", o: ["speaks", "is spoken", "spoken", "is speaking"], a: 1, note: "Present Simple Passive: is/are + V3." },
  { s: 6, lvl: "A2", t: "mc", q: "These phones ______ in China.", o: ["make", "are made", "is made", "made"], a: 1, note: "these phones → are made." },
  { s: 6, lvl: "B1", t: "gap", q: "The tests ______ (run) automatically every night.", accept: ["are run"], show: "are run", note: "Present Simple Passive; run має однакову форму V1 і V3." },
  { s: 6, lvl: "B1", t: "gap", q: "My car ______ (steal) last week.", accept: ["was stolen"], show: "was stolen", note: "Past Simple Passive: was + stolen." },
  { s: 6, lvl: "B2", t: "mc", q: "The bug ______ already ______ when I opened the ticket.", o: ["has / fixed", "had / been fixed", "was / fixing", "had / fixed"], a: 1, note: "Past Perfect Passive: had been + V3." },
  { s: 6, lvl: "B2", t: "mc", q: "Nothing ______ about the problem so far.", o: ["has been done", "has done", "was doing", "is doing"], a: 0, note: "Present Perfect Passive: has been + V3." },
  { s: 6, lvl: "B2", t: "gap", q: "The documents ______ (check) right now.", accept: ["are being checked"], show: "are being checked", note: "Present Continuous Passive: are being + V3." },
  { s: 6, lvl: "B2", t: "gap", q: "The results ______ (announce) tomorrow.", accept: ["will be announced"], show: "will be announced", note: "Future Simple Passive: will be + V3." },

  // 8. Reported speech
  { s: 7, lvl: "B1", t: "mc", q: "She said she ______ the file the day before.", o: ["sends", "sent", "had sent", "has sent"], a: 2, note: "the day before → зсув у Past Perfect." },
  { s: 7, lvl: "B1", t: "mc", q: "Tom said he ______ come to the meeting the next day.", o: ["will", "would", "can", "is going"], a: 1, note: "will → would." },
  { s: 7, lvl: "B1", t: "gap", q: "\"I'm working late,\" he said. → He said he ______ working late.", accept: ["was"], show: "was", note: "am/is → was." },
  { s: 7, lvl: "B1", t: "gap", q: "\"We have finished,\" they said. → They said they ______ finished.", accept: ["had", "'d", "d"], show: "had", note: "have finished → had finished." },
  { s: 7, lvl: "B2", t: "mc", q: "He asked me if I ______ the documentation.", o: ["have read", "had read", "did read", "was read"], a: 1, note: "Present Perfect → Past Perfect у непрямій мові." },
  { s: 7, lvl: "B2", t: "mc", q: "She asked me ______ I could help her.", o: ["that", "if", "what", "did"], a: 1, note: "Непряме загальне питання вводиться через if/whether." },
  { s: 7, lvl: "B2", t: "gap", q: "\"Please send the report,\" she said. → She asked me ______ (send) the report.", accept: ["to send"], show: "to send", note: "Прохання → ask somebody to do." },
  { s: 7, lvl: "B2", t: "gap", q: "\"Don't touch that,\" he said. → He warned me ______ (not / touch) it.", accept: ["not to touch"], show: "not to touch", note: "Заперечна форма: not to + інфінітив." },

  // 9. Articles & quantifiers
  { s: 8, lvl: "A2", t: "mc", q: "I bought ______ umbrella yesterday.", o: ["a", "an", "the", "—"], a: 1, note: "Перед голосним звуком — an." },
  { s: 8, lvl: "A2", t: "mc", q: "We had ______ dinner at seven.", o: ["a", "an", "the", "—"], a: 3, note: "Назви прийомів їжі вживаються без артикля." },
  { s: 8, lvl: "A2", t: "gap", q: "Would you like ______ tea?", accept: ["some"], show: "some", note: "У пропозиціях і проханнях вживаємо some, а не any." },
  { s: 8, lvl: "A2", t: "gap", q: "How ______ people were there at the demo?", accept: ["many"], show: "many", note: "people — злічуване → many." },
  { s: 8, lvl: "B1", t: "mc", q: "There are ______ good restaurants near the office.", o: ["much", "a little", "a few", "less"], a: 2, note: "Злічуване в множині → a few." },
  { s: 8, lvl: "B1", t: "mc", q: "He speaks ______ English, but not much.", o: ["a little", "a few", "many", "little"], a: 0, note: "a little = трохи (позитивно); little = майже нічого." },
  { s: 8, lvl: "B1", t: "gap", q: "I live in ______ small village near Cherkasy.", accept: ["a"], show: "a", note: "Перша згадка злічуваного в однині → a." },
  { s: 8, lvl: "B1", t: "gap", q: "She's ______ best tester I've ever worked with.", accept: ["the"], show: "the", note: "Найвищий ступінь завжди з the." },

  // 10. Gerund vs infinitive
  { s: 9, lvl: "B1", t: "mc", q: "Would you mind ______ the door?", o: ["to close", "closing", "close", "closed"], a: 1, note: "Після mind — герундій." },
  { s: 9, lvl: "B1", t: "mc", q: "He promised ______ the task today.", o: ["finishing", "to finish", "finish", "finished"], a: 1, note: "Після promise — інфінітив з to." },
  { s: 9, lvl: "B1", t: "gap", q: "I don't mind ______ (work) late sometimes.", accept: ["working"], show: "working", note: "mind + -ing." },
  { s: 9, lvl: "B1", t: "gap", q: "She refused ______ (answer) the question.", accept: ["to answer"], show: "to answer", note: "refuse + to + інфінітив." },
  { s: 9, lvl: "B2", t: "mc", q: "I remember ______ this bug last year — we fixed it back then.", o: ["to report", "reporting", "report", "reported"], a: 1, note: "remember doing = пам'ятати про зроблене; remember to do = не забути зробити." },
  { s: 9, lvl: "B2", t: "mc", q: "Let me ______ you one more question.", o: ["to ask", "asking", "ask", "asked"], a: 2, note: "Після let — інфінітив без to." },
  { s: 9, lvl: "B2", t: "gap", q: "I'm used to ______ (work) remotely.", accept: ["working"], show: "working", note: "be used to — to тут прийменник, далі -ing." },
  { s: 9, lvl: "B2", t: "gap", q: "The manager made me ______ (repeat) the whole test run.", accept: ["repeat"], show: "repeat", note: "make somebody do — без to." },

  // 11. Relative clauses
  { s: 10, lvl: "A2", t: "mc", q: "The book ______ I'm reading is really good.", o: ["who", "which", "whose", "where"], a: 1, note: "Про річ — which або that." },
  { s: 10, lvl: "A2", t: "mc", q: "That's the office ______ I work.", o: ["which", "that", "where", "who"], a: 2, note: "Місце → where." },
  { s: 10, lvl: "B1", t: "gap", q: "Do you know the guy ______ is talking to the manager?", accept: ["who", "that"], show: "who", note: "Підмет-людина → who/that." },
  { s: 10, lvl: "B1", t: "gap", q: "I remember the day ______ we launched the product.", accept: ["when", "that"], show: "when", note: "Час → when." },
  { s: 10, lvl: "B2", t: "mc", q: "The report, ______ was forty pages long, took a week to write.", o: ["that", "which", "who", "what"], a: 1, note: "У неозначальному підрядному з комами — which, ніколи that." },
  { s: 10, lvl: "B2", t: "mc", q: "He said nothing at all, ______ surprised everyone.", o: ["what", "which", "that", "who"], a: 1, note: "which може стосуватися всього попереднього речення." },
  { s: 10, lvl: "B2", t: "gap", q: "This is the client ______ project we're testing.", accept: ["whose"], show: "whose", note: "Належність → whose." },
  { s: 10, lvl: "B2", t: "gap", q: "The reason ______ he left the team is still unclear.", accept: ["why", "that"], show: "why", note: "Причина → why." },

  // 12. Prepositions
  { s: 11, lvl: "A2", t: "mc", q: "The shop opens ______ 9 a.m. ______ Saturdays.", o: ["at / on", "on / at", "in / on", "at / in"], a: 0, note: "at + точний час, on + день." },
  { s: 11, lvl: "A2", t: "mc", q: "She lives ______ Kyiv, ______ Ukraine.", o: ["at / in", "in / in", "in / at", "on / in"], a: 1, note: "in + місто, in + країна." },
  { s: 11, lvl: "A2", t: "gap", q: "I'll be back ______ ten minutes.", accept: ["in"], show: "in", note: "in + період часу для майбутнього." },
  { s: 11, lvl: "A2", t: "gap", q: "We've been friends ______ ten years.", accept: ["for"], show: "for", note: "for + тривалість." },
  { s: 11, lvl: "B1", t: "gap", q: "She's married ______ a doctor.", accept: ["to"], show: "to", note: "married to somebody — фіксований прийменник." },
  { s: 11, lvl: "B1", t: "gap", q: "Congratulations ______ your new job!", accept: ["on"], show: "on", note: "congratulations on something." },
  { s: 11, lvl: "B2", t: "mc", q: "The result depends ______ the test environment.", o: ["from", "on", "of", "at"], a: 1, note: "depend on — не «depend from»." },
  { s: 11, lvl: "B2", t: "mc", q: "I'm not very keen ______ working at weekends.", o: ["in", "on", "at", "with"], a: 1, note: "keen on something." },

  // 13. Comparison
  { s: 12, lvl: "A2", t: "mc", q: "This is the ______ film I've ever seen.", o: ["worse", "worst", "baddest", "more bad"], a: 1, note: "bad – worse – worst." },
  { s: 12, lvl: "A2", t: "mc", q: "Kyiv is ______ than Cherkasy.", o: ["more big", "bigger", "biggest", "the bigger"], a: 1, note: "Короткий прикметник → подвоєння приголосної + -er." },
  { s: 12, lvl: "A2", t: "gap", q: "Playwright runs ______ (fast) than Selenium in our setup.", accept: ["faster"], show: "faster", note: "Односкладове слово → -er." },
  { s: 12, lvl: "A2", t: "gap", q: "This is the ______ (interesting) project in the company.", accept: ["most interesting"], show: "most interesting", note: "Довгий прикметник → the most + прикметник." },
  { s: 12, lvl: "B1", t: "gap", q: "This bug is not ______ serious as the last one.", accept: ["as", "so"], show: "as", note: "not as/so + прикметник + as." },
  { s: 12, lvl: "B1", t: "gap", q: "The more tests we write, ______ safer the release becomes.", accept: ["the"], show: "the", note: "Обидві частини конструкції починаються з the." },
  { s: 12, lvl: "B2", t: "mc", q: "It was ______ difficult exam I had ever taken.", o: ["the more", "the most", "most", "more"], a: 1, note: "Найвищий ступінь → the most." },
  { s: 12, lvl: "B2", t: "mc", q: "She earns twice ______ much as I do.", o: ["so", "as", "more", "than"], a: 1, note: "twice as much as — фіксована конструкція." },

  // 14. Questions & word order
  { s: 13, lvl: "A2", t: "mc", q: "How ______ does the course cost?", o: ["many", "much", "long", "often"], a: 1, note: "Про ціну — how much." },
  { s: 13, lvl: "A2", t: "mc", q: "Where ______ your parents live?", o: ["does", "do", "is", "are"], a: 1, note: "parents — множина → do." },
  { s: 13, lvl: "A2", t: "gap", q: "______ old are you?", accept: ["how"], show: "How", note: "How old…? — стандартне питання про вік." },
  { s: 13, lvl: "A2", t: "gap", q: "What time ______ the meeting start?", accept: ["does"], show: "does", note: "Present Simple, 3-тя особа → does + інфінітив." },
  { s: 13, lvl: "B1", t: "mc", q: "I ______ my email first thing in the morning.", o: ["check usually", "usually check", "am checking usually", "usually am checking"], a: 1, note: "Прислівник частотності стоїть перед смисловим дієсловом." },
  { s: 13, lvl: "B1", t: "mc", q: "Could you tell me what time ______?", o: ["does it start", "it starts", "is it start", "start it"], a: 1, note: "Вбудоване питання — прямий порядок слів." },
  { s: 13, lvl: "B2", t: "gap", q: "She's never late, ______ ______? (2 слова)", accept: ["is she"], show: "is she", note: "never робить речення заперечним → стверджувальний хвостик." },
  { s: 13, lvl: "B2", t: "gap", q: "Let's take a short break, ______ ______? (2 слова)", accept: ["shall we"], show: "shall we", note: "Після Let's хвостик завжди shall we." },

  // 15. Linking & structure
  { s: 14, lvl: "B1", t: "mc", q: "We stayed at home ______ the bad weather.", o: ["because", "because of", "although", "so"], a: 1, note: "because of + іменник; because + ціле речення." },
  { s: 14, lvl: "B1", t: "mc", q: "I was really tired, ______ I finished the task anyway.", o: ["because", "so", "but", "although"], a: 2, note: "Протиставлення двох рівноправних частин → but." },
  { s: 14, lvl: "B1", t: "gap", q: "He was ______ tired that he fell asleep at his desk.", accept: ["so"], show: "so", note: "so + прикметник + that; such + a + прикметник + іменник." },
  { s: 14, lvl: "B1", t: "gap", q: "We took a taxi ______ order to save time.", accept: ["in"], show: "in", note: "in order to + інфінітив — мета." },
  { s: 14, lvl: "B2", t: "mc", q: "______ working hard all month, he didn't pass.", o: ["Although", "Despite", "However", "Because"], a: 1, note: "Despite + іменник або -ing; Although + ціле речення." },
  { s: 14, lvl: "B2", t: "mc", q: "The build failed; ______, we had to postpone the release.", o: ["although", "despite", "therefore", "whereas"], a: 2, note: "Наслідок → therefore." },
  { s: 14, lvl: "B2", t: "gap", q: "______ she was ill, she still came to work.", accept: ["although", "though", "even though", "while"], show: "Although", note: "Поступка з цілим реченням → although / even though." },
  { s: 14, lvl: "B2", t: "gap", q: "The tool is too expensive ______ us to buy right now.", accept: ["for"], show: "for", note: "too + прикметник + for somebody + to do." },
];

/* ------------------------------------------------------------------ */
/*  New suites 15–19                                                   */
/* ------------------------------------------------------------------ */

const Q3 = [
  // 16. Perfect vs Past Simple (контраст)
  { s: 15, lvl: "B1", t: "mc", q: "I ______ him yesterday at the conference.", o: ["have seen", "saw", "had seen", "see"], a: 1, note: "yesterday — завершений час → Past Simple, ніколи Present Perfect." },
  { s: 15, lvl: "B1", t: "mc", q: "We ______ in this office since March.", o: ["work", "worked", "have worked", "are working"], a: 2, note: "since → Present Perfect: дія триває досі." },
  { s: 15, lvl: "B1", t: "mc", q: "______ you finish the report last night?", o: ["Have", "Did", "Do", "Are"], a: 1, note: "last night → Past Simple, тому Did." },
  { s: 15, lvl: "B1", t: "gap", q: "She ______ (not / call) me since Tuesday.", accept: ["hasn't called", "has not called", "hasnt called"], show: "hasn't called", note: "since → Present Perfect." },
  { s: 15, lvl: "B1", t: "gap", q: "They ______ (move) to Lviv in 2019.", accept: ["moved"], show: "moved", note: "Конкретний рік у минулому → Past Simple." },
  { s: 15, lvl: "B1", t: "gap", q: "I ______ (already / send) the invoice.", accept: ["have already sent", "'ve already sent", "ve already sent"], show: "have already sent", note: "already без вказівки часу → Present Perfect." },
  { s: 15, lvl: "B2", t: "mc", q: "This is the first time I ______ Playwright on a mobile project.", o: ["use", "used", "have used", "had used"], a: 2, note: "Після It's the first time — Present Perfect." },
  { s: 15, lvl: "B2", t: "mc", q: "He ______ three tickets so far this morning.", o: ["closed", "has closed", "had closed", "closes"], a: 1, note: "so far + період, що триває → Present Perfect." },
  { s: 15, lvl: "B2", t: "mc", q: "When ______ you last ______ on holiday?", o: ["have / been", "did / go", "have / gone", "did / went"], a: 1, note: "Питання з When завжди в Past Simple." },
  { s: 15, lvl: "B2", t: "gap", q: "It's the best film I ______ (ever / see).", accept: ["have ever seen", "'ve ever seen", "ve ever seen"], show: "have ever seen", note: "Після найвищого ступеня — Present Perfect." },
  { s: 15, lvl: "B2", t: "gap", q: "She's the kindest manager I ______ (ever / work) with.", accept: ["have ever worked", "'ve ever worked", "ve ever worked"], show: "have ever worked", note: "the kindest… I have ever worked with — стала модель." },
  { s: 15, lvl: "B2", t: "gap", q: "We ______ (not / speak) to each other since last May.", accept: ["haven't spoken", "have not spoken", "havent spoken"], show: "haven't spoken", note: "since → Present Perfect; speak → spoken." },

  // 17. Adjectives & adverbs
  { s: 16, lvl: "A2", t: "mc", q: "She sings very ______.", o: ["good", "well", "better", "goodly"], a: 1, note: "Дію описує прислівник: sing well, не sing good." },
  { s: 16, lvl: "A2", t: "mc", q: "He drives too ______.", o: ["fastly", "fast", "quick", "speedy"], a: 1, note: "fast — і прикметник, і прислівник; форми fastly не існує." },
  { s: 16, lvl: "A2", t: "mc", q: "The exam was ______ easy.", o: ["real", "really", "realy", "much"], a: 1, note: "Прикметник підсилюємо прислівником really." },
  { s: 16, lvl: "B1", t: "mc", q: "This bug is ______ to reproduce.", o: ["hard", "hardly", "harder", "hardest"], a: 0, note: "hard = складно; hardly = майже не." },
  { s: 16, lvl: "B1", t: "mc", q: "The team worked ______ on the release.", o: ["hardly", "hard", "hardness", "hardier"], a: 1, note: "work hard = багато працювати; work hardly — помилка." },
  { s: 16, lvl: "B1", t: "mc", q: "It's a ______ interesting approach.", o: ["real", "really", "realy", "much"], a: 1, note: "really + прикметник." },
  { s: 16, lvl: "B1", t: "gap", q: "She speaks English ______ (fluent).", accept: ["fluently"], show: "fluently", note: "Прислівник способу дії: -ly." },
  { s: 16, lvl: "B1", t: "gap", q: "He solved the problem ______ (easy).", accept: ["easily"], show: "easily", note: "easy → easily: y змінюється на i." },
  { s: 16, lvl: "B1", t: "gap", q: "They arrived ______ (late) than expected.", accept: ["later"], show: "later", note: "later = пізніше; lately = останнім часом." },
  { s: 16, lvl: "B2", t: "gap", q: "I ______ ever use Selenium now — only Playwright.", accept: ["hardly", "rarely", "seldom"], show: "hardly", note: "hardly ever = майже ніколи." },
  { s: 16, lvl: "B2", t: "gap", q: "The test results were ______ (surprise).", accept: ["surprising"], show: "surprising", note: "-ing описує річ; -ed описує людину." },
  { s: 16, lvl: "B2", t: "gap", q: "I was very ______ (interest) in their offer.", accept: ["interested"], show: "interested", note: "Людина відчуває → -ed: interested." },

  // 18. Agreement & uncountables
  { s: 17, lvl: "A2", t: "mc", q: "The news ______ very good today.", o: ["are", "is", "were", "have"], a: 1, note: "news — незлічуване, завжди в однині." },
  { s: 17, lvl: "A2", t: "mc", q: "People ______ waiting outside the office.", o: ["is", "was", "are", "has"], a: 2, note: "people — множина → are." },
  { s: 17, lvl: "A2", t: "mc", q: "My hair ______ too long.", o: ["are", "is", "were", "have"], a: 1, note: "hair як маса — однина." },
  { s: 17, lvl: "A2", t: "gap", q: "There ______ (be) too much noise in this room.", accept: ["is"], show: "is", note: "noise — незлічуване → is." },
  { s: 17, lvl: "A2", t: "gap", q: "These ______ (be) my new colleagues.", accept: ["are"], show: "are", note: "these — множина → are." },
  { s: 17, lvl: "A2", t: "gap", q: "Money ______ (be) not the main problem here.", accept: ["is"], show: "is", note: "money — незлічуване → is." },
  { s: 17, lvl: "B1", t: "mc", q: "He gave me some really useful ______.", o: ["advices", "advice", "an advice", "advises"], a: 1, note: "advice незлічуване: a piece of advice, не advices." },
  { s: 17, lvl: "B1", t: "mc", q: "Everyone ______ finished the task already.", o: ["have", "has", "are", "were"], a: 1, note: "everyone / somebody / nobody → однина." },
  { s: 17, lvl: "B1", t: "mc", q: "There ______ a lot of information in this report.", o: ["are", "is", "were", "have"], a: 1, note: "information незлічуване → is; форми informations не існує." },
  { s: 17, lvl: "B2", t: "gap", q: "The police ______ (be) already here.", accept: ["are"], show: "are", note: "police — завжди множина." },
  { s: 17, lvl: "B2", t: "gap", q: "Neither of the tests ______ (be) stable.", accept: ["is"], show: "is", note: "neither of + однина у стандартній нормі." },
  { s: 17, lvl: "B2", t: "gap", q: "A number of bugs ______ (be) still open.", accept: ["are"], show: "are", note: "a number of + множина; але the number of + однина." },

  // 19. Determiners
  { s: 18, lvl: "B1", t: "mc", q: "______ student in the group has a laptop.", o: ["All", "Every", "Both", "Most"], a: 1, note: "every + іменник в однині." },
  { s: 18, lvl: "B1", t: "mc", q: "There are two options, and ______ of them is perfect.", o: ["none", "neither", "either", "both"], a: 1, note: "Про двох у заперечному значенні → neither." },
  { s: 18, lvl: "B1", t: "mc", q: "Each of the tests ______ its own data set.", o: ["have", "has", "having", "are"], a: 1, note: "each of + дієслово в однині." },
  { s: 18, lvl: "B1", t: "gap", q: "______ time I run the suite, it fails on the same step.", accept: ["every", "each"], show: "Every", note: "every time = щоразу." },
  { s: 18, lvl: "B1", t: "gap", q: "He works ______ day except Sunday.", accept: ["every"], show: "every", note: "every day — іменник в однині." },
  { s: 18, lvl: "B1", t: "gap", q: "There are shops on ______ sides of the street.", accept: ["both"], show: "both", note: "both + іменник у множині." },
  { s: 18, lvl: "B2", t: "mc", q: "______ of the answers were correct — the whole test failed.", o: ["Neither", "None", "Either", "Both"], a: 1, note: "none — про три і більше; neither — тільки про двох." },
  { s: 18, lvl: "B2", t: "mc", q: "You can take ______ bus — they both go to the centre.", o: ["any", "either", "neither", "both"], a: 1, note: "either = будь-який з двох." },
  { s: 18, lvl: "B2", t: "mc", q: "There were small shops on ______ side of the road.", o: ["every", "both", "each", "all"], a: 2, note: "each side — однина; both sides — множина." },
  { s: 18, lvl: "B2", t: "gap", q: "______ of us knew the answer, so we all stayed silent.", accept: ["none"], show: "None", note: "Про групу більше двох → none of us." },
  { s: 18, lvl: "B2", t: "gap", q: "She spends ______ of her time on test design.", accept: ["most"], show: "most", note: "most of + означений іменник." },
  { s: 18, lvl: "B2", t: "gap", q: "I have two laptops and ______ of them works properly.", accept: ["neither"], show: "neither", note: "neither of + однина дієслова." },

  // 20. Causative & complex object
  { s: 19, lvl: "B1", t: "mc", q: "My parents don't let me ______ out late.", o: ["to stay", "staying", "stay", "stayed"], a: 2, note: "let somebody do — без to." },
  { s: 19, lvl: "B1", t: "mc", q: "I want you ______ this ticket today.", o: ["close", "to close", "closing", "closed"], a: 1, note: "want somebody to do." },
  { s: 19, lvl: "B1", t: "mc", q: "She made him ______ the report again.", o: ["to write", "writing", "write", "wrote"], a: 2, note: "make somebody do — без to (але в пасиві: was made to write)." },
  { s: 19, lvl: "B1", t: "gap", q: "He asked me ______ (help) him with the setup.", accept: ["to help"], show: "to help", note: "ask somebody to do." },
  { s: 19, lvl: "B1", t: "gap", q: "They let us ______ (leave) an hour early.", accept: ["leave"], show: "leave", note: "let + інфінітив без to." },
  { s: 19, lvl: "B1", t: "gap", q: "I'd like you ______ (review) my pull request.", accept: ["to review"], show: "to review", note: "would like somebody to do." },
  { s: 19, lvl: "B2", t: "mc", q: "I need to ______ my hair cut before the interview.", o: ["make", "have", "do", "take"], a: 1, note: "have something done — дію виконує хтось інший." },
  { s: 19, lvl: "B2", t: "mc", q: "He had his phone ______ on the train.", o: ["steal", "stole", "stolen", "stealing"], a: 2, note: "have something done і про неприємні події: had his phone stolen." },
  { s: 19, lvl: "B2", t: "mc", q: "We got the regression tests ______ by Friday.", o: ["automate", "automated", "automating", "to automate"], a: 1, note: "get something done — розмовний варіант have something done." },
  { s: 19, lvl: "B2", t: "gap", q: "I ______ (have) my laptop repaired last week.", accept: ["had"], show: "had", note: "Past Simple причинової конструкції: had it repaired." },
  { s: 19, lvl: "B2", t: "gap", q: "We're going to ______ (get) the documentation translated.", accept: ["get"], show: "get", note: "get something done — те саме значення, що have something done." },
  { s: 19, lvl: "B2", t: "gap", q: "She had her car ______ (wash) yesterday.", accept: ["washed"], show: "washed", note: "have + об'єкт + V3." },
];

/* ------------------------------------------------------------------ */
/*  Fourth candidate for every slot                                    */
/* ------------------------------------------------------------------ */

const Q4 = [
  { s: 0, lvl: "A2", t: "mc", q: "The office ______ at nine every morning.", o: ["open", "opens", "is opening", "opened"], a: 1, note: "Розклад і рутина → Present Simple." },
  { s: 0, lvl: "A2", t: "gap", q: "We ______ (not / work) on Sundays.", accept: ["don't work", "do not work", "dont work"], show: "don't work", note: "we → don't work." },
  { s: 0, lvl: "B1", t: "mc", q: "Where ______ your sister working these days?", o: ["does", "is", "do", "has"], a: 1, note: "Тимчасова ситуація → Present Continuous." },
  { s: 0, lvl: "B1", t: "gap", q: "This report ______ (belong) to the QA team.", accept: ["belongs"], show: "belongs", note: "belong — стативне дієслово, без Continuous." },

  { s: 1, lvl: "A2", t: "mc", q: "They ______ at home last weekend.", o: ["was", "were", "are", "have been"], a: 1, note: "they → were." },
  { s: 1, lvl: "A2", t: "gap", q: "I ______ (see) that film last month.", accept: ["saw"], show: "saw", note: "see → saw." },
  { s: 1, lvl: "B1", t: "mc", q: "What ______ you doing when I called?", o: ["was", "were", "did", "are"], a: 1, note: "you → were doing." },
  { s: 1, lvl: "B1", t: "gap", q: "He ______ (write) tests all day yesterday.", accept: ["was writing"], show: "was writing", note: "Тривалий процес у минулому → Past Continuous." },

  { s: 2, lvl: "B1", t: "mc", q: "She has worked here ______ 2021.", o: ["for", "since", "from", "during"], a: 1, note: "since + рік." },
  { s: 2, lvl: "B1", t: "gap", q: "I ______ (never / try) Cypress.", accept: ["have never tried", "'ve never tried", "ve never tried"], show: "have never tried", note: "Досвід життя → Present Perfect; never між have і V3." },
  { s: 2, lvl: "B2", t: "mc", q: "They realised they ______ the wrong branch.", o: ["tested", "have tested", "had tested", "were testing"], a: 2, note: "Раніша дія відносно минулої → Past Perfect." },
  { s: 2, lvl: "B2", t: "gap", q: "The team ______ (discuss) the design for two hours when I joined.", accept: ["had been discussing", "'d been discussing"], show: "had been discussing", note: "Тривалість до моменту в минулому → Past Perfect Continuous." },

  { s: 3, lvl: "A2", t: "mc", q: "She ______ thirty next week.", o: ["is", "will be", "was", "is being"], a: 1, note: "Факт про майбутнє → will be." },
  { s: 3, lvl: "B1", t: "mc", q: "I've decided — I ______ apply for that position.", o: ["will", "'m going to", "am", "would"], a: 1, note: "Рішення вже ухвалене → be going to." },
  { s: 3, lvl: "B1", t: "gap", q: "We ______ (have) a retro on Thursday; it's in the calendar.", accept: ["are having", "'re having", "re having"], show: "are having", note: "Запис у календарі → Present Continuous." },
  { s: 3, lvl: "B2", t: "gap", q: "By Friday the client ______ (receive) all the results.", accept: ["will have received", "'ll have received"], show: "will have received", note: "By + момент → Future Perfect." },

  { s: 4, lvl: "A2", t: "mc", q: "______ you help me with this ticket?", o: ["Must", "Could", "Should have", "Are"], a: 1, note: "Ввічливе прохання → Could you…?" },
  { s: 4, lvl: "B1", t: "mc", q: "You ______ be tired after such a long flight.", o: ["must", "can't", "needn't", "would"], a: 0, note: "Логічний висновок → must." },
  { s: 4, lvl: "B2", t: "mc", q: "She ______ have forgotten — she wrote it down herself.", o: ["must", "can't", "should", "needn't"], a: 1, note: "Впевненість у неможливості → can't have + V3." },
  { s: 4, lvl: "B2", t: "gap", q: "He looks worried. He ______ (might / fail) the interview.", accept: ["might have failed", "may have failed"], show: "might have failed", note: "Припущення про минуле → might have + V3." },

  { s: 5, lvl: "B1", t: "mc", q: "If we don't fix it now, we ______ problems later.", o: ["have", "will have", "would have", "had"], a: 1, note: "First Conditional: will у головній частині." },
  { s: 5, lvl: "B1", t: "gap", q: "I wouldn't do that if I ______ (be) in your position.", accept: ["were", "was"], show: "were", note: "Second Conditional: if I were." },
  { s: 5, lvl: "B2", t: "mc", q: "If the pipeline hadn't failed, we ______ on time.", o: ["would release", "would have released", "released", "will release"], a: 1, note: "Third Conditional." },
  { s: 5, lvl: "B2", t: "gap", q: "She talks as if she ______ (own) the company.", accept: ["owned", "owns"], show: "owned", note: "as if + Past Simple для нереальної ситуації." },

  { s: 6, lvl: "A2", t: "mc", q: "The meeting room ______ every morning.", o: ["cleans", "is cleaned", "cleaned", "is cleaning"], a: 1, note: "Present Simple Passive." },
  { s: 6, lvl: "B1", t: "gap", q: "These tests ______ (write) by the previous team.", accept: ["were written"], show: "were written", note: "Past Simple Passive: were + written." },
  { s: 6, lvl: "B2", t: "mc", q: "The feature ______ tested before the release.", o: ["must be", "must", "must been", "must being"], a: 0, note: "Модальний пасив: modal + be + V3." },
  { s: 6, lvl: "B2", t: "gap", q: "The site ______ (update) three times since Monday.", accept: ["has been updated"], show: "has been updated", note: "Present Perfect Passive: has been + V3." },

  { s: 7, lvl: "B1", t: "mc", q: "He said the build ______ ready.", o: ["is", "was", "has been", "will be"], a: 1, note: "is → was." },
  { s: 7, lvl: "B1", t: "gap", q: "\"I can't join the call,\" she said. → She said she ______ join the call.", accept: ["couldn't", "could not", "couldnt"], show: "couldn't", note: "can → could." },
  { s: 7, lvl: "B2", t: "mc", q: "She wanted to know ______ we had finished the testing.", o: ["that", "if", "what", "did"], a: 1, note: "Непряме загальне питання → if/whether." },
  { s: 7, lvl: "B2", t: "gap", q: "He suggested ______ (postpone) the release.", accept: ["postponing"], show: "postponing", note: "suggest + -ing, без інфінітива." },

  { s: 8, lvl: "A2", t: "mc", q: "There's ______ email from the client.", o: ["a", "an", "the", "—"], a: 1, note: "email починається з голосного звуку → an." },
  { s: 8, lvl: "A2", t: "gap", q: "I don't have ______ questions about the task.", accept: ["any"], show: "any", note: "Заперечення → any." },
  { s: 8, lvl: "B1", t: "mc", q: "How ______ money do we need for the licence?", o: ["many", "much", "few", "a few"], a: 1, note: "money незлічуване → much." },
  { s: 8, lvl: "B1", t: "gap", q: "He works as ______ automation engineer.", accept: ["an"], show: "an", note: "Назва професії з артиклем; перед голосним → an." },

  { s: 9, lvl: "B1", t: "mc", q: "I've finished ______ the report.", o: ["to write", "writing", "write", "written"], a: 1, note: "finish + -ing." },
  { s: 9, lvl: "B1", t: "gap", q: "They agreed ______ (extend) the deadline.", accept: ["to extend"], show: "to extend", note: "agree + to + інфінітив." },
  { s: 9, lvl: "B2", t: "mc", q: "He denied ______ the file.", o: ["to delete", "deleting", "delete", "deleted"], a: 1, note: "deny + -ing." },
  { s: 9, lvl: "B2", t: "gap", q: "It's worth ______ (check) the logs first.", accept: ["checking"], show: "checking", note: "be worth + -ing." },

  { s: 10, lvl: "A2", t: "mc", q: "I like people ______ tell the truth.", o: ["which", "who", "whose", "where"], a: 1, note: "Про людей — who." },
  { s: 10, lvl: "B1", t: "gap", q: "The tool ______ we use is open source.", accept: ["that", "which"], show: "that", note: "Про річ — that або which." },
  { s: 10, lvl: "B2", t: "mc", q: "The release, ______ took three weeks, is finally done.", o: ["that", "which", "who", "what"], a: 1, note: "Неозначальне підрядне з комами → which." },
  { s: 10, lvl: "B2", t: "gap", q: "That's the colleague ______ laptop broke yesterday.", accept: ["whose"], show: "whose", note: "Належність → whose." },

  { s: 11, lvl: "A2", t: "mc", q: "I usually get up ______ seven ______ the morning.", o: ["in / at", "at / in", "on / in", "at / on"], a: 1, note: "at + час, in the morning." },
  { s: 11, lvl: "A2", t: "gap", q: "The meeting was moved ______ Friday.", accept: ["to"], show: "to", note: "move to + новий час." },
  { s: 11, lvl: "B1", t: "gap", q: "She's responsible ______ the mobile tests.", accept: ["for"], show: "for", note: "responsible for something." },
  { s: 11, lvl: "B2", t: "mc", q: "This approach is similar ______ ours.", o: ["with", "to", "as", "like"], a: 1, note: "similar to, не similar with." },

  { s: 12, lvl: "A2", t: "mc", q: "Today is ______ day of the year.", o: ["hotter", "the hottest", "hottest", "more hot"], a: 1, note: "Найвищий ступінь із the." },
  { s: 12, lvl: "A2", t: "gap", q: "This task is ______ (difficult) than I expected.", accept: ["more difficult"], show: "more difficult", note: "Довгий прикметник → more + прикметник." },
  { s: 12, lvl: "B1", t: "gap", q: "He isn't ______ experienced as his colleague.", accept: ["as", "so"], show: "as", note: "not as + прикметник + as." },
  { s: 12, lvl: "B2", t: "mc", q: "The sooner we start, ______ we finish.", o: ["sooner", "the sooner", "soonest", "more soon"], a: 1, note: "Обидві частини з the." },

  { s: 13, lvl: "A2", t: "mc", q: "______ books are these?", o: ["Who", "Whose", "Which of", "Who's"], a: 1, note: "Про належність — Whose." },
  { s: 13, lvl: "A2", t: "gap", q: "Who ______ you call yesterday?", accept: ["did"], show: "did", note: "Питання до додатка в Past Simple → did." },
  { s: 13, lvl: "B1", t: "mc", q: "I don't know ______.", o: ["where does he live", "where he lives", "where lives he", "he lives where"], a: 1, note: "Вбудоване питання — прямий порядок слів." },
  { s: 13, lvl: "B2", t: "gap", q: "You haven't seen my badge, ______ ______? (2 слова)", accept: ["have you"], show: "have you", note: "Заперечне речення → стверджувальний хвостик." },

  { s: 14, lvl: "B1", t: "mc", q: "______ the delay, we missed the demo.", o: ["Because", "Because of", "Although", "So"], a: 1, note: "because of + іменник." },
  { s: 14, lvl: "B1", t: "gap", q: "She was ______ tired that she went to bed at eight.", accept: ["so"], show: "so", note: "so + прикметник + that." },
  { s: 14, lvl: "B2", t: "mc", q: "______ he's quite young, he's very experienced.", o: ["Despite", "Although", "However", "Because of"], a: 1, note: "Although + ціле речення." },
  { s: 14, lvl: "B2", t: "gap", q: "______ being ill, he came to the office.", accept: ["despite", "in spite of"], show: "Despite", note: "Despite / In spite of + -ing або іменник." },

  { s: 15, lvl: "B1", t: "mc", q: "She ______ that book last summer.", o: ["has read", "read", "had read", "reads"], a: 1, note: "last summer → Past Simple." },
  { s: 15, lvl: "B1", t: "gap", q: "I ______ (not / see) him since the conference.", accept: ["haven't seen", "have not seen", "havent seen"], show: "haven't seen", note: "since → Present Perfect." },
  { s: 15, lvl: "B2", t: "mc", q: "It's the second time this ______ this month.", o: ["happens", "has happened", "happened", "had happened"], a: 1, note: "It's the second time + Present Perfect." },
  { s: 15, lvl: "B2", t: "gap", q: "We ______ (know) each other since university.", accept: ["have known", "'ve known", "ve known"], show: "have known", note: "since → Present Perfect; know — стативне, без Continuous." },

  { s: 16, lvl: "A2", t: "mc", q: "Please speak more ______.", o: ["slow", "slowly", "slower than", "slowness"], a: 1, note: "Дію описує прислівник: speak slowly." },
  { s: 16, lvl: "B1", t: "mc", q: "He arrived ______ for the interview.", o: ["lately", "late", "later", "latest"], a: 1, note: "late = із запізненням; lately = останнім часом." },
  { s: 16, lvl: "B1", t: "gap", q: "She answered the question ______ (correct).", accept: ["correctly"], show: "correctly", note: "Прислівник способу дії: -ly." },
  { s: 16, lvl: "B2", t: "gap", q: "The whole release process was ______ (confuse).", accept: ["confusing"], show: "confusing", note: "-ing описує причину, -ed — того, хто відчуває." },

  { s: 17, lvl: "A2", t: "mc", q: "Mathematics ______ my favourite subject at school.", o: ["are", "is", "were", "have"], a: 1, note: "Назви наук на -ics — однина." },
  { s: 17, lvl: "A2", t: "gap", q: "There ______ (be) a lot of people at the demo.", accept: ["are", "were"], show: "are", note: "people — множина → are." },
  { s: 17, lvl: "B1", t: "mc", q: "The furniture in this office ______ new.", o: ["are", "is", "were", "have"], a: 1, note: "furniture незлічуване → is; форми furnitures не існує." },
  { s: 17, lvl: "B2", t: "gap", q: "Neither the manager nor the developers ______ (be) available.", accept: ["are"], show: "are", note: "У конструкції neither… nor дієслово узгоджується з ближчим підметом." },

  { s: 18, lvl: "B1", t: "mc", q: "I've read ______ of the documentation, but not all of it.", o: ["every", "most", "each", "both"], a: 1, note: "most of + означений іменник." },
  { s: 18, lvl: "B1", t: "gap", q: "I like both designs — ______ of them works for me.", accept: ["either"], show: "either", note: "either = будь-який із двох." },
  { s: 18, lvl: "B2", t: "mc", q: "______ employee must sign the document.", o: ["All", "Every", "Both", "Most"], a: 1, note: "every + однина." },
  { s: 18, lvl: "B2", t: "gap", q: "Not ______ bug is worth fixing immediately.", accept: ["every", "each"], show: "every", note: "not every = не кожен, часткове заперечення." },

  { s: 19, lvl: "B1", t: "mc", q: "The manager had me ______ the report twice.", o: ["to rewrite", "rewriting", "rewrite", "rewritten"], a: 2, note: "have somebody do — без to." },
  { s: 19, lvl: "B1", t: "gap", q: "She helped me ______ (set) up the environment.", accept: ["set", "to set"], show: "set", note: "help somebody do або to do — обидва варіанти правильні." },
  { s: 19, lvl: "B2", t: "mc", q: "I'm going to have the results ______ tomorrow.", o: ["check", "checked", "checking", "to check"], a: 1, note: "have something done — дію виконує хтось інший." },
  { s: 19, lvl: "B2", t: "gap", q: "They had the office ______ (paint) last month.", accept: ["painted"], show: "painted", note: "have + об'єкт + V3." },
];

/* Повний пул: 320 питань, по 16 на кожну з 20 тем (4 варіанти на слот). */
const POOL = Q.concat(Q2, Q3, Q4);

/* Стабільний ідентифікатор питання: не залежить від позиції в масиві,
   тому історію показів не зіб'є додавання нових питань у кінець. */
const QID = (() => {
  const seen = {};
  return POOL.map((item) => {
    const k = `${item.s}-${item.lvl}-${item.t}`;
    seen[k] = (seen[k] || 0) + 1;
    return `${k}-${seen[k]}`;
  });
})();

const LEVELS = ["A2", "B1", "B2"];

/* Базовий тест: 4 питання на кожну з 20 тем (тема + рівень + тип).
   У кожній темі 12 питань у пулі, тож на кожен слот припадає 3 варіанти —
   структура стала, зміст щоразу новий, а решта лишається для уточнень. */
function buildSelection(usage = {}) {
  const groups = new Map();
  POOL.forEach((item, i) => {
    const k = `${item.s}|${item.lvl}|${item.t}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(i);
  });
  const picked = [];
  groups.forEach((arr) => {
    // найдавніше показане першим; серед нових — випадково
    const scored = arr.map((i) => ({ i, u: usage[QID[i]] ?? 0, r: Math.random() }));
    scored.sort((a, b) => a.u - b.u || a.r - b.r);
    picked.push(scored[0].i);
  });
  return picked.sort(
    (a, b) =>
      POOL[a].s - POOL[b].s ||
      LEVELS.indexOf(POOL[a].lvl) - LEVELS.indexOf(POOL[b].lvl) ||
      (POOL[a].t === POOL[b].t ? 0 : POOL[a].t === "mc" ? -1 : 1)
  );
}

const PROBES_PER_SUITE = 3;
const MAX_WEAK_SUITES = 5;
const WEAK_THRESHOLD = 0.5; // 2 з 4 і гірше

/* Після базової частини: слабкі теми отримують ще по 3 питання.
   Разом виходить 7 питань на тему — цього вже досить, щоб відрізнити
   реальну прогалину від двох випадкових помилок. */
function buildProbes(sel, answers, usage = {}) {
  const used = new Set(sel);
  const stat = {};
  sel.forEach((pi, i) => {
    const s = POOL[pi].s;
    if (!stat[s]) stat[s] = { c: 0, t: 0 };
    stat[s].t++;
    if (isRight(POOL[pi], answers[i])) stat[s].c++;
  });
  const weak = Object.keys(stat)
    .filter((s) => stat[s].c / stat[s].t <= WEAK_THRESHOLD)
    .sort((a, b) => stat[a].c / stat[a].t - stat[b].c / stat[b].t)
    .slice(0, MAX_WEAK_SUITES)
    .sort((a, b) => Number(a) - Number(b));

  const out = [];
  weak.forEach((s) => {
    const bank = [];
    POOL.forEach((item, i) => {
      if (item.s === Number(s) && !used.has(i)) bank.push(i);
    });
    bank
      .map((i) => ({ i, u: usage[QID[i]] ?? 0, r: Math.random() }))
      .sort((a, b) => a.u - b.u || a.r - b.r)
      .slice(0, PROBES_PER_SUITE)
      .forEach((x) => out.push(x.i));
  });
  return out;
}

const TEST_LEN = new Set(POOL.map((i) => `${i.s}|${i.lvl}|${i.t}`)).size;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const norm = (s) =>
  (s || "")
    .toLowerCase()
    .replace(/[’‘‛`]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/g, "")
    .trim();

const isRight = (q, ans) => {
  if (ans === undefined || ans === null || ans === "") return false;
  if (q.t === "mc") return Number(ans) === q.a;
  return q.accept.some((v) => norm(v) === norm(ans));
};

function estimateLevel(rates) {
  const { A2: a, B1: b, B2: c } = rates;
  if (a >= 0.85 && b >= 0.8 && c >= 0.75)
    return { label: "B2+", text: "Впевнений B2, місцями вже підходите до C1. Граматика не буде вузьким місцем на співбесіді." };
  if (a >= 0.8 && b >= 0.75 && c >= 0.55)
    return { label: "B2", text: "Робочий B2. База тримається, лишилося дотягнути складніші конструкції нижче." };
  if (a >= 0.8 && b >= 0.6)
    return { label: "B1+", text: "Сильний B1 з виходом на B2. Основне — перфектні часи, пасив і умовні речення." };
  if (a >= 0.7 && b >= 0.45)
    return { label: "B1", text: "Стабільний B1. База впевнена, складніші теми ще плавають." };
  if (a >= 0.55)
    return { label: "A2+", text: "Міцний A2 з переходом на B1. Варто закріпити базові часи перед складнішим." };
  return { label: "A2", text: "Рівень A2. Почніть з базових часів, питань і артиклів — решта стане на місце пізніше." };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const KEY = "grammar-diagnostic:v1";
const KEY_USAGE = "grammar-diagnostic:usage:v1";

export default function GrammarDiagnostic() {
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied] = useState("");
  const [sel, setSel] = useState([]);
  const [probes, setProbes] = useState([]);
  const [usage, setUsage] = useState({});
  const [runNo, setRunNo] = useState(0);
  const recorded = useRef(false);
  const items = useMemo(() => sel.concat(probes), [sel, probes]);
  const inputRef = useRef(null);
  const summaryRef = useRef(null);
  const saveTimer = useRef(null);
  const [storeOk, setStoreOk] = useState(null);
  const q = POOL[items[idx]];

  // відновлення збереженого прогресу та історії показів
  useEffect(() => {
    (async () => {
      let loadedUsage = {};
      try {
        if (!window.storage) throw new Error("no storage");
        const u = await window.storage.get(KEY_USAGE, false);
        if (u && u.value) {
          const parsed = JSON.parse(u.value);
          loadedUsage = parsed.used || {};
          setUsage(loadedUsage);
          setRunNo(parsed.run || 0);
        }
      } catch (e) {
        /* історії ще немає */
      }
      try {
        if (!window.storage) throw new Error("no storage");
        const r = await window.storage.get(KEY, false);
        if (r && r.value) {
          const s = JSON.parse(r.value);
          if (Array.isArray(s.sel) && s.sel.length === TEST_LEN) setSel(s.sel);
          if (Array.isArray(s.probes)) setProbes(s.probes);
          if (s.answers) setAnswers(s.answers);
          if (typeof s.idx === "number") setIdx(s.idx);
          if (s.started) setStarted(true);
          if (s.done) {
            setDone(true);
            recorded.current = true;
          }
        }
      } catch (e) {
        /* ключа ще немає — це нормально при першому запуску */
      }
      setHydrated(true);
      setLoading(false);
    })();
  }, []);

  // збереження: з паузою, щоб не бити по ліміту запитів на кожну літеру
  useEffect(() => {
    if (!hydrated) return;
    const payload = JSON.stringify({ answers, idx, started, done, sel, probes });
    const delay = done ? 0 : 800;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        if (!window.storage) throw new Error("no storage");
        const r = await window.storage.set(KEY, payload, false);
        setStoreOk(r ? true : false);
      } catch (e) {
        setStoreOk(false);
      }
    }, delay);
    return () => clearTimeout(saveTimer.current);
  }, [answers, idx, started, done, sel, probes, hydrated]);

  useEffect(() => {
    if (started && !done && q && q.t === "gap" && inputRef.current) inputRef.current.focus();
  }, [idx, started, done, q]);

  // фіксуємо показані питання один раз — коли з'явився звіт
  useEffect(() => {
    if (!hydrated || !done || recorded.current || items.length === 0) return;
    recorded.current = true;
    const nextRun = runNo + 1;
    const nextUsage = { ...usage };
    items.forEach((pi) => (nextUsage[QID[pi]] = nextRun));
    setUsage(nextUsage);
    setRunNo(nextRun);
    (async () => {
      try {
        if (!window.storage) return;
        await window.storage.set(
          KEY_USAGE,
          JSON.stringify({ run: nextRun, used: nextUsage }),
          false
        );
      } catch (e) {
        /* ротація просто не збережеться */
      }
    })();
  }, [done, hydrated, items, runNo, usage]);

  const answeredCount = Object.keys(answers).filter((k) => answers[k] !== "").length;

  const results = useMemo(() => {
    const perSuite = SUITES.map((n) => ({ name: n, c: 0, t: 0 }));
    const perLevel = { A2: { c: 0, t: 0 }, B1: { c: 0, t: 0 }, B2: { c: 0, t: 0 } };
    const wrong = [];
    items.forEach((pi, i) => {
      const item = POOL[pi];
      const ok = isRight(item, answers[i]);
      perSuite[item.s].t++;
      if (i < sel.length) perLevel[item.lvl].t++;
      if (ok) {
        perSuite[item.s].c++;
        if (i < sel.length) perLevel[item.lvl].c++;
      } else {
        wrong.push(i);
      }
    });
    const rates = {};
    LEVELS.forEach((l) => (rates[l] = perLevel[l].t ? perLevel[l].c / perLevel[l].t : 0));
    const baseTotal = sel.filter((pi, i) => isRight(POOL[pi], answers[i])).length;
    const total = items.length - wrong.length;
    return { perSuite, perLevel, rates, wrong, total, baseTotal, level: estimateLevel(rates) };
  }, [answers, items, sel]);

  const setAns = (v) => setAnswers((p) => ({ ...p, [idx]: v }));
  const go = (n) => setIdx(Math.min(items.length - 1, Math.max(0, n)));

  const reset = async () => {
    setAnswers({});
    setIdx(0);
    setDone(false);
    setStarted(false);
    setCopied("");
    setProbes([]);
    setSel(buildSelection(usage));
    recorded.current = false;
    try {
      await window.storage.delete(KEY, false);
    } catch (e) {
      /* нічого було видаляти */
    }
  };

  const css = `
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@500;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

.gd { --bg:#EDF0F4; --sf:#FFFFFF; --ink:#12161F; --mut:#5C6672; --acc:#3B34D6;
      --bad:#D9433B; --good:#0C7F62; --rule:#D5DBE3;
      background:var(--bg); color:var(--ink); min-height:100vh; width:100%;
      font-family:'IBM Plex Sans',system-ui,sans-serif; -webkit-font-smoothing:antialiased; }
.gd *{box-sizing:border-box;}
.gd-wrap{max-width:720px;margin:0 auto;padding:28px 18px 72px;}
.gd h1,.gd h2,.gd h3{font-family:'Archivo',sans-serif;letter-spacing:-0.03em;margin:0;font-weight:800;}
.gd-eyebrow{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.16em;
      text-transform:uppercase;color:var(--mut);}
.gd-h1{font-size:clamp(30px,7vw,46px);line-height:1.02;margin:10px 0 14px;}
.gd-lead{color:var(--mut);font-size:15px;line-height:1.6;max-width:52ch;}

/* signature: run tape */
.gd-tape{display:flex;gap:2px;flex-wrap:wrap;margin:22px 0 6px;}
.gd-tick{width:9px;height:20px;border-radius:1px;background:#DDE2E9;
      transition:background .18s ease, transform .18s ease;border:0;padding:0;}
.gd-tick.filled{background:#9AA3B2;}
.gd-tick.here{background:var(--acc);transform:scaleY(1.35);}
.gd-tick.pass{background:var(--good);}
.gd-tick.fail{background:var(--bad);}
.gd-tick.clickable{cursor:pointer;}
.gd-tapemeta{display:flex;justify-content:space-between;font-family:'IBM Plex Mono',monospace;
      font-size:11px;color:var(--mut);letter-spacing:.06em;}

.gd-card{background:var(--sf);border:1px solid var(--rule);border-radius:4px;
      padding:22px 20px;margin-top:18px;animation:gdin .22s ease;}
@keyframes gdin{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}
.gd-meta{display:flex;gap:8px;align-items:center;margin-bottom:16px;flex-wrap:wrap;}
.gd-chip{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.1em;
      text-transform:uppercase;padding:4px 7px;border:1px solid var(--rule);
      border-radius:2px;color:var(--mut);}
.gd-chip.lv{border-color:var(--acc);color:var(--acc);}
.gd-q{font-size:19px;line-height:1.5;font-weight:500;margin-bottom:18px;}

.gd-opt{display:block;width:100%;text-align:left;background:var(--sf);
      border:1px solid var(--rule);border-radius:3px;padding:13px 14px;margin-bottom:8px;
      font-family:inherit;font-size:16px;color:var(--ink);cursor:pointer;
      transition:border-color .14s ease,background .14s ease;}
.gd-opt:hover{border-color:#9AA3B2;}
.gd-opt.sel{border-color:var(--acc);background:#F0EFFD;box-shadow:inset 3px 0 0 var(--acc);}
.gd-opt:focus-visible,.gd-tick:focus-visible,.gd-btn:focus-visible,.gd-input:focus-visible
      {outline:2px solid var(--acc);outline-offset:2px;}
.gd-key{font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--mut);margin-right:10px;}

.gd-input{width:100%;padding:13px 14px;border:1px solid var(--rule);border-radius:3px;
      font-family:'IBM Plex Mono',monospace;font-size:16px;background:var(--sf);color:var(--ink);}
.gd-input:focus{border-color:var(--acc);}
.gd-hint{font-size:12px;color:var(--mut);margin-top:8px;}

.gd-nav{display:flex;gap:10px;margin-top:20px;}
.gd-btn{font-family:'IBM Plex Sans',sans-serif;font-size:15px;font-weight:600;
      padding:13px 18px;border-radius:3px;border:1px solid var(--ink);background:var(--ink);
      color:#fff;cursor:pointer;transition:opacity .14s ease;}
.gd-btn:hover{opacity:.85;}
.gd-btn.ghost{background:transparent;color:var(--ink);border-color:var(--rule);}
.gd-btn.wide{width:100%;}
.gd-btn.acc{background:var(--acc);border-color:var(--acc);}

/* results */
.gd-score{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin:6px 0 4px;}
.gd-big{font-family:'Archivo',sans-serif;font-size:clamp(52px,14vw,84px);font-weight:800;
      letter-spacing:-.05em;line-height:.9;color:var(--acc);}
.gd-num{font-family:'IBM Plex Mono',monospace;font-size:15px;color:var(--mut);}
.gd-row{display:grid;grid-template-columns:1fr auto;gap:4px 12px;padding:12px 0;
      border-bottom:1px solid var(--rule);align-items:center;}
.gd-row:last-child{border-bottom:0;}
.gd-rowname{font-size:15px;font-weight:500;}
.gd-rowscore{font-family:'IBM Plex Mono',monospace;font-size:13px;color:var(--mut);}
.gd-bar{grid-column:1/-1;height:4px;background:#E3E7ED;border-radius:2px;overflow:hidden;}
.gd-bar i{display:block;height:100%;border-radius:2px;}
.gd-tag{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.08em;
      text-transform:uppercase;}
.gd-sec{margin-top:34px;}
.gd-sec h3{font-size:13px;font-family:'IBM Plex Mono',monospace;font-weight:600;
      letter-spacing:.14em;text-transform:uppercase;color:var(--mut);margin-bottom:10px;}
.gd-rev{background:var(--sf);border:1px solid var(--rule);border-left:3px solid var(--bad);
      border-radius:3px;padding:14px 15px;margin-bottom:9px;}
.gd-revq{font-size:15px;line-height:1.5;margin-bottom:9px;}
.gd-ans{font-family:'IBM Plex Mono',monospace;font-size:13px;line-height:1.7;}
.gd-ans .y{color:var(--good);}
.gd-ans .n{color:var(--bad);text-decoration:line-through;}
.gd-note{font-size:13px;color:var(--mut);line-height:1.55;margin-top:8px;}
@media (prefers-reduced-motion:reduce){.gd *{animation:none!important;transition:none!important;}}
`;

  /* ---------------- loading ---------------- */
  if (loading) {
    return (
      <div className="gd">
        <style>{css}</style>
        <div className="gd-wrap">
          <div className="gd-eyebrow">Завантаження збереженого прогресу…</div>
        </div>
      </div>
    );
  }

  /* ---------------- intro ---------------- */
  if (!started) {
    return (
      <div className="gd">
        <style>{css}</style>
        <div className="gd-wrap">
          <div className="gd-eyebrow">Діагностика · A2 → B2 · 15 тем</div>
          <h1 className="gd-h1">
            Тест
            <br />
            з англійської граматики
          </h1>
          <p className="gd-lead">
            {TEST_LEN} питань — по 4 на кожну з {SUITES.length} тем, дібраних з пулу на{" "}
            {POOL.length}. Структура стала (та сама тема, той самий рівень, той самий тип), а
            зміст новий: на кожен слот припадає 4 варіанти, і додаток бере той, який не показувався
            найдовше. Тому перші чотири спроби поспіль ідуть без жодного повтору. Приблизно половина питань — з вибором відповіді, половина —
            вставити слово. Теми, де ви наберете 2 з 4 і менше, отримають ще по 3 питання, щоб
            відрізнити прогалину від випадкової помилки. Наприкінці — орієнтовний рівень,
            розбивка по темах і список того, що варто повторити.
            Тест не обмежений у часі, але не підглядайте — інакше звіт буде безкорисним.
            Прогрес зберігається автоматично: можна закрити вкладку і повернутися пізніше.
          </p>
          <div className="gd-tape" aria-hidden="true">
            {Array.from({ length: TEST_LEN }, (_, i) => (
              <span key={i} className="gd-tick" />
            ))}
          </div>
          <div className="gd-tapemeta">
            <span>
              {TEST_LEN} з {POOL.length}
            </span>
            <span>{runNo > 0 ? `спроб пройдено: ${runNo}` : "~30–35 min"}</span>
          </div>
          <div className="gd-nav">
            <button
              className="gd-btn acc wide"
              onClick={() => {
                if (sel.length === 0) setSel(buildSelection(usage));
                setStarted(true);
              }}
            >
              {runNo > 0 ? "Почати нову спробу" : "Почати тест"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- results ---------------- */
  if (done) {
    const pct = Math.round((results.total / items.length) * 100);
    const sorted = [...results.perSuite].sort((a, b) => a.c / a.t - b.c / b.t);
    const status = (r) =>
      r >= 0.75
        ? { t: "Впевнено", c: "var(--good)" }
        : r >= 0.5
        ? { t: "Повторити", c: "#B8860B" }
        : { t: "Слабке місце", c: "var(--bad)" };

    const summaryText = [
      `Результат тесту: ${results.level.label} — ${results.total}/${items.length} (${pct}%)`,
      `Базова частина: ${results.baseTotal}/${sel.length}` +
        (probes.length ? `, уточнення: ${probes.length} питань` : ""),
      `За рівнями: ` +
        LEVELS.map(
          (l) =>
            `${l} ${results.perLevel[l].c}/${results.perLevel[l].t} (${Math.round(
              results.rates[l] * 100
            )}%)`
        ).join(", "),
      ``,
      `Теми від слабшої до сильнішої:`,
      ...sorted.map((s) => `- ${s.name}: ${s.c}/${s.t} — ${status(s.c / s.t).t}`),
    ].join("\n");

    return (
      <div className="gd">
        <style>{css}</style>
        <div className="gd-wrap">
          <div className="gd-eyebrow">Звіт</div>
          <div className="gd-score">
            <span className="gd-big">{results.level.label}</span>
            <span className="gd-num">
              {results.total}/{items.length} · {pct}%
            </span>
          </div>
          <p className="gd-lead" style={{ marginTop: 10 }}>
            {results.level.text}
          </p>

          <div className="gd-tape">
            {items.map((pi, i) => (
              <span
                key={i}
                className={"gd-tick " + (isRight(POOL[pi], answers[i]) ? "pass" : "fail")}
              />
            ))}
          </div>
          <div className="gd-tapemeta">
            <span>зелений — правильно</span>
            <span>червоний — помилка</span>
          </div>

          <div className="gd-sec">
            <h3>За рівнями</h3>
            {LEVELS.map((l) => {
              const r = results.perLevel[l];
              const rate = r.c / r.t;
              return (
                <div className="gd-row" key={l}>
                  <span className="gd-rowname">{l}</span>
                  <span className="gd-rowscore">
                    {r.c}/{r.t} · {Math.round(rate * 100)}%
                  </span>
                  <span className="gd-bar">
                    <i style={{ width: `${rate * 100}%`, background: status(rate).c }} />
                  </span>
                </div>
              );
            })}
          </div>

          <div className="gd-sec">
            <h3>За темами — слабші зверху</h3>
            {sorted.map((s) => {
              const rate = s.c / s.t;
              const st = status(rate);
              return (
                <div className="gd-row" key={s.name}>
                  <span className="gd-rowname">{s.name}</span>
                  <span className="gd-tag" style={{ color: st.c }}>
                    {s.c}/{s.t} {st.t}
                  </span>
                  <span className="gd-bar">
                    <i style={{ width: `${rate * 100}%`, background: st.c }} />
                  </span>
                </div>
              );
            })}
          </div>

          <div className="gd-sec">
            <h3>Розбір помилок ({results.wrong.length})</h3>
            {results.wrong.length === 0 && (
              <p className="gd-lead">Жодної помилки. Тест уже не показує вашу межу — беріть рівень вище.</p>
            )}
            {results.wrong.map((i) => {
              const item = POOL[items[i]];
              const given = answers[i];
              const givenText =
                item.t === "mc"
                  ? given !== undefined && given !== ""
                    ? item.o[Number(given)]
                    : null
                  : given || null;
              const right = item.t === "mc" ? item.o[item.a] : item.show;
              return (
                <div className="gd-rev" key={i}>
                  <div className="gd-meta">
                    <span className="gd-chip">
                      {String(i + 1).padStart(2, "0")} · {SUITES[item.s]}
                    </span>
                    <span className="gd-chip lv">{item.lvl}</span>
                  </div>
                  <div className="gd-revq">{item.q}</div>
                  <div className="gd-ans">
                    <span className="y">✓ {right}</span>
                    <br />
                    {givenText ? (
                      <span className="n">✕ {givenText}</span>
                    ) : (
                      <span style={{ color: "var(--mut)" }}>— без відповіді</span>
                    )}
                  </div>
                  <div className="gd-note">{item.note}</div>
                </div>
              );
            })}
          </div>

          <div className="gd-sec">
            <h3>Звіт текстом</h3>
            <p className="gd-lead" style={{ marginBottom: 10 }}>
              Скопіюйте і надішліть у чат — за цими даними я зберу уроки саме по ваших прогалинах.
            </p>
            {storeOk === false && (
              <p className="gd-note" style={{ marginTop: 0, marginBottom: 10, color: "var(--bad)" }}>
                ⚠ Цей звіт зараз не зберігається на пристрої. Скопіюйте текст нижче, перш ніж
                закривати або перемикати чат — інакше результати зникнуть.
              </p>
            )}
            <textarea
              ref={summaryRef}
              className="gd-input"
              readOnly
              rows={10}
              value={summaryText}
              style={{ fontSize: 13, lineHeight: 1.6, resize: "vertical" }}
              onFocus={(e) => e.target.select()}
            />
            <div className="gd-nav">
              <button
                className="gd-btn acc"
                style={{ flex: 1 }}
                onClick={async () => {
                  // 1) сучасний API — працює не в кожному iframe
                  try {
                    if (navigator.clipboard && window.isSecureContext) {
                      await navigator.clipboard.writeText(summaryText);
                      setCopied("ok");
                      setTimeout(() => setCopied(""), 2500);
                      return;
                    }
                  } catch (e) {
                    /* пробуємо запасний шлях */
                  }
                  // 2) старий execCommand через виділення поля
                  try {
                    const ta = summaryRef.current;
                    if (ta) {
                      ta.readOnly = false;
                      ta.contentEditable = "true";
                      const range = document.createRange();
                      range.selectNodeContents(ta);
                      const s = window.getSelection();
                      s.removeAllRanges();
                      s.addRange(range);
                      ta.setSelectionRange(0, 999999);
                      const ok = document.execCommand("copy");
                      ta.readOnly = true;
                      ta.contentEditable = "false";
                      if (ok) {
                        setCopied("ok");
                        setTimeout(() => setCopied(""), 2500);
                        return;
                      }
                    }
                  } catch (e) {
                    /* лишається ручний спосіб */
                  }
                  // 3) текст уже виділено — користувач копіює сам
                  setCopied("manual");
                }}
              >
                {copied === "ok" ? "Скопійовано" : "Скопіювати звіт"}
              </button>
            </div>
            {copied === "manual" && (
              <p className="gd-note" style={{ marginTop: 4 }}>
                Браузер не дав доступу до буфера обміну. Текст уже виділено — натисніть і
                утримуйте поле вище, далі «Копіювати». Або відкрийте цей тест у звичайному
                браузері.
              </p>
            )}
          </div>

          <div className="gd-nav">
            <button className="gd-btn ghost wide" onClick={reset}>
              Нова спроба з іншими питаннями
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- test ---------------- */
  const cur = answers[idx];
  const last = idx === items.length - 1;
  const inProbe = idx >= sel.length;
  const atHalfway = !inProbe && idx === Math.floor(sel.length / 2);
  const atBaseEnd = idx === sel.length - 1 && probes.length === 0;

  const finishBase = () => {
    const p = buildProbes(sel, answers, usage);
    if (p.length === 0) {
      setDone(true);
      return;
    }
    setProbes(p);
    setIdx(sel.length);
  };

  return (
    <div className="gd">
      <style>{css}</style>
      <div className="gd-wrap">
        <div className="gd-tape">
          {items.map((_, i) => (
            <button
              key={i}
              className={
                "gd-tick clickable " +
                (i === idx ? "here" : answers[i] !== undefined && answers[i] !== "" ? "filled" : "")
              }
              onClick={() => go(i)}
              aria-label={`Питання ${i + 1}`}
            />
          ))}
        </div>
        <div className="gd-tapemeta">
          <span>
            {String(idx + 1).padStart(2, "0")} / {items.length}
          </span>
          <span>
            {storeOk === false
              ? "⚠ не зберігається"
              : storeOk === true
              ? "збережено"
              : `відповідей: ${answeredCount}`}
          </span>
        </div>

        {atHalfway && (
          <div className="gd-card" style={{ borderLeft: "3px solid var(--acc)", paddingBottom: 16 }}>
            <div className="gd-eyebrow">Половина позаду</div>
            <p className="gd-note" style={{ marginTop: 8 }}>
              Тут можна зупинитися і повернутися пізніше — прогрес збережений. Втома
              спотворює результат сильніше, ніж перерва.
            </p>
          </div>
        )}

        {inProbe && (
          <div className="gd-card" style={{ borderLeft: "3px solid var(--acc)", paddingBottom: 16 }}>
            <div className="gd-eyebrow">Уточнення</div>
            <p className="gd-note" style={{ marginTop: 8 }}>
              Кілька тем дали слабкий результат. Ще {probes.length}{" "}
              {probes.length === 1 ? "питання" : "питань"} саме по них — щоб відрізнити реальну
              прогалину від випадкової помилки.
            </p>
          </div>
        )}

        <div className="gd-card" key={idx}>
          <div className="gd-meta">
            <span className="gd-chip">{String(idx + 1).padStart(2, "0")}</span>
            <span className="gd-chip">{q.t === "mc" ? "вибір" : "вписати"}</span>
            {inProbe && <span className="gd-chip lv">уточнення</span>}
          </div>
          <div className="gd-q">{q.q}</div>

          {q.t === "mc" ? (
            q.o.map((opt, i) => (
              <button
                key={i}
                className={"gd-opt " + (Number(cur) === i ? "sel" : "")}
                onClick={() => setAns(i)}
              >
                <span className="gd-key">{"ABCD"[i]}</span>
                {opt}
              </button>
            ))
          ) : (
            <>
              <input
                ref={inputRef}
                className="gd-input"
                value={cur ?? ""}
                placeholder="впишіть слово або слова"
                onChange={(e) => setAns(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !last) go(idx + 1);
                }}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
              />
              <div className="gd-hint">Скорочення на кшталт don't теж приймаються. Enter — наступне питання.</div>
            </>
          )}

          <div className="gd-nav">
            <button className="gd-btn ghost" onClick={() => go(idx - 1)} disabled={idx === 0}>
              Назад
            </button>
            {atBaseEnd ? (
              <button className="gd-btn acc" style={{ flex: 1 }} onClick={finishBase}>
                Завершити базову частину
              </button>
            ) : last ? (
              <button className="gd-btn acc" style={{ flex: 1 }} onClick={() => setDone(true)}>
                Завершити і показати звіт
              </button>
            ) : (
              <button className="gd-btn" style={{ flex: 1 }} onClick={() => go(idx + 1)}>
                Далі
              </button>
            )}
          </div>
        </div>

        {answeredCount === items.length && !last && !atBaseEnd && (
          <div className="gd-nav">
            <button className="gd-btn acc wide" onClick={() => setDone(true)}>
              Усі {items.length} заповнено — показати звіт
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
