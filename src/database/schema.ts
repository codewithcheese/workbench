export interface Database {
  document: DocumentTable;
  response: ResponseTable;
  responseMessage: ResponseMessageTable;
  model: ModelTable;
  service: ServiceTable;
  project: ProjectTable;
}

export interface DocumentTable {
  id: string;
  name: string;
  description: string;
  content: string;
  data: any;
}

export interface ResponseTable {
  id: string;
  projectId: string;
  modelId: string;
  error: string | null;
}

export interface ResponseMessageTable {
  id: string;
  responseId: string;
  role: string;
  content: string;
}

export interface ModelTable {
  id: string;
  serviceId: string;
  name: string;
  visible: boolean;
}

export interface ServiceTable {
  id: string;
  name: string;
  providerId: string;
  baseURL: string;
  apiKey: string;
}

export interface ProjectTable {
  id: string;
  name: string;
  prompt: string;
}

// export type Document = Selectable<DocumentTable>;
// export type NewDocument = Insertable<DocumentTable>;
// export type DocumentUpdate = Updateable<DocumentTable>;
//
// export type Response = Selectable<ResponseTable>;
// export type NewResponse = Insertable<ResponseTable>;
// export type ResponseUpdate = Updateable<ResponseTable>;
//
// export type ResponseMessage = Selectable<ResponseMessageTable>;
// export type NewResponseMessage = Insertable<ResponseMessageTable>;
// export type ResponseMessageUpdate = Updateable<ResponseMessageTable>;
//
// export type Model = Selectable<ModelTable>;
// export type NewModel = Insertable<ModelTable>;
// export type ModelUpdate = Updateable<ModelTable>;
//
// export type Service = Selectable<ServiceTable>;
// export type NewService = Insertable<ServiceTable>;
// export type ServiceUpdate = Updateable<ServiceTable>;
//
// export type Project = Selectable<ProjectTable>;
// export type NewProject = Insertable<ProjectTable>;
// export type ProjectUpdate = Updateable<ProjectTable>;
