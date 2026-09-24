export type DocumentType = 'web' | 'pdf' | 'image' | 'demo' | 'text' | 'capture';

export type Attention = 'info' | 'low' | 'medium' | 'high';

export type FindingCategory =
  | 'automatic_renewal'
  | 'cancellation'
  | 'data_sharing'
  | 'data_retention'
  | 'account_termination'
  | 'arbitration'
  | 'payment'
  | 'intellectual_property'
  | 'content_license'
  | 'privacy'
  | 'liability'
  | 'indemnification'
  | 'governing_law'
  | 'confidentiality'
  | 'employment_restriction'
  | 'user_obligation'
  | 'company_obligation'
  | 'other';

export interface DocumentBlock {
  id: string;
  text: string;
  order: number;
  heading?: string;
  domSelector?: string;
  page?: number;
  sourceLabel?: string;
  ocrConfidence?: number;
  sourceRegion?: SourceRegion;
  capturedPage?: number;
}

export interface SourceRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  sourceWidth: number;
  sourceHeight: number;
}

export interface OcrMetadata {
  language: 'eng';
  confidence: number;
  sourceKind: 'image' | 'scanned_pdf';
  pagesProcessed: number;
}

export interface EvidenceVerification {
  status: 'verified' | 'unsupported';
  reason?: string;
}

export interface Finding {
  id: string;
  sourceBlockId: string;
  category: FindingCategory;
  attention: Attention;
  title: string;
  explanation: string;
  evidenceText: string;
  confidence: number;
  sourceLocation: string;
  verification: EvidenceVerification;
}

export interface AnalysisResult {
  summary: string[];
  findings: Finding[];
}

export interface DocumentRecord extends AnalysisResult {
  id: string;
  type: DocumentType;
  title: string;
  url?: string;
  fileName?: string;
  createdAt: string;
  contentHash: string;
  blocks: DocumentBlock[];
  pdfBlob?: Blob;
  imageBlob?: Blob;
  capturedImages?: Blob[];
  ocr?: OcrMetadata;
  analysisVersion?: string;
  modelVersion?: string;
  cacheHit?: boolean;
  previousVersionId?: string;
  changeDetected: boolean;
}

export interface AnswerSource {
  sourceBlockId: string;
  evidenceText: string;
  sourceLocation: string;
}

export interface DocumentAnswer {
  status: 'answered' | 'insufficient';
  answer: string;
  sources: AnswerSource[];
  provider: 'local-rules' | 'local-model';
}

export type DiffSegmentKind = 'equal' | 'added' | 'removed';

export interface DiffSegment {
  kind: DiffSegmentKind;
  text: string;
}

export type PolicyChangeKind = 'added' | 'removed' | 'modified';

export interface PolicyChange {
  id: string;
  kind: PolicyChangeKind;
  heading?: string;
  beforeBlockId?: string;
  afterBlockId?: string;
  beforeText?: string;
  afterText?: string;
  similarity?: number;
  segments: DiffSegment[];
}

export interface PolicyDiff {
  previousDocumentId: string;
  currentDocumentId: string;
  added: number;
  removed: number;
  modified: number;
  unchanged: number;
  changes: PolicyChange[];
}

export interface WebScanResult {
  title: string;
  url: string;
  blocks: DocumentBlock[];
  legalScore: number;
}
