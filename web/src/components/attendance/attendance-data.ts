// Sample figures until attendance comes from the server.

// Chart colors, mirroring the brand tokens in app/globals.css.
// Text never uses these; they only paint marks.
export const ACCENT = "#1f3a68"; // --color-brand
// Teacher figures, so they read apart from students in the same family.
export const ACCENT_ALT = "#3d5d93"; // --color-brand-light
export const ACCENT_SOFT = "#a3b4cf"; // --color-brand-muted

export type Range = "1Y" | "6M" | "1M" | "1W" | "1D";

export const ranges: { value: Range; label: string }[] = [
  { value: "1Y", label: "1 year" },
  { value: "6M", label: "6 months" },
  { value: "1M", label: "1 month" },
  { value: "1W", label: "1 week" },
  { value: "1D", label: "1 day" },
];

export type Series = { name: string; values: number[] };

export type Statistics = {
  labels: string[];
  current: Series;
  previous: Series;
};

// Attendance rate (%) that wobbles like a real school year, rounded to 0.1.
function rates(count: number, seed: number, base: number) {
  return Array.from({ length: count }, (_, i) => {
    const wave =
      Math.sin((i + seed) * 1.3) * 2.6 + Math.cos((i + seed) * 0.7) * 1.4;
    return Math.round(Math.min(99.5, base + wave) * 10) / 10;
  });
}

const months = [
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
];
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu"];

export function statistics(range: Range): Statistics {
  switch (range) {
    case "1Y":
      return {
        labels: months,
        current: { name: "This year", values: rates(12, 1, 93) },
        previous: { name: "Last year", values: rates(12, 4, 90) },
      };
    case "6M":
      return {
        labels: months.slice(6),
        current: { name: "This year", values: rates(12, 1, 93).slice(6) },
        previous: { name: "Last year", values: rates(12, 4, 90).slice(6) },
      };
    case "1M": {
      const labels = ["Week 1", "Week 2", "Week 3", "Week 4"];
      return {
        labels,
        current: { name: "This month", values: rates(4, 7, 94) },
        previous: { name: "Last month", values: rates(4, 2, 92) },
      };
    }
    case "1W":
      return {
        labels: weekdays,
        current: { name: "This week", values: rates(5, 3, 94) },
        previous: { name: "Last week", values: rates(5, 9, 92) },
      };
    case "1D": {
      const labels = [
        "7 AM",
        "8 AM",
        "9 AM",
        "10 AM",
        "11 AM",
        "12 PM",
        "1 PM",
      ];
      return {
        labels,
        current: { name: "Today", values: rates(7, 5, 92) },
        previous: { name: "Yesterday", values: rates(7, 11, 91) },
      };
    }
  }
}

export const summary = {
  // Check-ins since `since`, split by who checked in.
  attendance: {
    students: 12_450,
    teachers: 1_530,
  },
  since: "1 June 2026",
  teachers: {
    total: 820,
    change: "+202",
    trend: [610, 655, 690, 720, 760, 798, 820],
  },
  students: {
    total: 6_422,
    change: "+12.64%",
    trend: [5100, 5320, 5480, 5700, 5950, 6210, 6422],
  },
  earning: {
    total: 49_500,
    change: "+8%",
    trend: [41, 44, 42, 47, 45, 43, 46, 49, 48, 49.5],
  },
  arrivals: 9_340,
  returns: 4_640,
};

export type TopTeacher = {
  name: string;
  subject: string;
  rating: number;
  location: string;
};

export const topTeachers: TopTeacher[] = [
  {
    name: "Ms. Huda Saleh",
    subject: "Arabic",
    rating: 4.9,
    location: "Amman, Jordan",
  },
  {
    name: "Mr. Khaled Mansour",
    subject: "Mathematics",
    rating: 4.7,
    location: "Irbid, Jordan",
  },
  {
    name: "Ms. Sara Nabil",
    subject: "English",
    rating: 4.6,
    location: "Zarqa, Jordan",
  },
];

// 13980 → "13,980".
export function formatCount(value: number) {
  return value.toLocaleString("en-US");
}

// 49500 → "$49.5K".
export function formatMoney(value: number) {
  return `$${new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)}`;
}
