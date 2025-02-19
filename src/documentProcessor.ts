import fs from 'fs/promises';
import path from 'path';

export interface DocumentChunk {
  content: string;
  index: number;
  source: string;
  metadata?: {
    paragraphCount: number;
    sentenceCount: number;
  }
}

export class DocumentProcessor {
  private chunks: DocumentChunk[] = [];
  private maxChunkSize = 1000; // characters
  private minChunkSize = 500;  // minimum chunk size
  
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

  async loadDocument(filePath: string): Promise<void> {
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
              sentenceCount
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
                    sentenceCount: this.splitIntoSentences(sentenceChunk).length
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
                sentenceCount
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
          sentenceCount
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
} 