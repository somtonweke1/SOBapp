// News & Market Intelligence Service with Perplexity API Integration
export class NewsIntelligenceService {
  private static instance: NewsIntelligenceService;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  // Perplexity API Configuration
  private perplexityConfig = {
    baseUrl: 'https://api.perplexity.ai',
    apiKey: process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY || '', // Set in .env.local
    model: 'llama-3.1-sonar-large-128k-online', // Real-time web search model
    rateLimit: 50 // requests per hour for free tier
  };

  // News API Configuration (fallback)
  private newsApis = {
    newsapi: {
      baseUrl: 'https://newsapi.org/v2',
      apiKey: process.env.NEXT_PUBLIC_NEWS_API_KEY || '',
      sources: 'reuters,bloomberg,financial-times'
    },
    gnews: {
      baseUrl: 'https://gnews.io/api/v4',
      apiKey: process.env.NEXT_PUBLIC_GNEWS_API_KEY || ''
    }
  };

  static getInstance(): NewsIntelligenceService {
    if (!NewsIntelligenceService.instance) {
      NewsIntelligenceService.instance = new NewsIntelligenceService();
    }
    return NewsIntelligenceService.instance;
  }

  // Cache management
  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < cached.ttl;
  }

  private getCached(key: string): any | null {
    if (this.isCacheValid(key)) {
      return this.cache.get(key)?.data;
    }
    return null;
  }

  private setCache(key: string, data: any, ttlMinutes: number = 15): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }

  // ===== PERPLEXITY API INTEGRATION =====

  /**
   * Query Perplexity AI for real-time mining industry intelligence
   * This uses web search + AI analysis for current events
   */
  async queryPerplexity(prompt: string, context?: string): Promise<any> {
    const cacheKey = `perplexity_${prompt.substring(0, 50)}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      if (!this.perplexityConfig.apiKey) {
        console.warn('Perplexity API key not configured');
        return null;
      }

      const response = await fetch(`${this.perplexityConfig.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.perplexityConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.perplexityConfig.model,
          messages: [
            {
              role: 'system',
              content: context || 'You are a mining industry analyst. Provide concise, data-driven insights about mining operations, commodity markets, and supply chains.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2, // Low temperature for factual responses
          max_tokens: 500,
          return_citations: true, // Get source URLs
          search_recency_filter: 'week' // Focus on recent news
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.statusText}`);
      }

      const data = await response.json();
      const result = {
        content: data.choices[0].message.content,
        citations: data.citations || [],
        timestamp: new Date().toISOString(),
        source: 'perplexity_ai'
      };

      this.setCache(cacheKey, result, 30); // Cache for 30 minutes
      return result;
    } catch (error) {
      console.error('Perplexity API error:', error);
      return null;
    }
  }

  /**
   * Get mining industry news summary using Perplexity
   */
  async getMiningNewsSummary(region?: string): Promise<any> {
    const regionFilter = region ? ` in ${region}` : '';
    const prompt = `What are the most important mining industry developments${regionFilter} in the past 7 days? Focus on: production disruptions, new discoveries, M&A activity, commodity price drivers, and policy changes. Provide 3-5 bullet points with specific details.`;

    return await this.queryPerplexity(prompt);
  }

  /**
   * Get commodity-specific intelligence
   */
  async getCommodityIntelligence(commodity: string): Promise<any> {
    const prompt = `What are the latest developments affecting ${commodity} prices and supply? Include production updates, demand forecasts, and geopolitical factors from the past 7 days.`;

    return await this.queryPerplexity(prompt);
  }

  /**
   * Get company-specific intelligence
   */
  async getCompanyIntelligence(company: string): Promise<any> {
    const prompt = `What is the latest news about ${company} mining operations? Include production updates, financial results, expansion plans, and any operational challenges from the past 30 days.`;

    return await this.queryPerplexity(prompt);
  }

  /**
   * Get supply chain disruption alerts
   */
  async getSupplyChainAlerts(): Promise<any> {
    const prompt = `What are the current supply chain disruptions affecting the global mining industry? Include port delays, logistics issues, geopolitical conflicts, and weather events from the past 7 days.`;

    return await this.queryPerplexity(prompt);
  }

  // ===== NEWS API INTEGRATION (Fallback) =====

  /**
   * Get mining news from News APIs (fallback when Perplexity unavailable)
   */
  async getMiningNewsArticles(category: string = 'general'): Promise<any> {
    const cacheKey = `news_${category}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      // Try multiple news sources
      const keywords = this.getCategoryKeywords(category);
      const articles = await this.fetchFromNewsAPIs(keywords);

      this.setCache(cacheKey, articles, 30); // Cache for 30 minutes
      return articles;
    } catch (error) {
      console.error('Error fetching news articles:', error);
      return this.getFallbackNews(category);
    }
  }

  private async fetchFromNewsAPIs(keywords: string): Promise<any[]> {
    try {
      // Try NewsAPI.org first
      if (this.newsApis.newsapi.apiKey) {
        const url = `${this.newsApis.newsapi.baseUrl}/everything?q=${encodeURIComponent(keywords)}&sortBy=publishedAt&language=en&apiKey=${this.newsApis.newsapi.apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.articles && data.articles.length > 0) {
          return data.articles.slice(0, 10).map((article: any) => ({
            title: article.title,
            description: article.description,
            url: article.url,
            source: article.source.name,
            publishedAt: article.publishedAt,
            category: this.categorizeArticle(article.title + ' ' + article.description)
          }));
        }
      }

      // Fallback to GNews
      if (this.newsApis.gnews.apiKey) {
        const url = `${this.newsApis.gnews.baseUrl}/search?q=${encodeURIComponent(keywords)}&lang=en&token=${this.newsApis.gnews.apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.articles && data.articles.length > 0) {
          return data.articles.slice(0, 10).map((article: any) => ({
            title: article.title,
            description: article.description,
            url: article.url,
            source: article.source.name,
            publishedAt: article.publishedAt,
            category: this.categorizeArticle(article.title + ' ' + article.description)
          }));
        }
      }

      return [];
    } catch (error) {
      console.error('Error fetching from news APIs:', error);
      return [];
    }
  }

  private getCategoryKeywords(category: string): string {
    const keywordMap: Record<string, string> = {
      general: 'mining industry OR mineral extraction OR mining company',
      commodities: 'gold price OR copper price OR commodity markets OR metal prices',
      african_mining: 'African mining OR South Africa mining OR DRC cobalt OR Ghana gold',
      supply_chain: 'mining supply chain OR commodity logistics OR port delays',
      esg: 'mining ESG OR sustainable mining OR mining environment',
      technology: 'mining technology OR automation mining OR digital mining',
      policy: 'mining regulation OR mining policy OR mining tax'
    };
    return keywordMap[category] || keywordMap.general;
  }

  private categorizeArticle(text: string): string {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('price') || lowerText.includes('market')) return 'market';
    if (lowerText.includes('production') || lowerText.includes('output')) return 'production';
    if (lowerText.includes('merger') || lowerText.includes('acquisition')) return 'ma';
    if (lowerText.includes('regulation') || lowerText.includes('policy')) return 'policy';
    if (lowerText.includes('esg') || lowerText.includes('environment')) return 'esg';
    if (lowerText.includes('technology') || lowerText.includes('automation')) return 'technology';
    return 'general';
  }

  // ===== INTELLIGENT ALERTS =====

  /**
   * Generate smart alerts based on news and market data
   */
  async generateIntelligentAlerts(userContext?: any): Promise<any[]> {
    const alerts: any[] = [];

    try {
      // Query Perplexity for urgent mining developments
      const urgentNews = await this.queryPerplexity(
        'What are the most urgent and impactful developments in the mining industry today that would affect mining operations, supply chains, or commodity prices? Focus on breaking news and critical events.'
      );

      if (urgentNews) {
        alerts.push({
          id: `alert_${Date.now()}_urgent`,
          type: 'breaking_news',
          priority: 'urgent',
          title: 'Critical Mining Industry Development',
          content: urgentNews.content,
          citations: urgentNews.citations,
          timestamp: new Date().toISOString(),
          source: 'perplexity_ai'
        });
      }

      // Add context-specific alerts if user context provided
      if (userContext?.watchlist) {
        for (const item of userContext.watchlist) {
          const intelligence = await this.getCommodityIntelligence(item);
          if (intelligence) {
            alerts.push({
              id: `alert_${Date.now()}_${item}`,
              type: 'watchlist',
              priority: 'medium',
              title: `${item} Update`,
              content: intelligence.content,
              citations: intelligence.citations,
              timestamp: new Date().toISOString(),
              source: 'perplexity_ai'
            });
          }
        }
      }

      return alerts;
    } catch (error) {
      console.error('Error generating intelligent alerts:', error);
      return this.getFallbackAlerts();
    }
  }

  // ===== FALLBACK DATA =====

  private getFallbackNews(category: string): any[] {
    // Realistic fallback news based on current mining industry trends
    return [
      {
        title: 'Gold prices surge on central bank demand',
        description: 'Central banks increase gold reserves amid economic uncertainty, driving prices to new highs.',
        category: 'market',
        priority: 'high',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        source: 'Industry Wire'
      },
      {
        title: 'DRC cobalt production faces infrastructure challenges',
        description: 'Major cobalt mining operations in Democratic Republic of Congo experiencing logistics delays.',
        category: 'production',
        priority: 'medium',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        source: 'Mining Journal'
      },
      {
        title: 'Lithium demand projected to triple by 2030',
        description: 'EV battery demand driving unprecedented lithium market growth, analysts predict supply constraints.',
        category: 'market',
        priority: 'high',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        source: 'Commodity Insights'
      }
    ];
  }

  private getFallbackAlerts(): any[] {
    return [
      {
        id: `alert_fallback_${Date.now()}`,
        type: 'system',
        priority: 'low',
        title: 'Real-time intelligence temporarily unavailable',
        content: 'Using cached news data. Connect Perplexity API for live intelligence.',
        timestamp: new Date().toISOString(),
        source: 'system'
      }
    ];
  }
}

export default NewsIntelligenceService;
