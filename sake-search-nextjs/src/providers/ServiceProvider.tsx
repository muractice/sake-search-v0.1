'use client';

/**
 * Serviceの依存性注入を提供するProvider
 * Web/Mobile両対応
 */

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { ApiClient } from '@/services/core/ApiClient';
import { SakeService } from '@/services/SakeService';
import { SakeServiceV2 } from '@/services/SakeServiceV2';
import { HttpSakeRepository } from '@/repositories/sakes/HttpSakeRepository';
import { RecordService } from '@/services/RecordService';
import { RestaurantService } from '@/services/RestaurantService';
import { FavoriteService } from '@/services/FavoriteService';
import { ComparisonService } from '@/services/ComparisonService';
import { RecommendationService } from '@/services/RecommendationService';

interface ServiceContainer {
  sakeService: SakeService;
  sakeServiceV2: SakeServiceV2;
  recordService: RecordService;
  restaurantService: RestaurantService;
  favoriteService: FavoriteService;
  comparisonService: ComparisonService;
  recommendationService: RecommendationService;
}

interface ServiceProviderProps {
  children: ReactNode;
  // テスト時にmockサービスを注入するため
  mockServices?: Partial<ServiceContainer>;
  // API設定のオーバーライド
  apiConfig?: {
    baseURL?: string;
    timeout?: number;
    defaultHeaders?: Record<string, string>;
  };
}

const ServiceContext = createContext<ServiceContainer | null>(null);

export const ServiceProvider = ({ 
  children, 
  mockServices,
  apiConfig = {}
}: ServiceProviderProps) => {
  const services = useMemo(() => {
    // モックサービスが提供されている場合はそれを使用（テスト時）
    if (mockServices) {
      const defaultServices = createDefaultServices(apiConfig);
      return {
        sakeService: mockServices.sakeService || defaultServices.sakeService,
        sakeServiceV2: mockServices.sakeServiceV2 || defaultServices.sakeServiceV2,
        recordService: mockServices.recordService || defaultServices.recordService,
        restaurantService: mockServices.restaurantService || defaultServices.restaurantService,
        favoriteService: mockServices.favoriteService || defaultServices.favoriteService,
        comparisonService: mockServices.comparisonService || defaultServices.comparisonService,
        recommendationService: mockServices.recommendationService || defaultServices.recommendationService,
      };
    }

    // 本番環境では標準のサービスを作成
    return createDefaultServices(apiConfig);
  }, [mockServices, apiConfig]);

  return (
    <ServiceContext.Provider value={services}>
      {children}
    </ServiceContext.Provider>
  );
};

/**
 * SakeServiceにアクセスするためのhook
 */
export const useSakeService = (): SakeService => {
  const services = useContext(ServiceContext);
  if (!services) {
    throw new Error('useSakeService must be used within ServiceProvider');
  }
  return services.sakeService;
};

/**
 * SakeServiceV2にアクセスするためのhook
 */
export const useSakeServiceV2 = (): SakeServiceV2 => {
  const services = useContext(ServiceContext);
  if (!services) {
    throw new Error('useSakeServiceV2 must be used within ServiceProvider');
  }
  return services.sakeServiceV2;
};

/**
 * RecordServiceにアクセスするためのhook
 */
export const useRecordService = (): RecordService => {
  const services = useContext(ServiceContext);
  if (!services) {
    throw new Error('useRecordService must be used within ServiceProvider');
  }
  return services.recordService;
};

/**
 * RestaurantServiceにアクセスするためのhook
 */
export const useRestaurantService = (): RestaurantService => {
  const services = useContext(ServiceContext);
  if (!services) {
    throw new Error('useRestaurantService must be used within ServiceProvider');
  }
  return services.restaurantService;
};

/**
 * FavoriteServiceにアクセスするためのhook
 */
export const useFavoriteService = (): FavoriteService => {
  const services = useContext(ServiceContext);
  if (!services) {
    throw new Error('useFavoriteService must be used within ServiceProvider');
  }
  return services.favoriteService;
};

/**
 * ComparisonServiceにアクセスするためのhook
 */
export const useComparisonService = (): ComparisonService => {
  const services = useContext(ServiceContext);
  if (!services) {
    throw new Error('useComparisonService must be used within ServiceProvider');
  }
  return services.comparisonService;
};

/**
 * RecommendationServiceにアクセスするためのhook
 */
export const useRecommendationService = (): RecommendationService => {
  const services = useContext(ServiceContext);
  if (!services) {
    throw new Error('useRecommendationService must be used within ServiceProvider');
  }
  return services.recommendationService;
};

/**
 * 全サービスにアクセスするためのhook（将来的な拡張用）
 */
export const useServices = (): ServiceContainer => {
  const services = useContext(ServiceContext);
  if (!services) {
    throw new Error('useServices must be used within ServiceProvider');
  }
  return services;
};

/**
 * デフォルトのサービスコンテナを作成
 */
function createDefaultServices(apiConfig: ServiceProviderProps['apiConfig'] = {}): ServiceContainer {
  const apiClient = new ApiClient({
    baseURL: apiConfig.baseURL || process.env.NEXT_PUBLIC_API_BASE_URL || '',
    timeout: apiConfig.timeout || 10000,
    defaultHeaders: {
      'Content-Type': 'application/json',
      ...apiConfig.defaultHeaders,
    },
  });

  // Repository wiring (HTTP). 今はHTTPのみ、将来は差し替え可能。
  const sakeHttpRepository = new HttpSakeRepository(apiClient);

  return {
    sakeService: new SakeService(apiClient),
    sakeServiceV2: new SakeServiceV2(sakeHttpRepository),
    recordService: new RecordService(apiClient),
    restaurantService: new RestaurantService(apiClient),
    favoriteService: new FavoriteService(apiClient),
    comparisonService: new ComparisonService(apiClient),
    recommendationService: new RecommendationService(apiClient),
  };
}


/**
 * 環境変数から設定を取得するヘルパー
 */
export function getApiConfig() {
  return {
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000', 10),
    defaultHeaders: {
      'X-App-Version': process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    },
  };
}
