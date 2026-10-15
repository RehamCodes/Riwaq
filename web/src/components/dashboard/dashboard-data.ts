// Sample figures until the dashboard comes from the server.

// Letter grades by lowest score (%) that earns them.
export const gradeBands = [
  { letter: "A", min: 90 },
  { letter: "B", min: 80 },
  { letter: "C", min: 70 },
  { letter: "D", min: 60 },
  { letter: "E", min: 50 },
  { letter: "F", min: 0 },
];

export function letterOf(score: number) {
  return gradeBands.find((band) => score >= band.min)!.letter;
}

export const grading = {
  score: 87,
  updated: "January 29",
};

export type WeekScores = {
  labels: string[];
  current: number[];
  previous: number[];
};

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri"];

// Average score (%) per school day, for the last week of each month.
function week(firstDay: number, seed: number): WeekScores {
  const score = (i: number, shift: number) =>
    Math.round(
      74 + Math.sin((i + seed + shift) * 1.7) * 9 + Math.cos(i * 0.9 + seed) * 6,
    );
  return {
    labels: weekdays.map((day, i) => `${day} ${firstDay + i}`),
    current: weekdays.map((_, i) => score(i, 0)),
    previous: weekdays.map((_, i) => score(i, 2.3)),
  };
}

export const gpaByMonth: Record<string, WeekScores> = {
  January: week(22, 1),
  February: week(23, 4),
  March: week(23, 7),
  April: week(20, 10),
  May: week(25, 13),
};

export const parents = [
  { name: "Isabella Lewis", role: "Psychologist", phone: "+1 408 451 5925" },
  { name: "Samuel Adamson", role: "Mathematics", phone: "+1 408 831 5372" },
  { name: "Olivia Smith", role: "Art", phone: "+1 408 952 4284" },
  { name: "Daniel Carter", role: "Science", phone: "+1 408 637 1180" },
  { name: "Mia Robinson", role: "English", phone: "+1 408 274 9063" },
];

export const upcomingTests = [
  { date: 22, weekday: "Monday" },
  { date: 23, weekday: "Tuesday", subject: "Math" },
  { date: 24, weekday: "Wednesday", subject: "Art" },
  { date: 25, weekday: "Thursday" },
  { date: 26, weekday: "Friday" },
];

export const todaySchedule = [
  { start: "8:45 AM", end: "10:10 AM", title: "English Language Arts" },
  { start: "10:13 AM", end: "10:54 AM", title: "Physical Education" },
  { start: "10:57 AM", end: "11:37 AM", title: "Mathematics" },
  { start: "11:40 AM", end: "12:20 PM", title: "Lunch & Advisory" },
  { start: "12:23 PM", end: "1:03 PM", title: "Enrichment" },
  { start: "1:06 PM", end: "1:47 PM", title: "Science" },
];

export const recentEvents = [
  {
    author: "Connor Elington",
    role: "Teacher Coordinator",
    title: "Book Fair",
    body: "Join us on March 15 for our Book Fair! Explore captivating reads for the entire family, seize the opportunity to enrich your home library and support our school.",
    date: "January 27, 10:30",
    reactions: [
      { emoji: "👍", count: 7 },
      { emoji: "😻", count: 3 },
      { emoji: "⚡", count: 5 },
    ],
    commenters: ["Ava Brooks", "Liam Turner", "Noah Price"],
    comments: 29,
  },
];
