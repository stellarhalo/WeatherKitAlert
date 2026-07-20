/** Alert severity levels */
export type AlertLevel = "blue" | "yellow" | "orange" | "red";

/** Parsed alert data from qweather */
export interface AlertData {
    /** Alert title, e.g. "上海市气象台发布中心城区高温橙色预警" */
    title: string;
    /** Alert level */
    level: AlertLevel;
    /** Alert type name, e.g. "高温", "暴雨", "大风" */
    type: string;
    /** Publish time ISO string, e.g. "2026-07-17T07:40+08:00" */
    publishTime: string;
    /** Full description text */
    description: string;
    /** Alert explanation (触发条件) */
    explanation: string;
    /** Defense guidelines (防御指南) */
    guidelines: string[];
    /** Region name, e.g. "静安区" */
    region: string;
    /** Parent region, e.g. "上海市" */
    parentRegion: string;
}