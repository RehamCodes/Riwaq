import type { Availability } from "@/components/presence/Avatar";

export type Contact = {
  id: string;
  name: string;
  role: string;
  availability: Availability;
  color: string; // avatar background class
};

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
      availability: "available",
      color: "bg-indigo-500",
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
      availability: "busy",
      color: "bg-emerald-600",
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
      availability: "away",
      color: "bg-amber-500",
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
      availability: "dnd",
      color: "bg-sky-500",
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
      availability: "offline",
      color: "bg-violet-500",
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
