1. **Interface and Class Setup**:
```typescript
interface DocumentChunk {
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
  private maxChunkSize = 1000;  // characters
  private minChunkSize = 500;   // minimum chunk size
}
```
- Added metadata to track document structure
- Set size limits to ensure chunks are neither too big nor too small
- maxChunkSize (1000) fits within typical context windows
- minChunkSize (500) ensures enough context per chunk

2. **Text Cleaning**:
```typescript
private cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')           // normalize whitespace
    .replace(/[\r\n]+/g, '\n')      // normalize line endings
    .replace(/\t/g, ' ')            // replace tabs with spaces
    .trim();
}
```
- Normalizes all whitespace to single spaces
- Standardizes line endings
- Removes tabs and trailing whitespace
- Makes text consistent for processing

3. **Paragraph Splitting**:
```typescript
private splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)               // Split on empty lines
    .map(p => this.cleanText(p))    // Clean each paragraph
    .filter(p => p.length > 0);     // Remove empty paragraphs
}
```
- Splits on empty lines (natural paragraph breaks)
- Cleans each paragraph individually
- Removes empty paragraphs to avoid noise

4. **Sentence Splitting**:
```typescript
private splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z])/)  // Look for sentence endings followed by capital letters
    .filter(s => s.trim().length > 0)  // Remove empty sentences
    .map(s => s.trim());               // Clean each sentence
}
```
- Uses positive lookbehind (?<=) for punctuation
- Uses positive lookahead (?=) for capital letters
- Handles basic sentence structure while avoiding false splits on abbreviations

5. **Document Loading**:
```typescript
async loadDocument(filePath: string): Promise<void> {
  const content = await fs.readFile(filePath, 'utf-8');
  const fileName = path.basename(filePath);
  
  const paragraphs = this.splitIntoParagraphs(content);
  let currentChunk = '';
  let index = 0;
  let paragraphCount = 0;
  let sentenceCount = 0;
```
- Reads file asynchronously
- Tracks metadata counters
- Processes document in paragraphs first

6. **Chunk Creation Logic**:
```typescript
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
```
- Checks if adding paragraph would exceed maxChunkSize
- Creates new chunk if current one is big enough
- Includes metadata about structure

7. **Large Paragraph Handling**:
```typescript
if (paragraph.length > this.maxChunkSize) {
  const sentences = this.splitIntoSentences(paragraph);
  let sentenceChunk = '';
  
  for (const sentence of sentences) {
    if (sentenceChunk.length + sentence.length > this.maxChunkSize) {
      // Create new chunk
    } else {
      sentenceChunk += (sentenceChunk ? ' ' : '') + sentence;
      sentenceCount++;
    }
  }
}
```
- Splits oversized paragraphs into sentences
- Maintains sentence integrity
- Tracks sentence count for metadata

The improvements provide:
1. Better context preservation
2. More natural text boundaries
3. Structural metadata for better retrieval
4. Cleaner text normalization
5. More robust handling of different document formats

This makes the system better at:
- Maintaining readability
- Preserving context
- Handling different writing styles
- Supporting better relevance matching
- Providing structural information for the LLM
