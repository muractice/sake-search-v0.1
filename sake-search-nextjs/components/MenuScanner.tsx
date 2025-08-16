import MenuScannerMain from './MenuScanner/MenuScannerMain';

interface MenuScannerProps {
  onSakeFound: (sakeName: string) => Promise<{success: boolean, message: string}>;
  onMultipleSakeFound?: (sakeNames: string[]) => void;
  onRemoveFromComparison?: (sakeName: string) => Promise<{success: boolean, message: string}>;
  onClose: () => void;
}

export default function MenuScanner(props: MenuScannerProps) {
  return <MenuScannerMain {...props} />;
}