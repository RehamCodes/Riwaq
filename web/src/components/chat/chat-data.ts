import type { Availability } from "@/components/presence/Avatar";

export type Contact = {
  id: string;
  name: string;
  role: string;
  kind: "teacher" | "student";
  availability: Availability;
  color: string; // avatar background class
  // Shown on the profile card when hovering the avatar.
  workingHours: string;
  lastSeen: string; // used when not available, e.g. "2 hours ago"
  email?: string;
  phone?: string;
  parent?: PhoneContact;
  driver?: PhoneContact & { bus?: string };
};

export type PhoneContact = { name: string; phone: string };

// A report or complaint about a student, filed from their profile card.
export type StudentReport = {
  type: "report" | "complaint";
  category: string;
  details: string;
  notifyParent: boolean;
};

// Reports aren't sent anywhere yet; this is the confirmation shown for now.
export function reportSentMessage(report: StudentReport) {
  const what = report.type === "report" ? "Report" : "Complaint";
  return report.notifyParent
    ? `${what} sent · parent notified`
    : `${what} sent`;
}

const SCHOOL_HOURS = "Sun–Thu, 7:30 AM – 2:30 PM";

export type Message = {
  id: string;
  from: "me" | "them";
  text: string;
  // Display labels; real timestamps will come from the server.
  day: string;
  time: string;
};

export type SharedFile = {
  id: string;
  name: string;
  kind: "pdf" | "doc" | "image" | "sheet";
  size: string;
  sharedBy: "me" | "them";
  day: string;
};

export type Chat = {
  contact: Contact;
  messages: Message[];
  files: SharedFile[];
  unread: boolean;
  muted: boolean;
  notes: string;
};

// Sample conversations until chats come from the server.
export const initialChats: Chat[] = [
  {
    contact: {
      id: "khaled",
      name: "Mr. Khaled Mansour",
      role: "Mathematics teacher",
      kind: "teacher",
      availability: "available",
      color: "bg-indigo-500",
      workingHours: SCHOOL_HOURS,
      lastSeen: "Just now",
      email: "k.mansour@riwaq.edu",
      phone: "+962 79 555 0142",
    },
    unread: true,
    muted: false,
    notes: "",
    files: [
      {
        id: "f1",
        name: "Algebra worksheet 4.pdf",
        kind: "pdf",
        size: "420 KB",
        sharedBy: "them",
        day: "Yesterday",
      },
      {
        id: "f2",
        name: "Homework answers.docx",
        kind: "doc",
        size: "86 KB",
        sharedBy: "me",
        day: "Today",
      },
    ],
    messages: [
      {
        id: "m1",
        from: "them",
        text: "Good morning! Don't forget tomorrow's quiz covers chapters 3 and 4.",
        day: "Yesterday",
        time: "4:12 PM",
      },
      {
        id: "m2",
        from: "me",
        text: "Thanks! Will the quadratic equations be included?",
        day: "Yesterday",
        time: "4:20 PM",
      },
      {
        id: "m3",
        from: "them",
        text: "Yes, mostly factoring. I shared the worksheet above — practice questions 5 to 12.",
        day: "Yesterday",
        time: "4:24 PM",
      },
      {
        id: "m4",
        from: "me",
        text: "I uploaded my homework answers, could you check question 7?",
        day: "Today",
        time: "8:05 AM",
      },
      {
        id: "m5",
        from: "them",
        text: "Sure, I'll review it after class. You can also watch this recap: https://www.khanacademy.org/math/algebra",
        day: "Today",
        time: "8:31 AM",
      },
    ],
  },
  {
    contact: {
      id: "huda",
      name: "Ms. Huda Saleh",
      role: "Arabic Language teacher",
      kind: "teacher",
      availability: "busy",
      color: "bg-emerald-600",
      workingHours: SCHOOL_HOURS,
      lastSeen: "10 minutes ago",
      email: "h.saleh@riwaq.edu",
      phone: "+962 79 555 0187",
    },
    unread: false,
    muted: false,
    notes: "Ask about the poetry competition registration.",
    files: [
      {
        id: "f3",
        name: "Poetry reading list.pdf",
        kind: "pdf",
        size: "1.2 MB",
        sharedBy: "them",
        day: "Monday",
      },
    ],
    messages: [
      {
        id: "m1",
        from: "them",
        text: "Great essay this week, your structure has improved a lot.",
        day: "Monday",
        time: "1:40 PM",
      },
      {
        id: "m2",
        from: "me",
        text: "Thank you! I followed the outline you suggested.",
        day: "Monday",
        time: "2:02 PM",
      },
      {
        id: "m3",
        from: "them",
        text: "The poetry reading list is attached. Pick one poem for Thursday.",
        day: "Monday",
        time: "2:05 PM",
      },
    ],
  },
  {
    contact: {
      id: "omar",
      name: "Mr. Omar Haddad",
      role: "Science teacher",
      kind: "teacher",
      availability: "away",
      color: "bg-amber-500",
      workingHours: "Sun–Thu, 8:00 AM – 1:30 PM",
      lastSeen: "1 hour ago",
      email: "o.haddad@riwaq.edu",
    },
    unread: false,
    muted: true,
    notes: "",
    files: [
      {
        id: "f4",
        name: "Lab safety rules.pdf",
        kind: "pdf",
        size: "310 KB",
        sharedBy: "them",
        day: "Sunday",
      },
      {
        id: "f5",
        name: "Experiment photo.jpg",
        kind: "image",
        size: "2.4 MB",
        sharedBy: "me",
        day: "Sunday",
      },
      {
        id: "f6",
        name: "Lab results.xlsx",
        kind: "sheet",
        size: "48 KB",
        sharedBy: "me",
        day: "Sunday",
      },
    ],
    messages: [
      {
        id: "m1",
        from: "them",
        text: "Please read the lab safety rules before Tuesday's physics lab.",
        day: "Sunday",
        time: "10:15 AM",
      },
      {
        id: "m2",
        from: "me",
        text: "Done. I also attached a photo of our experiment setup and the results sheet.",
        day: "Sunday",
        time: "6:48 PM",
      },
      {
        id: "m3",
        from: "them",
        text: "Looks good. Bring your goggles on Tuesday!",
        day: "Sunday",
        time: "7:30 PM",
      },
    ],
  },
  {
    contact: {
      id: "sara",
      name: "Ms. Sara Nabil",
      role: "English & Computer Science teacher",
      kind: "teacher",
      availability: "dnd",
      color: "bg-sky-500",
      workingHours: SCHOOL_HOURS,
      lastSeen: "25 minutes ago",
      email: "s.nabil@riwaq.edu",
      phone: "+962 79 555 0133",
    },
    unread: true,
    muted: false,
    notes: "",
    files: [],
    messages: [
      {
        id: "m1",
        from: "them",
        text: "Reminder: the coding project is due next Wednesday.",
        day: "Today",
        time: "7:50 AM",
      },
    ],
  },
  {
    contact: {
      id: "lina",
      name: "Ms. Lina Farouk",
      role: "Art teacher",
      kind: "teacher",
      availability: "offline",
      color: "bg-violet-500",
      workingHours: "Sun, Tue, Thu, 9:00 AM – 12:00 PM",
      lastSeen: "Yesterday at 6:10 PM",
      email: "l.farouk@riwaq.edu",
    },
    unread: false,
    muted: false,
    notes: "",
    files: [],
    messages: [
      {
        id: "m1",
        from: "me",
        text: "Can I submit the painting as a photo?",
        day: "Last week",
        time: "3:10 PM",
      },
      {
        id: "m2",
        from: "them",
        text: "Yes, a clear photo in good light is perfect.",
        day: "Last week",
        time: "5:22 PM",
      },
    ],
  },
  {
    contact: {
      id: "yousef",
      name: "Yousef Ali",
      role: "Grade 8 student",
      kind: "student",
      availability: "available",
      color: "bg-rose-500",
      workingHours: SCHOOL_HOURS,
      lastSeen: "Just now",
      email: "yousef.ali@students.riwaq.edu",
      parent: { name: "Ahmad Ali (father)", phone: "+962 79 555 0101" },
      driver: { name: "Sami Odeh", phone: "+962 79 555 0420", bus: "Bus 7" },
    },
    unread: false,
    muted: false,
    notes: "",
    files: [],
    messages: [
      {
        id: "m1",
        from: "them",
        text: "Miss, I'll be late tomorrow — the bus changed its route.",
        day: "Today",
        time: "7:05 AM",
      },
    ],
  },
  {
    contact: {
      id: "mariam",
      name: "Mariam Adel",
      role: "Grade 7 student",
      kind: "student",
      availability: "offline",
      color: "bg-teal-600",
      workingHours: SCHOOL_HOURS,
      lastSeen: "3 hours ago",
      parent: { name: "Noor Adel (mother)", phone: "+962 79 555 0166" },
      driver: { name: "Fadi Khoury", phone: "+962 79 555 0433", bus: "Bus 3" },
    },
    unread: false,
    muted: false,
    notes: "",
    files: [],
    messages: [
      {
        id: "m1",
        from: "me",
        text: "Please remind your mother about the parent–teacher meeting on Thursday.",
        day: "Monday",
        time: "11:20 AM",
      },
      {
        id: "m2",
        from: "them",
        text: "I will, thank you!",
        day: "Monday",
        time: "12:02 PM",
      },
    ],
  },
];

const URL_PATTERN = /https?:\/\/[^\s]+/g;

export function linksIn(messages: Message[]) {
  return messages.flatMap((m) =>
    (m.text.match(URL_PATTERN) ?? []).map((url, i) => ({
      id: `${m.id}-${i}`,
      url,
      sharedBy: m.from,
      day: m.day,
    })),
  );
}
