import { apiClient } from '../lib/api';

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
      
      // Call backend API to analyze website
      const analysis = await apiClient.analyzeWebsite(url.toString());
      
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
      
      const analysis = await apiClient.analyzeWebsite(url.toString(), content);
      
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