'use client';

/**
 * Serviceの依存性注入を提供するProvider
 * Web/Mobile両対応
 */

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { ApiClient } from '@/services/core/ApiClient';
import { RecordService } from '@/services/RecordService';
import { RestaurantService } from '@/services/RestaurantService';
import { ComparisonService } from '@/services/ComparisonService';
import { SupabaseRestaurantRepository } from '@/repositories/restaurants/SupabaseRestaurantRepository';
import { SupabaseRecordRepository } from '@/repositories/records/SupabaseRecordRepository';

interface ServiceContainer {
  recordService: RecordService;
  restaurantService: RestaurantService;
  comparisonService: ComparisonService;
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
        recordService: mockServices.recordService || defaultServices.recordService,
        restaurantService: mockServices.restaurantService || defaultServices.restaurantService,
        comparisonService: mockServices.comparisonService || defaultServices.comparisonService,
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
// Removed: SakeService hooks (search flows use Server Actions/RSC by default)

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

// Removed: FavoriteService (hooks use repository-backed useFavorites directly)

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

  return {
    recordService: new RecordService(new SupabaseRecordRepository()),
    restaurantService: new RestaurantService(new SupabaseRestaurantRepository()),
    comparisonService: new ComparisonService(apiClient),
  };
}
