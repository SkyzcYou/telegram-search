import type { Config } from './config-schema'

import path from 'path-browserify-esm'
import { safeParse } from 'valibot'

import { configSchema } from './config-schema'

export function generateDefaultConfig(paths?: { storagePath?: string, assetsPath?: string }): Config {
  const defaultConfig = safeParse(configSchema, {
    // Database settings
    database: {
      // Default database connection settings
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      database: 'postgres',
    },

    // Message settings
    message: {
      // Export settings
      export: {
        // Number of messages to fetch in each request
        batchSize: 200,
        // Number of concurrent requests
        concurrent: 3,
        // Number of retry attempts
        retryTimes: 3,
        // Number of retry attempts for takeout session (0 means infinite retries)
        maxTakeoutRetries: 3,
      },
      // Database batch settings
      batch: {
        // Number of messages to save in each batch
        size: 100,
      },
    },

    // Path settings
    path: {
      storage: paths?.storagePath ?? '~/.telegram-search',
      assets: paths?.assetsPath ?? '',
      dict: path.join(paths?.assetsPath ?? '', 'dict.txt.big'),
    },

    // API settings
    api: {
      // Telegram API settings
      telegram: {
        // These values should be provided in config.yaml
        apiId: '',
        apiHash: '',
        phoneNumber: '',
        // Optional proxy settings - will be used if provided
        // proxy: {
        //   ip: '',            // Proxy host (IP or hostname)
        //   port: 0,           // Proxy port
        //   MTProxy: false,    // Whether it's an MTProxy or a normal Socks proxy
        //   secret: '',        // If using MTProxy, provide a secret
        //   socksType: 5,      // If using Socks, choose 4 or 5
        //   timeout: 2,        // Timeout (in seconds) for connection
        //   username: '',      // Optional username for proxy auth
        //   password: '',      // Optional password for proxy auth
        // }
      },
      // OpenAI API settings
      embedding: {
        // Embedding provider
        provider: 'openai',
        // Embedding model
        model: 'text-embedding-3-small',
        // API key should be provided in config.yaml
        apiKey: '',
        // Optional API base URL
        apiBase: '',
        // Embedding dimension
        dimension: 1536,
      },
    },
  })

  if (!defaultConfig.success) {
    throw new Error('Failed to generate default config')
  }

  return defaultConfig.output
}
