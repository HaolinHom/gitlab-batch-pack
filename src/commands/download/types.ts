export interface groups {
  id: number;
  web_url: string;
  name: string;
  path: string;
  description: string;
  full_name: string;
  full_path: string;
  [key: string]: any;
}

export interface projects {
  id: number;
  description: string;
  name: string;
  name_with_namespace: string;
  path_with_namespace: string;
  web_url: string;
  [key: string]: any;
}

export interface groupsInfo extends groups {
  projects: projects[];
}
