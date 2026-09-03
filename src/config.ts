/* =========================================================
   KONFIGURATION – Namen, Datum, Quiz hier anpassen
   ========================================================= */
export const CONFIG = {
  bewerber: "Philipp",
  auftraggeber: "Jonas",
  partner: "Lisa",
  hochzeit: "2027 oder 2028, Termin folgt",
  aktenzeichen: "TZ-2026/001",
  bearbeiter: "Jonas",
} as const;

export type Frage = {
  q: string;
  a: string[];
  correct: number; // Index der richtigen Antwort
  ok: string;
  nope: string;
};

export const QUIZ: Frage[] = [
  {
    q: "Seit wann kennen sich Bewerber und Auftraggeber?",
    a: ["Seit der Schule", "Seit dem Studium", "Seit Geburt. Es gab nie eine Wahl."],
    correct: 2,
    ok: "Korrekt. Die Akte bestätigt: 28 Jahre, lückenlos.",
    nope: "Falsch. Das Amt hat Fotos, siehe Anlage 1.",
  },
  {
    q: "Wie lautet die korrekte Bezeichnung des Verhältnisses?",
    a: ["Cousin", "Bester Freund", "Beides. Steht so in der Ausschreibung."],
    correct: 2,
    ok: "Korrekt. Doppelrolle, kein Interessenkonflikt.",
    nope: "Nur halb richtig. Das Amt wertet das als Bescheidenheit.",
  },
  {
    q: "Wie viele Belege in Anlage 1 enthalten ein Getränk?",
    a: ["Weniger als die Hälfte", "Mehr als die Hälfte", "Alle, wenn man großzügig zählt"],
    correct: 2,
    ok: "Korrekt. Das Amt zählt großzügig.",
    nope: "Bitte Anlage 1 nochmal durchgehen. Genauer hinsehen.",
  },
  {
    q: "Was befindet sich auf der Bierflasche vor dir?",
    a: ["Ein Etikett", "Eine Stellenanzeige", "Die eigentliche Frage. Der Rest hier ist Formsache."],
    correct: 2,
    ok: "Korrekt. Trink erst mal.",
    nope: "Technisch richtig, aber lies nochmal genauer.",
  },
  {
    q: "Wichtigste Aufgabe eines Trauzeugen?",
    a: [
      "Ringe nicht verlieren",
      "JGA ohne Krankenhaus",
      "Bei der Rede nicht alles erzählen",
      "Alle drei, in genau dieser Reihenfolge",
    ],
    correct: 3,
    ok: "Korrekt. Prioritäten sitzen.",
    nope: "Teilweise. Das Amt erwartet alle drei.",
  },
];

// Index 0 = schlecht ... 3 = volle Punktzahl
export const URTEILE = [
  "Ergebnis unterirdisch. Eignung trotzdem festgestellt, das Verfahren sieht keine Alternative vor.",
  "Ausbaufähig. Das Amt geht davon aus, dass das Bier schon Wirkung zeigt. Eignung festgestellt.",
  "Solide. Eignung festgestellt, wie erwartet.",
  "Volle Punktzahl. Das Amt hätte es auch so gemacht. Eignung festgestellt.",
];
