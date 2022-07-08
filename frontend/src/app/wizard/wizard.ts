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
  'filterTerms',
  'clearTerms',
  'filterOrganizations',
  'filterDivisions',
  'chartToggles',
  'filterYears',
  'overflowMenu',
] as const;

type Steps = Record<typeof stepOrder[number], Step>;

const steps: Steps = {
  filterTerms: {
    anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
    transformOrigin: { vertical: 'top', horizontal: 'center' },
    title: 'search terms',
    description: 'enter keywords here that you want to filter by'
  },
  clearTerms: {
    anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
    transformOrigin: { vertical: 'top', horizontal: 'right' },
    title: 'clear all keywords',
  },
  filterOrganizations: {
    anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
    transformOrigin: { vertical: 'top', horizontal: 'center' },
    title: 'switch organization',
    description: 'switch between NSF, NIH, and DOD datasets'
  },
  filterDivisions: {
    anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
    transformOrigin: { vertical: 'top', horizontal: 'center' },
    title: 'filter by division',
    description: 'select subset of divisions to view'
  },
  chartToggles: {
    anchorOrigin: { vertical: 'top', horizontal: 'left' },
    // transformOrigin: { vertical: 'top', horizontal: 'left' },
    title: 'toggle chart settings',
    description: 'view aggregates by $ amount or count, etc'
  },
  filterYears: {
    anchorOrigin: { vertical: 'top', horizontal: 'center' },
    transformOrigin: { vertical: 'bottom', horizontal: 'center' },
    title: 'filter by year range',
    description: 'drag the gray box to adjust range'
  },
  overflowMenu: {
    anchorOrigin: { vertical: 'top', horizontal: 'left' },
    transformOrigin: { vertical: 'center', horizontal: 'right' },
    title: 'extras',
    description: 'see detailed grant data and external links',
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
