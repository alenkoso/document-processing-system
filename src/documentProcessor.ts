import fs from 'fs/promises';
import path from 'path';

interface DocumentChunk {
  content: string;
  index: number;
  source: string;
}

export class DocumentProcessor {
  private chunks: DocumentChunk[] = [];
  private chunkSize = 1000; // 1000 characters per chunk
  private overlap = 200;   // 200 characters overlap between chunks

  async loadDocument(filePath: string): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    
    // Split content into overlapping chunks
    let index = 0;
    let position = 0;

    while (position < content.length) {
      const chunkContent = content.slice(
        Math.max(0, position),
        position + this.chunkSize
      );

      this.chunks.push({
        content: chunkContent,
        index,
        source: fileName
      });

      position += this.chunkSize - this.overlap;
      index++;
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