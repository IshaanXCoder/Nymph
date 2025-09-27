import React from 'react';
import { Path, Svg } from 'react-native-svg';

interface CustomTabIconProps {
  size: number;
  color: string;
}

export const ChatIcon = ({ size, color }: CustomTabIconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z"
      fill={color}
    />
    <Path
      d="M7 9H17V11H7V9ZM7 12H15V14H7V12Z"
      fill={color}
    />
  </Svg>
);

export const HomeIcon = ({ size, color }: CustomTabIconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z"
      fill={color}
    />
  </Svg>
);

export const SearchIcon = ({ size, color }: CustomTabIconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3S3 5.91 3 9.5S5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14Z"
      fill={color}
    />
  </Svg>
);
