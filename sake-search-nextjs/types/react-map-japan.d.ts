// @react-map/japan の型定義

declare module '@react-map/japan' {
  interface JapanProps {
    onClick?: (prefectureId: string) => void;
    onHover?: (prefectureId: string) => void;
    onLeave?: () => void;
    config?: {
      [prefectureName: string]: {
        fill?: string;
        stroke?: string;
        strokeWidth?: number;
        cursor?: string;
        [key: string]: any;
      };
    };
    className?: string;
    style?: React.CSSProperties;
  }

  const Japan: React.FC<JapanProps>;
  export default Japan;
}