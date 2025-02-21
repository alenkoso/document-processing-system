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
  private maxChunkSize = 200;  // Reduced from 1000 for testing
  private minChunkSize = 100;  // Reduced from 500 for testing
  private maxOverlap = 50;     // Reduced from 100 for testing
  
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
    const content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    
    const paragraphs = this.splitIntoParagraphs(content);
    let currentChunk = '';
    let previousChunk = '';
    let index = 0;
    
    for (const paragraph of paragraphs) {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      
      if (currentChunk.length >= this.maxChunkSize) {
        // Create chunk with overlap from previous
        const chunkContent = this.createOverlappingChunk(currentChunk, previousChunk);
        
        this.chunks.push({
          content: chunkContent,
          index: index++,
          source: fileName,
          metadata: {
            paragraphCount: this.splitIntoParagraphs(chunkContent).length,
            sentenceCount: this.splitIntoSentences(chunkContent).length,
            keyTerms: this.extractKeyTerms(chunkContent),
            previousChunkId: index > 0 ? index - 1 : undefined,
            nextChunkId: undefined,
            semanticScore: 0
          }
        });
        
        previousChunk = currentChunk;
        currentChunk = '';
      }
    }
    
    // Handle remaining content
    if (currentChunk.length >= this.minChunkSize) {
      const chunkContent = this.createOverlappingChunk(currentChunk, previousChunk);
      this.chunks.push({
        content: chunkContent,
        index: index,
        source: fileName,
        metadata: {
          paragraphCount: this.splitIntoParagraphs(chunkContent).length,
          sentenceCount: this.splitIntoSentences(chunkContent).length,
          keyTerms: this.extractKeyTerms(chunkContent),
          previousChunkId: index > 0 ? index - 1 : undefined,
          nextChunkId: undefined,
          semanticScore: 0
        }
      });
    }
    
    // Update nextChunkId for all chunks except the last one
    for (let i = 0; i < this.chunks.length - 1; i++) {
      this.chunks[i].metadata.nextChunkId = this.chunks[i + 1].index;
    }
  }

  private extractKeyTerms(text: string): string[] {
    return this.preprocessText(text)
      .split(' ')
      .filter(term => term.length > 3) // Only keep meaningful terms
      .slice(0, 10);  // Keep top 10 terms
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
    const queryTerms = this.preprocessText(query).split(' ');
    
    // Calculate TF-IDF scores
    const scores = this.chunks.map(chunk => {
      const chunkTerms = this.preprocessText(chunk.content).split(' ');
      let score = 0;
      
      for (const term of queryTerms) {
        const tf = chunkTerms.filter(t => t === term).length / chunkTerms.length;
        const df = this.chunks.filter(c => 
          this.preprocessText(c.content).includes(term)
        ).length;
        const idf = Math.log(this.chunks.length / (df || 1));
        
        score += tf * idf;
      }
      
      return { chunk, score };
    });
    
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.chunk);
  }
} 