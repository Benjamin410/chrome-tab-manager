export type TabData = {
  title: string;
  active: boolean;
  age: string;
};

export type DomainGroupData = {
  domain: string;
  favicon?: string;
  count: number;
  age: string;
  expanded: boolean;
  tabs: TabData[];
  groupColor?: string;
  customName?: string;
};

export type SceneTheme = "light" | "dark";
