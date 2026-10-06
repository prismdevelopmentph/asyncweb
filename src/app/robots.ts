import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
      {
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'ClaudeBot',
          'Anthropic-AI',
          'PerplexityBot',
          'Bytespider',
          'ByteDance',
          'CCBot',
          'Google-Extended',
          'Cohere-AI',
          'Diffbot',
          'FacebookBot',
          'Omgilibot'
        ],
        disallow: '/',
      },
    ],
    sitemap: 'https://asyncdevph.xyz/sitemap.xml',
  };
}
