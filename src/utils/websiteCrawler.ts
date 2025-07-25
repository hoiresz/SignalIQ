
export interface WebsiteAnalysis {
  company_description: string;
  industry: string;
  target_market: string;
  key_products: string[];
  value_proposition: string;
  company_size_indicators: string;
  technology_stack: string[];
  recent_news: string[];
}

export class WebsiteCrawler {
  /**
   * Crawl and analyze a website using the backend API
   */
  static async crawlWebsite(websiteUrl: string): Promise<WebsiteAnalysis> {
    try {
      // Validate URL format
      const url = new URL(websiteUrl);
      
      // Mock analysis for now - will be replaced with backend API
      const analysis: WebsiteAnalysis = {
        company_description: "A technology company focused on innovative solutions",
        industry: "Technology",
        target_market: "B2B enterprises and SMBs",
        key_products: ["Software Platform", "Analytics Tools", "API Services"],
        value_proposition: "Streamlining business operations through intelligent automation",
        company_size_indicators: "Medium-sized company with 50-200 employees",
        technology_stack: ["React", "Node.js", "PostgreSQL", "AWS"],
        recent_news: ["Product launch announcement", "New partnership deal", "Series A funding round"]
      };
      
      return analysis;
    } catch (error) {
      console.error('Error crawling website:', error);
      throw new Error(`Failed to analyze website: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Crawl website with custom content (for testing or when content is already available)
   */
  static async crawlWebsiteWithContent(websiteUrl: string, content: string): Promise<WebsiteAnalysis> {
    try {
      const url = new URL(websiteUrl);
      
      // Mock analysis for now - will be replaced with backend API
      const analysis: WebsiteAnalysis = {
        company_description: "A technology company focused on innovative solutions",
        industry: "Technology", 
        target_market: "B2B enterprises and SMBs",
        key_products: ["Software Platform", "Analytics Tools", "API Services"],
        value_proposition: "Streamlining business operations through intelligent automation",
        company_size_indicators: "Medium-sized company with 50-200 employees",
        technology_stack: ["React", "Node.js", "PostgreSQL", "AWS"],
        recent_news: ["Product launch announcement", "New partnership deal", "Series A funding round"]
      };
      
      return analysis;
    } catch (error) {
      console.error('Error crawling website with content:', error);
      throw new Error(`Failed to analyze website: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract domain from URL for display purposes
   */
  static extractDomain(websiteUrl: string): string {
    try {
      const url = new URL(websiteUrl);
      return url.hostname.replace('www.', '');
    } catch {
      return websiteUrl;
    }
  }

  /**
   * Validate if URL is properly formatted
   */
  static isValidUrl(websiteUrl: string): boolean {
    try {
      new URL(websiteUrl);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Format URL to ensure it has protocol
   */
  static formatUrl(websiteUrl: string): string {
    if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
      return `https://${websiteUrl}`;
    }
    return websiteUrl;
  }
}