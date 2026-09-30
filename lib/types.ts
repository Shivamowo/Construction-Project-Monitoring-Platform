export type Status = 'On track' | 'At risk' | 'Delay' | 'Not started';
export type Gran = 'Weekly' | 'Monthly';

export interface Project {
  id: string; name: string; state: string; lon: number; lat: number; status: Status;
  planPct: number; actualPct: number; start: string; execStart: string; baselineFinish: string; forecastFinish: string;
}
export interface Milestone { plan: string; actual: string }
export interface PoRow {
  id: string; projectId: string; pkg: string; category: string; discipline: string; critical: boolean;
  eng: Milestone; tender: Milestone; tech: Milestone; commercial: Milestone; po: Milestone;
}
export interface DrawingType { name: string; unit: string; scope: number; plan: number; received: number }
export interface DrawingRow { id: string; section: string; building: string; discipline: string; scope: number; plan: number; received: number }
export interface DprRow {
  id: string; projectId: string; discipline: string; building: string; vendor: string; unit: string;
  scope: number; cumPlan: number; cumAch: number; ftmPlan: number; ftmAct: number; ftdPlan: number; ftdAct: number;
  weekly: number; remarks: string; openDate?: undefined;
}
export interface Comment { by: string; at: string; text: string }
export interface ActionItem {
  id: string; projectId: string; title: string; category: string; discipline: string; assignee: string;
  openDate: string; dueDate: string; status: 'Open' | 'In progress' | 'Closed'; comments: Comment[];
}
export interface Risk {
  id: string; projectId: string; title: string; category: string; discipline: string; rating: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'Mitigating' | 'Closed'; owner: string; mitigation: string; link: string; openDate: string;
}
export interface Delay {
  id: string; projectId: string; description: string; person: string; org: string; openDate: string; closeDate: string;
  status: 'Open' | 'Closed'; daysLost: number; linked: string; discipline: string;
}
export interface AuditEntry {
  id: string; at: string; entity: string; rowId: string; kind: 'created' | 'updated'; field: string; from: string; to: string;
}
export type Entity = 'actions' | 'risks' | 'delays' | 'dpr';
