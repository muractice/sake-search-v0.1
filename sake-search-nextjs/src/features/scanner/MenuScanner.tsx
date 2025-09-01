import MenuScannerMain from './MenuScannerMain';

interface MenuScannerProps {
  onSakeFound: (sakeName: string) => Promise<{success: boolean, message: string}>;
  onMultipleSakeFound?: (sakeNames: string[], updateStatus?: (statusMap: Map<string, {status: 'pending' | 'added' | 'not_found' | 'limit_exceeded', message?: string}>) => void) => void;
  onRemoveFromComparison?: (sakeName: string) => Promise<{success: boolean, message: string}>;
  onIndividualAdd?: (sakeName: string) => Promise<{success: boolean, message: string}>;
  onIndividualRemove?: (sakeName: string) => Promise<{success: boolean, message: string}>;
  onClose: () => void;
}

export default function MenuScanner(props: MenuScannerProps) {
  return <MenuScannerMain {...props} />;
}