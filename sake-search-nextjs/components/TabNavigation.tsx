'use client';

interface Tab {
  id: string;
  label: string;
  icon: string;
  shortLabel: string;
}

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const tabs: Tab[] = [
  { id: 'search', label: '日本酒を調べる', icon: '🔍', shortLabel: '日本酒' },
  { id: 'restaurant', label: '飲食店で使う', icon: '🍽️', shortLabel: '飲食店' },
  { id: 'favorites', label: 'お気に入り管理', icon: '⭐', shortLabel: 'お気に入り' },
];

export const TabNavigation = ({ activeTab, onTabChange }: TabNavigationProps) => {
  return (
    <div className="w-full bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-center">
          <nav className="flex w-full max-w-md sm:max-w-none sm:space-x-4" aria-label="メインナビゲーション">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex items-center px-2 sm:px-6 py-3 sm:py-4 text-xs sm:text-base font-medium
                  border-b-2 transition-colors duration-200 min-w-0 flex-1 justify-center
                  ${activeTab === tab.id
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'
                  }
                `}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                <span className="mr-1 sm:mr-2 text-lg sm:text-xl">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden text-xs">{tab.shortLabel}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};