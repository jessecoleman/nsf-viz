import { FilterList } from '@mui/icons-material';
import { Chip, styled } from '@mui/material';

const StyledChip = styled(Chip)(
  ({ theme }) => `
  transition: ease 0.3s all; 
  box-sizing: border-box;
  border: 16px solid lightgrey;
  position: absolute;
  margin-top: auto;
  margin-bottom: auto;
  top: 0;
  right: 16px;
  z-index: 2;
  width: 32px;
  & span, .MuiChip-deleteIcon {
    display: none;
  }
  & .MuiChip-avatar {
    margin: 4px;
  }
  &:hover {
    max-width: initial;
    width: initial;
    box-shadow: ${theme.shadows['2']};
    & span, .MuiChip-deleteIcon {
      display: initial;
    }
    & .MuiChip-deleteIcon {
      margin-right: -10px;
    }
    & .MuiChip-avatar {
      margin-left: -8px;
    }
  } 
`
);

type FilterChipProps = {
  label: string;
  onClear: () => void;
};

const FilterChip = (props: FilterChipProps) => {
  return (
    <StyledChip
      onDelete={props.onClear}
      avatar={<FilterList />}
      label={props.label}
    />
  );
};

export default FilterChip;
