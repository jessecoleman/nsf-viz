import { PopoverOrigin } from '@material-ui/core';
import { useTutorial } from 'app/query';
import { RefObject, useEffect, useRef } from 'react';
import { NumberParam, useQueryParam } from 'use-query-params';

type Step = {
  anchorOrigin: PopoverOrigin;
  transformOrigin?: PopoverOrigin;
  title: string;
  description?: string;
}

const stepOrder = [
  'hello',
  'filterTerms',
  'clearTerms',
  'filterOrganizations',
  'filterDivisions',
  'chartToggles',
  'anyAllSetting',
  'filterYears',
  'overflowMenu',
] as const;

type Steps = Record<typeof stepOrder[number], Step>;

const steps: Steps = {
  hello: {
    anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
    transformOrigin: { vertical: 'top', horizontal: 'center' },
    title: 'Welcome!',
    description: 'Welcome to Grant Explorer!'
  },
  filterTerms: {
    anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
    transformOrigin: { vertical: 'top', horizontal: 'center' },
    title: 'Search Terms',
    description: 'Enter keywords here to filter by'
  },
  clearTerms: {
    anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
    transformOrigin: { vertical: 'top', horizontal: 'right' },
    title: 'Clear All Keywords',
    description: 'Clear all keywords and start your search again',
  },
  filterOrganizations: {
    anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
    transformOrigin: { vertical: 'top', horizontal: 'center' },
    title: 'Switch Organization',
    description: 'Switch between different funding agencies'
  },
  filterDivisions: {
    anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
    transformOrigin: { vertical: 'top', horizontal: 'center' },
    title: 'Filter By Division',
    description: 'Select subset of divisions to view'
  },
  chartToggles: {
    anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
    // transformOrigin: { vertical: 'top', horizontal: 'left' },
    title: 'Toggle Chart Settings',
    description: 'View aggregates by $ amount or count'
  },
  anyAllSetting: {
    anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
    // transformOrigin: { vertical: 'top', horizontal: 'left' },
    title: 'Keywords: Any vs. All',
    description: 'Select whether included grants should contain *any* of the included keywords, or *all* of them'
  },
  filterYears: {
    anchorOrigin: { vertical: 'top', horizontal: 'center' },
    transformOrigin: { vertical: 'bottom', horizontal: 'center' },
    title: 'Filter By Year Range',
    description: 'Drag the box to adjust the date range'
  },
  overflowMenu: {
    anchorOrigin: { vertical: 'top', horizontal: 'left' },
    transformOrigin: { vertical: 'center', horizontal: 'right' },
    title: 'Extras',
    description: 'See detailed grant data and external links',
  }
};

const refs: any[] = [];

export const useWizard = () => {
  
  const [ stepIdx, setStepIdx ] = useTutorial();
  // startup tutorial check
  useEffect(() => {
    const tutorialViewed = localStorage.getItem('tutorialViewed') === 'true';
    setStepIdx(tutorialViewed ? undefined : 0);
  }, []);
  
  const step: Step | undefined = Object.values(steps)[stepIdx ?? -1];

  const navigateForward = () => {
    if (stepIdx != undefined) {
      setStepIdx(Math.min(stepIdx + 1, stepOrder.length));
    }
  };

  const navigateBack = () => {
    if (stepIdx != undefined) {
      setStepIdx(Math.max(stepIdx - 1, 0));
    }
  };

  const cancelWizard = () => {
    setStepIdx(undefined);
    localStorage.setItem('tutorialViewed', 'true');
  };
  
  return {
    navigateBack: stepIdx != undefined && stepIdx > 0 ? navigateBack : undefined,
    navigateForward: stepIdx != undefined && stepIdx + 1 < stepOrder.length ? navigateForward : undefined,
    cancelWizard,
    step,
    ref: stepIdx != undefined ? refs[stepIdx] : {},
  };
};

type WizardRef<T> = {
  ref: RefObject<T>;
  active: boolean;
}

export const useWizardRef = <T>(step: typeof stepOrder[number]): WizardRef<T> => {
  const ref = useRef<T>(null);
  const [ stepIdx, ] = useQueryParam('tutorial', NumberParam);
  const idx = stepOrder.indexOf(step);
  refs[idx] = ref;
  return {
    ref,
    active: stepIdx === idx
  };
};
