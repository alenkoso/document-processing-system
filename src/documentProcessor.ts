import fs from 'fs/promises';
import path from 'path';

export interface DocumentChunk {
  content: string;
  index: number;
  source: string;
  metadata: {
    paragraphCount: number;
    sentenceCount: number;
    previousChunkId?: number;
    nextChunkId?: number;
    keyTerms: string[];
    semanticScore?: number;
  }
}

export class DocumentProcessor {
  private chunks: DocumentChunk[] = [];
  private documents: Set<string> = new Set();
  private maxChunkSize = 1000; // characters
  private minChunkSize = 500;  // minimum chunk size
  private maxOverlap = 100;    // maximum overlap between chunks
  
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')           // normalize whitespace
      .replace(/[\r\n]+/g, '\n')      // normalize line endings
      .replace(/\t/g, ' ')            // replace tabs with spaces
      .trim();
  }

  private splitIntoParagraphs(text: string): string[] {
    return text
      .split(/\n\s*\n/)               // Split on empty lines
      .map(p => this.cleanText(p))    // Clean each paragraph
      .filter(p => p.length > 0);     // Remove empty paragraphs
  }

  private splitIntoSentences(text: string): string[] {
    // Enhanced sentence splitting with abbreviation handling
    return text
      .split(/(?<=[.!?])\s+(?=[A-Z])/)
      .filter(s => s.trim().length > 0)
      .map(s => s.trim());
  }

  private preprocessText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')  // Remove punctuation
      .replace(/\s+/g, ' ')                           // Normalize whitespace
      .trim()
      .split(' ')
      .filter(word => word.length > 2)                // Remove short words
      .join(' ');
  }

  private createOverlappingChunk(
    content: string, 
    previousChunk?: string
  ): string {
    if (!previousChunk) return content;
    
    const overlap = previousChunk.slice(-this.maxOverlap);
    const overlapIndex = content.indexOf(overlap);
    
    return overlapIndex > -1 ? 
      content.slice(overlapIndex + overlap.length) : 
      content;
  }

  async loadDocument(filePath: string): Promise<void> {
    this.documents.add(path.basename(filePath));
    const content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    
    const paragraphs = this.splitIntoParagraphs(content);
    let currentChunk = '';
    let index = 0;
    let paragraphCount = 0;
    let sentenceCount = 0;
    
    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > this.maxChunkSize) {
        if (currentChunk.length >= this.minChunkSize) {
          this.chunks.push({
            content: currentChunk.trim(),
            index: index++,
            source: fileName,
            metadata: {
              paragraphCount,
              sentenceCount,
              keyTerms: [],
              semanticScore: 0
            }
          });
          currentChunk = '';
          paragraphCount = 0;
          sentenceCount = 0;
        }
        
        if (paragraph.length > this.maxChunkSize) {
          const sentences = this.splitIntoSentences(paragraph);
          let sentenceChunk = '';
          
          for (const sentence of sentences) {
            if (sentenceChunk.length + sentence.length > this.maxChunkSize) {
              if (sentenceChunk.length >= this.minChunkSize) {
                this.chunks.push({
                  content: sentenceChunk.trim(),
                  index: index++,
                  source: fileName,
                  metadata: {
                    paragraphCount: 1,
                    sentenceCount: this.splitIntoSentences(sentenceChunk).length,
                    keyTerms: [],
                    semanticScore: 0
                  }
                });
              }
              sentenceChunk = sentence;
              sentenceCount = 1;
            } else {
              sentenceChunk += (sentenceChunk ? ' ' : '') + sentence;
              sentenceCount++;
            }
          }
          
          if (sentenceChunk.length >= this.minChunkSize) {
            this.chunks.push({
              content: sentenceChunk.trim(),
              index: index++,
              source: fileName,
              metadata: {
                paragraphCount: 1,
                sentenceCount,
                keyTerms: [],
                semanticScore: 0
              }
            });
          }
        } else {
          currentChunk = paragraph;
          paragraphCount = 1;
          sentenceCount = this.splitIntoSentences(paragraph).length;
        }
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        paragraphCount++;
        sentenceCount += this.splitIntoSentences(paragraph).length;
      }
    }
    
    if (currentChunk.length >= this.minChunkSize) {
      this.chunks.push({
        content: currentChunk.trim(),
        index: index,
        source: fileName,
        metadata: {
          paragraphCount,
          sentenceCount,
          keyTerms: [],
          semanticScore: 0
        }
      });
    }
  }

  async loadDocumentsFromDirectory(dirPath: string): Promise<void> {
    const files = await fs.readdir(dirPath);
    
    for (const file of files) {
      if (file.endsWith('.txt')) {
        await this.loadDocument(path.join(dirPath, file));
      }
    }
  }

  findRelevantChunks(query: string, limit: number = 3): DocumentChunk[] {
    // Simple relevance scoring based on word matching
    // I will improve this later with better semantic search
    const queryWords = query.toLowerCase().split(' ');
    
    return this.chunks
      .map(chunk => ({
        chunk,
        score: this.calculateRelevance(chunk.content, queryWords)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.chunk);
  }

  private calculateRelevance(content: string, queryWords: string[]): number {
    const contentLower = content.toLowerCase();
    return queryWords.reduce((score, word) => {
      return score + (contentLower.includes(word) ? 1 : 0);
    }, 0);
  }

  getDocumentCount(): number {
    return this.documents.size;
  }

  getChunkCount(): number {
    return this.chunks.length;
  }
} 