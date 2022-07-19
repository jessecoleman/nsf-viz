import { CheckboxState } from './DirectoryTableHead';

export const getNextCheckboxState = (checked?: CheckboxState) => {
  switch (checked) {
    case 'checked':
      return 'unchecked';
    case 'indeterminate':
      return 'checked';
    case 'unchecked':
      return 'checked';
    default:
      return 'checked';
  }
};
