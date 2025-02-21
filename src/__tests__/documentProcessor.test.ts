import { DocumentProcessor } from '../documentProcessor';
import fs from 'fs/promises';
import path from 'path';

// Add interface import
import { DocumentChunk } from '../documentProcessor';  // You'll need to export this interface

// Mock fs promises
jest.mock('fs/promises');

describe('DocumentProcessor', () => {
  let processor: DocumentProcessor;

  beforeEach(() => {
    processor = new DocumentProcessor();
    // Clear mocks between tests
    jest.clearAllMocks();
  });

  describe('Text Processing', () => {
    test('should split large text into appropriate chunks', async () => {
      // Create a longer text that will definitely split into multiple chunks
      const paragraph = 'This is a very long sentence that contains lots of words and should help us reach our minimum chunk size requirement. '.repeat(10);
      const mockContent = `
${paragraph}

${paragraph}

${paragraph}
      `.trim();

      (fs.readFile as jest.Mock).mockResolvedValue(mockContent);
      await processor.loadDocument('test.txt');

      const chunks = (processor as any).chunks;
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].metadata?.paragraphCount).toBeGreaterThan(0);
    });

    test('should preserve sentence boundaries', async () => {
      const mockContent = `
First sentence that is long enough to be meaningful. Second sentence that adds more context. Third sentence to ensure we have enough content.

New paragraph with substantial content. Another sentence here. And one final sentence.
      `.trim();

      (fs.readFile as jest.Mock).mockResolvedValue(mockContent);
      await processor.loadDocument('test.txt');

      const chunks = (processor as any).chunks;
      chunks.forEach((chunk: DocumentChunk) => {
        expect(chunk.content).toMatch(/[.!?]\s*$/);
      });
    });

    test('should include metadata with chunk information', async () => {
      const mockContent = `
        Paragraph one has multiple sentences. Here is another sentence.

        Paragraph two also has content. More content here.
      `.trim();

      (fs.readFile as jest.Mock).mockResolvedValue(mockContent);
      await processor.loadDocument('test.txt');

      const chunks = (processor as any).chunks;
      chunks.forEach((chunk: DocumentChunk) => {
        expect(chunk.metadata).toBeDefined();
        if (chunk.metadata) {
          expect(chunk.metadata.paragraphCount).toBeGreaterThan(0);
          expect(chunk.metadata.sentenceCount).toBeGreaterThan(0);
        }
      });
    });

    test('should handle overlapping chunks correctly', async () => {
      // Create a longer text that will definitely create multiple chunks
      const sentence = 'This is a test sentence that helps us reach our chunk size requirement. '.repeat(5);
      const mockContent = `
${sentence}

${sentence}

${sentence}
      `.trim();

      (fs.readFile as jest.Mock).mockResolvedValue(mockContent);
      await processor.loadDocument('test.txt');

      const chunks = (processor as any).chunks;
      expect(chunks.length).toBeGreaterThan(1);
      
      // Check for overlap between consecutive chunks
      for (let i = 1; i < chunks.length; i++) {
        const prevChunk = chunks[i - 1].content;
        const currentChunk = chunks[i].content;
        expect(currentChunk).toContain(prevChunk.slice(-50)); // Check for overlap
      }
    });

    test('should generate and store key terms', async () => {
      const mockContent = `
Artificial intelligence and machine learning are transforming technology.
Neural networks enable deep learning applications.
Natural language processing helps computers understand human communication.
      `.trim();

      (fs.readFile as jest.Mock).mockResolvedValue(mockContent);
      await processor.loadDocument('test.txt');

      const chunks = (processor as any).chunks;
      chunks.forEach((chunk: DocumentChunk) => {
        expect(chunk.metadata.keyTerms).toBeDefined();
        expect(chunk.metadata.keyTerms.length).toBeGreaterThan(0);
        expect(chunk.metadata.keyTerms).toContain('artificial');
        expect(chunk.metadata.keyTerms).toContain('intelligence');
      });
    });

    test('should maintain semantic relationships between chunks', async () => {
      const mockContent = `
First part of a continuous thought about AI.
Second part continuing the AI discussion.
Third part concluding the AI topic.

A new topic about databases begins here.
More database content follows.
Database discussion concludes.
      `.trim();

      (fs.readFile as jest.Mock).mockResolvedValue(mockContent);
      await processor.loadDocument('test.txt');

      const chunks = (processor as any).chunks;
      for (let i = 1; i < chunks.length; i++) {
        expect(chunks[i].metadata.previousChunkId).toBe(chunks[i - 1].index);
        expect(chunks[i - 1].metadata.nextChunkId).toBe(chunks[i].index);
      }
    });
  });

  describe('Relevance Matching', () => {
    test('should find relevant chunks using TF-IDF scoring', async () => {
      const pythonContent = 'Python is a versatile programming language used for data science and machine learning. '.repeat(3);
      const mockContent = `
${pythonContent}

JavaScript is used for web development.

${pythonContent}
      `.trim();

      (fs.readFile as jest.Mock).mockResolvedValue(mockContent);
      await processor.loadDocument('test.txt');

      const relevantChunks = processor.findRelevantChunks('Python data science');
      expect(relevantChunks.length).toBeGreaterThan(0);
      expect(relevantChunks[0].content.toLowerCase()).toContain('python');
      expect(relevantChunks[0].content.toLowerCase()).toContain('data science');
    });
  });
}); 