// Defines the structure for an item in the AI generated content list
export interface AiGeneratedContentItem {
  type: string;
  content: string;
  timestamp: string;
}

export interface NewsSearchResultItem {
  title: string;
  link: string;
  snippet: string;
  source?: string; // Extracted from link or provided by API
  groundingChunks?: GroundingChunk[];
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  retrievedContext?: {
    uri: string;
    title: string;
  };
  // Add other chunk types if necessary
}

export interface Trend {
  tema: string;
  frecuencia: number | string;
  sentimiento?: string;
  url?: string;
  fuente?: string;
}
