/**
 * Centrale configuratie voor kindgegevens en gezinsinstellingen.
 * Eén plek voor namen, geboortedatums en emoji's — gebruikt door zowel frontend als backend.
 */

export interface KidConfig {
  key: string;       // unieke sleutel (gebruikt in DB, API, filters)
  name: string;      // weergavenaam
  emoji: string;     // avatar-emoji
  birthDate: Date;   // geboortedatum
  /** HSL hue voor het kleurthema van dit kind */
  hue: number;
}

export const KID_NAMES: KidConfig[] = [
  {
    key: "charlie",
    name: "Charlie",
    emoji: "👑",
    birthDate: new Date(2020, 7, 18), // 18 augustus 2020
    hue: 330,
  },
  {
    key: "bodi",
    name: "Bodi",
    emoji: "🐻",
    birthDate: new Date(2024, 4, 10), // 10 mei 2024
    hue: 200,
  },
];

/** Hulpfunctie: bereken leeftijd in jaren + maanden */
export function getAge(birthDate: Date): { years: number; months: number; days: number } {
  const now = new Date();
  let years = now.getFullYear() - birthDate.getFullYear();
  let months = now.getMonth() - birthDate.getMonth();
  let days = now.getDate() - birthDate.getDate();
  if (days < 0) {
    months--;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  return { years, months, days };
}
