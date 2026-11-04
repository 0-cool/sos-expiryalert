import type MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';

import type { DocumentType } from './types';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export const DOCUMENT_TYPE_ICONS: Record<DocumentType, IconName> = {
  passport: 'passport',
  drivers_license: 'card-account-details',
  national_id: 'card-account-details-outline',
  visa: 'airplane',
  residence_permit: 'home-account',
  vehicle_registration: 'car',
  vehicle_insurance: 'shield-car',
  medical_insurance: 'medical-bag',
  professional_certification: 'certificate',
  other: 'file-document-outline',
};
