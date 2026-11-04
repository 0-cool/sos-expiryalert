import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface IconProps {
  name: IconName;
  size?: number;
  color: ColorValue;
}

/** Single icon family across the app for visual consistency on iOS and Android. */
export function Icon({ name, size = 22, color }: IconProps) {
  return (
    <MaterialCommunityIcons
      name={name}
      size={size}
      color={typeof color === 'number' || color === null || color === undefined ? undefined : color}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
