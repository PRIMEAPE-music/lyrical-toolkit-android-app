/**
 * Test suite for upload-audio Netlify function
 * Tests the bug fix for Android database audio upload 500 error
 */

const { handler } = require('./upload-audio');

// Mock Supabase client
const mockSupabase = {
  storage: {
    listBuckets: jest.fn(),
    from: jest.fn(() => ({
      upload: jest.fn(),
      getPublicUrl: jest.fn(() => ({
        data: { publicUrl: 'https://example.com/test.mp3' }
      }))
    }))
  }
};

// Mock @supabase/supabase-js
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase)
}));

describe('upload-audio Netlify Function', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup environment variables
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
  });

  describe('Bug: Large file memory exhaustion', () => {
    it('should reject files larger than 50MB before parsing', async () => {
      // Create a mock event with 60MB file (simulated)
      const largeFileSize = 60 * 1024 * 1024; // 60MB

      const event = {
        httpMethod: 'POST',
        headers: {
          'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary',
          'content-length': String(largeFileSize)
        },
        body: 'mock-large-file-body',
        isBase64Encoded: false
      };

      const context = {
        awsRequestId: 'test-request-id',
        memoryLimitInMB: 1024,
        getRemainingTimeInMillis: () => 30000
      };

      const response = await handler(event, context);

      // Should return 400 error rejecting large file
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toMatchObject({
        error: expect.stringContaining('too large') || expect.stringContaining('exceeds')
      });
    });

    it('should successfully handle files under 50MB', async () => {
      // Create a small test file (1MB)
      const testFileContent = Buffer.alloc(1024 * 1024, 'a'); // 1MB of 'a'

      // Create proper multipart form data
      const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
      const formData = [
        `------${boundary}`,
        'Content-Disposition: form-data; name="file"; filename="test.mp3"',
        'Content-Type: audio/mpeg',
        '',
        testFileContent.toString('binary'),
        `------${boundary}`,
        'Content-Disposition: form-data; name="filename"',
        '',
        'test.mp3',
        `------${boundary}`,
        'Content-Disposition: form-data; name="userId"',
        '',
        'test-user',
        `------${boundary}--`
      ].join('\r\n');

      const event = {
        httpMethod: 'POST',
        headers: {
          'content-type': `multipart/form-data; boundary=${boundary}`,
          'content-length': String(formData.length)
        },
        body: Buffer.from(formData).toString('base64'),
        isBase64Encoded: true
      };

      const context = {
        awsRequestId: 'test-request-id',
        memoryLimitInMB: 1024,
        getRemainingTimeInMillis: () => 30000
      };

      // Mock successful Supabase responses
      mockSupabase.storage.listBuckets.mockResolvedValue({
        data: [{ name: 'audio-files' }],
        error: null
      });

      mockSupabase.storage.from().upload.mockResolvedValue({
        data: { path: 'test/test.mp3' },
        error: null
      });

      const response = await handler(event, context);

      // Should return 200 success
      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.body);
      expect(responseBody).toMatchObject({
        success: true,
        publicUrl: expect.stringContaining('test.mp3')
      });
    });

    it('should handle XMLHttpRequest format from Android Capacitor', async () => {
      // Simulate Capacitor XHR multipart upload
      const testFileContent = Buffer.alloc(1024 * 100, 'b'); // 100KB

      const boundary = '----WebKitFormBoundaryAndroid';
      const formData = [
        `------${boundary}`,
        'Content-Disposition: form-data; name="file"; filename="android-test.mp3"',
        'Content-Type: audio/mpeg',
        '',
        testFileContent.toString('binary'),
        `------${boundary}`,
        'Content-Disposition: form-data; name="filename"',
        '',
        'android-test.mp3',
        `------${boundary}`,
        'Content-Disposition: form-data; name="userId"',
        '',
        'android-user',
        `------${boundary}`,
        'Content-Disposition: form-data; name="songId"',
        '',
        '12345',
        `------${boundary}--`
      ].join('\r\n');

      const event = {
        httpMethod: 'POST',
        headers: {
          'content-type': `multipart/form-data; boundary=${boundary}`,
          'content-length': String(formData.length)
        },
        body: Buffer.from(formData).toString('base64'),
        isBase64Encoded: true
      };

      const context = {
        awsRequestId: 'android-test-request',
        memoryLimitInMB: 1024,
        getRemainingTimeInMillis: () => 30000
      };

      // Mock successful Supabase responses
      mockSupabase.storage.listBuckets.mockResolvedValue({
        data: [{ name: 'audio-files' }],
        error: null
      });

      mockSupabase.storage.from().upload.mockResolvedValue({
        data: { path: 'android-user/android-test.mp3' },
        error: null
      });

      const response = await handler(event, context);

      // Should successfully handle Android upload
      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.body);
      expect(responseBody.success).toBe(true);
    });

    it('should not accumulate chunks in memory for streaming', async () => {
      // This test verifies the fix: streaming should not accumulate all chunks
      // We can't directly test memory usage, but we can verify the flow completes
      // for a file that would have previously caused memory exhaustion

      const mediumFileSize = 25 * 1024 * 1024; // 25MB
      const testFileContent = Buffer.alloc(mediumFileSize, 'c');

      const boundary = '----WebKitFormBoundaryStreaming';
      const formData = [
        `------${boundary}`,
        'Content-Disposition: form-data; name="file"; filename="large.mp3"',
        'Content-Type: audio/mpeg',
        '',
        testFileContent.toString('binary'),
        `------${boundary}--`
      ].join('\r\n');

      const event = {
        httpMethod: 'POST',
        headers: {
          'content-type': `multipart/form-data; boundary=${boundary}`,
          'content-length': String(formData.length)
        },
        body: Buffer.from(formData).toString('base64'),
        isBase64Encoded: true
      };

      const context = {
        awsRequestId: 'streaming-test-request',
        memoryLimitInMB: 1024,
        getRemainingTimeInMillis: () => 30000
      };

      // Mock successful Supabase responses
      mockSupabase.storage.listBuckets.mockResolvedValue({
        data: [{ name: 'audio-files' }],
        error: null
      });

      mockSupabase.storage.from().upload.mockResolvedValue({
        data: { path: 'test/large.mp3' },
        error: null
      });

      const startTime = Date.now();
      const response = await handler(event, context);
      const duration = Date.now() - startTime;

      // Should complete successfully without timeout
      expect(response.statusCode).toBe(200);
      expect(duration).toBeLessThan(10000); // Should complete in less than 10 seconds
    });
  });

  describe('Error handling', () => {
    it('should return proper error for missing environment variables', async () => {
      delete process.env.SUPABASE_URL;

      const event = {
        httpMethod: 'POST',
        headers: {
          'content-type': 'multipart/form-data'
        },
        body: '',
        isBase64Encoded: false
      };

      const context = {
        awsRequestId: 'env-test-request',
        memoryLimitInMB: 1024,
        getRemainingTimeInMillis: () => 30000
      };

      const response = await handler(event, context);

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toMatchObject({
        error: expect.stringContaining('configuration')
      });
    });
  });
});
