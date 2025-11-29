/**
 * Centralized configuration with fallbacks for all environment variables
 * All environment variables should be accessed through this file
 */

export const config = {
  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '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',
    apiUrl: process.env.OPENAI_API_URL || 'https://api.openai.com/v1',
  },

  // MongoDB Configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb+srv://gauravpantind:root@cluster0.qdoexiw.mongodb.net/ai-form-generator?retryWrites=true&w=majority',
  },

  // JWT Secret
  auth: {
    secret: process.env.NEXTAUTH_SECRET || 'your-super-secret',
  },

  // Cloudinary Configuration
  cloudinary: {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || 'dmg3zqyti',
    apiKey: process.env.CLOUDINARY_API_KEY || '161999227153253',
    apiSecret: process.env.CLOUDINARY_API_SECRET || 'D9i_JwEd-HI9heHq7ED6VY13EFO',
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || 'formai',
  },

  // App Configuration
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },

  // Node Environment
  nodeEnv: process.env.NODE_ENV || 'development',
} as const;

