import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { retry, RetryOptions } from './retry.js';
import { CircuitBreaker, CircuitState } from './circuitBreaker.js';
import { logger } from './logger.js';

/**
 * Resilient HTTP client with retry, circuit breaker, and graceful degradation
 */
export class ResilientHttpClient {
  private axiosInstance: AxiosInstance;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  constructor(baseURL?: string, defaultConfig?: AxiosRequestConfig) {
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 30000, // 30 second default timeout
      ...defaultConfig,
    });
  }

  /**
   * Get or create circuit breaker for a URL pattern
   */
  private getCircuitBreaker(url: string): CircuitBreaker {
    // Use hostname as circuit breaker key
    const hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    
    if (!this.circuitBreakers.has(hostname)) {
      this.circuitBreakers.set(
        hostname,
        new CircuitBreaker({
          failureThreshold: 5,
          resetTimeout: 60000, // 1 minute
        })
      );
    }

    return this.circuitBreakers.get(hostname)!;
  }

  /**
   * Make HTTP request with retry and circuit breaker
   */
  async request<T = any>(
    config: AxiosRequestConfig,
    retryOptions?: RetryOptions
  ): Promise<AxiosResponse<T>> {
    const url = config.url || config.baseURL || '';
    const circuitBreaker = this.getCircuitBreaker(url);
    const requestId = config.headers?.['x-request-id'] as string;

    // Use circuit breaker
    return circuitBreaker.execute(async () => {
      // Use retry wrapper
      return retry(
        async () => {
          try {
            const response = await this.axiosInstance.request<T>(config);
            
            // Log successful request
            logger.debug('HTTP request succeeded', {
              method: config.method?.toUpperCase() || 'GET',
              url: config.url,
              status: response.status,
              requestId,
            });

            return response;
          } catch (error: any) {
            // Log failed request
            logger.warn('HTTP request failed', {
              method: config.method?.toUpperCase() || 'GET',
              url: config.url,
              status: error.response?.status,
              error: error.message,
              requestId,
            });

            throw error;
          }
        },
        {
          maxAttempts: 3,
          initialDelayMs: 1000,
          maxDelayMs: 10000,
          backoffMultiplier: 2,
          retryable: (error: any) => {
            // Retry on network errors and 5xx errors
            if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
              return true;
            }
            if (error.response?.status >= 500 && error.response?.status < 600) {
              return true;
            }
            if (error.response?.status === 429) {
              return true; // Rate limit
            }
            return false;
          },
          ...retryOptions,
        }
      );
    });
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig, retryOptions?: RetryOptions): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url }, retryOptions);
  }

  /**
   * POST request
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    retryOptions?: RetryOptions
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data }, retryOptions);
  }

  /**
   * PUT request
   */
  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    retryOptions?: RetryOptions
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data }, retryOptions);
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    retryOptions?: RetryOptions
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH', url, data }, retryOptions);
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig, retryOptions?: RetryOptions): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url }, retryOptions);
  }

  /**
   * Get circuit breaker state for monitoring
   */
  getCircuitBreakerState(url: string): CircuitState {
    const circuitBreaker = this.getCircuitBreaker(url);
    return circuitBreaker.getState();
  }

  /**
   * Reset circuit breaker for a URL
   */
  resetCircuitBreaker(url: string): void {
    const circuitBreaker = this.getCircuitBreaker(url);
    circuitBreaker.reset();
  }
}

// Export singleton instance
export const resilientHttpClient = new ResilientHttpClient();
