// 如厕记录相关类型

export type ShapeType = "1" | "2" | "3" | "4" | "5" | "6" | "7";
export type ColorType = "brown" | "dark_brown" | "yellow" | "green" | "black" | "red" | "other";
export type SmellType = "normal" | "strong" | "odorless" | "other";
export type ComfortType = "comfortable" | "bloating" | "pain" | "difficulty" | "other";
export type InputMode = "timer" | "manual";

export interface RecordData {
  id: number;
  start_time: string;
  end_time: string | null;
  duration: number | null;
  shape: ShapeType | null;
  color: ColorType | null;
  smell: SmellType | null;
  comfort: ComfortType | null;
  notes: string | null;
  input_mode: InputMode;
  created_at: string;
  updated_at: string;
}

export interface RecordCreate {
  start_time: string;
  end_time?: string | null;
  duration?: number | null;
  shape?: ShapeType | null;
  color?: ColorType | null;
  smell?: SmellType | null;
  comfort?: ComfortType | null;
  notes?: string | null;
  input_mode: InputMode;
}

export interface RecordUpdate {
  start_time?: string;
  end_time?: string | null;
  duration?: number | null;
  shape?: ShapeType | null;
  color?: ColorType | null;
  smell?: SmellType | null;
  comfort?: ComfortType | null;
  notes?: string | null;
  input_mode?: InputMode;
}

export interface AnalysisData {
  id: number;
  date_from: string;
  date_to: string;
  provider: string;
  model: string;
  summary: string;
  suggestions: string | null;
  record_ids: string | null;
  created_at: string;
}

export interface AnalysisRequest {
  date_from: string;
  date_to: string;
}

export interface CalendarDay {
  date: string;
  count: number;
}

export interface StatsData {
  frequency: { date: string; count: number }[];
  avg_duration: { date: string; avg_seconds: number }[];
  shape_distribution: { shape: string; count: number }[];
}

// 枚举值显示映射
export const SHAPE_LABELS: Record<ShapeType, string> = {
  "1": "分离的硬块（严重便秘）",
  "2": "块状香肠形（轻度便秘）",
  "3": "表面有裂纹（正常）",
  "4": "光滑柔软（理想）",
  "5": "柔软的团块（缺纤维）",
  "6": "糊状（轻度腹泻）",
  "7": "水样（腹泻）",
};

export const COLOR_LABELS: Record<ColorType, string> = {
  brown: "棕色",
  dark_brown: "深棕色",
  yellow: "黄色",
  green: "绿色",
  black: "黑色",
  red: "红色",
  other: "其他",
};

export const SMELL_LABELS: Record<SmellType, string> = {
  normal: "正常",
  strong: "偏臭",
  odorless: "无味",
  other: "其他",
};

export const COMFORT_LABELS: Record<ComfortType, string> = {
  comfortable: "舒适",
  bloating: "腹胀",
  pain: "腹痛",
  difficulty: "排便困难",
  other: "其他",
};
