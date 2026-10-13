import type { EventColor } from "./events";

export type WeeklyClass = {
  key: string;
  weekday: number;
  start: string;
  end: string;
  title: string;
  teacher: string;
  color: EventColor;
};

// Sample timetable until classes come from the server.
export const weeklyTimetable: WeeklyClass[] = [
  {
    key: "math-sun",
    weekday: 0,
    start: "08:00",
    end: "09:00",
    title: "Mathematics",
    teacher: "Mr. Khaled",
    color: "indigo",
  },
  {
    key: "arabic-sun",
    weekday: 0,
    start: "09:30",
    end: "10:30",
    title: "Arabic Language",
    teacher: "Ms. Huda",
    color: "emerald",
  },
  {
    key: "science-sun",
    weekday: 0,
    start: "11:00",
    end: "12:00",
    title: "Science",
    teacher: "Mr. Omar",
    color: "amber",
  },
  {
    key: "english-mon",
    weekday: 1,
    start: "08:00",
    end: "09:30",
    title: "English",
    teacher: "Ms. Sara",
    color: "sky",
  },
  {
    key: "history-mon",
    weekday: 1,
    start: "10:00",
    end: "11:00",
    title: "History",
    teacher: "Mr. Yusuf",
    color: "rose",
  },
  {
    key: "art-mon",
    weekday: 1,
    start: "13:00",
    end: "14:00",
    title: "Art",
    teacher: "Ms. Lina",
    color: "violet",
  },
  {
    key: "math-tue",
    weekday: 2,
    start: "08:00",
    end: "09:00",
    title: "Mathematics",
    teacher: "Mr. Khaled",
    color: "indigo",
  },
  {
    key: "physics-tue",
    weekday: 2,
    start: "09:30",
    end: "11:00",
    title: "Physics Lab",
    teacher: "Mr. Omar",
    color: "amber",
  },
  {
    key: "study-tue",
    weekday: 2,
    start: "10:00",
    end: "11:00",
    title: "Study Group",
    teacher: "Ms. Huda",
    color: "emerald",
  },
  {
    key: "arabic-wed",
    weekday: 3,
    start: "08:00",
    end: "09:00",
    title: "Arabic Language",
    teacher: "Ms. Huda",
    color: "emerald",
  },
  {
    key: "cs-wed",
    weekday: 3,
    start: "10:00",
    end: "11:30",
    title: "Computer Science",
    teacher: "Ms. Sara",
    color: "sky",
  },
  {
    key: "islamic-wed",
    weekday: 3,
    start: "12:00",
    end: "13:00",
    title: "Islamic Studies",
    teacher: "Mr. Yusuf",
    color: "violet",
  },
  {
    key: "math-thu",
    weekday: 4,
    start: "09:00",
    end: "10:00",
    title: "Mathematics",
    teacher: "Mr. Khaled",
    color: "indigo",
  },
  {
    key: "ptm-thu",
    weekday: 4,
    start: "11:00",
    end: "12:00",
    title: "Parent–Teacher Meeting",
    teacher: "Ms. Lina",
    color: "rose",
  },
];
