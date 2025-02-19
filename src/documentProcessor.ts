import fs from 'fs/promises';
import path from 'path';

interface DocumentChunk {
  content: string;
  index: number;
  source: string;
}

export class DocumentProcessor {
  private chunks: DocumentChunk[] = [];
  private maxChunkSize = 1000; // characters
  private minChunkSize = 500;  // minimum chunk size
  
  async loadDocument(filePath: string): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    
    // Split into paragraphs first
    const paragraphs = content
      .split(/\n\s*\n/)  // Split on empty lines
      .filter(p => p.trim().length > 0);  // Remove empty paragraphs
    
    let currentChunk = '';
    let index = 0;
    
    for (const paragraph of paragraphs) {
      // If adding this paragraph would exceed maxChunkSize
      if (currentChunk.length + paragraph.length > this.maxChunkSize) {
        // If we have content, save the current chunk
        if (currentChunk.length >= this.minChunkSize) {
          this.chunks.push({
            content: currentChunk.trim(),
            index: index++,
            source: fileName
          });
          currentChunk = '';
        }
        
        // If the paragraph itself is too long, split it into sentences
        if (paragraph.length > this.maxChunkSize) {
          const sentences = paragraph
            .split(/(?<=[.!?])\s+/)  // Split on sentence endings
            .filter(s => s.trim().length > 0);
          
          let sentenceChunk = '';
          for (const sentence of sentences) {
            if (sentenceChunk.length + sentence.length > this.maxChunkSize) {
              if (sentenceChunk.length >= this.minChunkSize) {
                this.chunks.push({
                  content: sentenceChunk.trim(),
                  index: index++,
                  source: fileName
                });
              }
              sentenceChunk = sentence;
            } else {
              sentenceChunk += ' ' + sentence;
            }
          }
          
          // Add any remaining sentences
          if (sentenceChunk.length >= this.minChunkSize) {
            this.chunks.push({
              content: sentenceChunk.trim(),
              index: index++,
              source: fileName
            });
          }
        } else {
          // Paragraph fits in a single chunk
          currentChunk = paragraph;
        }
      } else {
        // Add paragraph to current chunk
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }
    
    // Add final chunk if it exists
    if (currentChunk.length >= this.minChunkSize) {
      this.chunks.push({
        content: currentChunk.trim(),
        index: index,
        source: fileName
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