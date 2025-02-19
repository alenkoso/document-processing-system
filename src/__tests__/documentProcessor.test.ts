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
  });

  describe('Relevance Matching', () => {
    test('should find relevant chunks based on query', async () => {
      // Create content with repeated target word to ensure it meets minimum size
      const catParagraph = 'The cats were playing in the garden. Multiple cats of different colors were chasing toys. These cats were very energetic. '.repeat(5);
      const mockContent = `
${catParagraph}

This is a different paragraph about dogs and other animals.

${catParagraph}
      `.trim();

      (fs.readFile as jest.Mock).mockResolvedValue(mockContent);
      await processor.loadDocument('test.txt');

      const relevantChunks = processor.findRelevantChunks('cats');
      expect(relevantChunks.length).toBeGreaterThan(0);
      expect(relevantChunks[0].content.toLowerCase()).toContain('cats');
    });
  });
}); 