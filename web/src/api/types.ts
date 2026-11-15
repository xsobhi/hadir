export type Level = "ok" | "watch" | "warning" | "over";
export type Status = "present" | "late" | "absent" | "excused";

export type User = {
  id: number; name: string; email: string; title: string; department: string;
  isDemo: boolean; expiresAt: string | null;
};

export type Course = {
  id: number; code: string; nameAr: string; nameEn: string; section: string; room: string;
  days: number[]; startTime: string; durationMin: number; termStart: string; termWeeks: number;
  absenceLimitPct: number; lateAfterMin: number;
};

export type SessionRate = {
  id: number; startsAt: string; topic: string; present: number; late: number; absent: number;
  excused: number; marked: number; rate: number;
};

export type CourseSummary = {
  enrolled: number; held: number; planned: number; allowed: number; rate: number | null;
  levels: Record<Level, number>; lastSession: SessionRate | null;
};

export type Next = { startsAt: string; isToday: boolean } | null;

export type StudentRow = {
  id: number; number: string; nameAr: string; nameEn: string; major: string; year: number;
  present: number; late: number; absent: number; excused: number; allowed: number; level: Level;
};

export type CourseItem = Course & { summary: CourseSummary; next: Next; openSessionId: number | null };

export type Overview = {
  today: string; termWeek: number | null; termWeeks: number | null; courses: CourseItem[];
  next: CourseItem | null; todayClasses: CourseItem[];
  atRisk: (StudentRow & { courseId: number; courseCode: string; courseNameAr: string; courseNameEn: string })[];
  weekly: { week: number; attended: number; marked: number; rate: number | null }[];
};

export type CourseDetail = {
  course: Course; summary: CourseSummary; next: Next; openSessionId: number | null;
  sessions: SessionRate[]; students: (StudentRow & { register: string })[];
};

export type RosterEntry = {
  id: number; number: string; nameAr: string; nameEn: string; status: Status | null;
  markedAt: string | null; method: string | null; note: string | null;
};

export type LiveState = {
  session: { id: number; startsAt: string; topic: string; status: "open" | "closed"; closedAt: string | null };
  course: Course; enrolled: number; counts: Record<Status, number>; waiting: number; roster: RosterEntry[];
};

export type ScanResult = {
  result: "ok" | "duplicate" | "not_enrolled" | "unknown"; code?: string; status?: Status; markedAt?: string;
  student?: { id: number; number: string; nameAr: string; nameEn: string }; state: LiveState;
};
