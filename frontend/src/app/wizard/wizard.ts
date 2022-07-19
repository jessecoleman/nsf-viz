import { RefObject, useCallback, useEffect, useRef, useState } from 'react';

import { PopoverOrigin } from '@mui/material';

import { NumberParam, useQueryParam } from 'use-query-params';

import { useTutorial } from 'app/query';

type Step = {
  anchorOrigin: PopoverOrigin;
  transformOrigin?: PopoverOrigin;
  title: string;
  description?: string;
};

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
    title: 'Welcome to GrantExplorer!',
  },
  filterTerms: {
    anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
    transformOrigin: { vertical: 'top', horizontal: 'center' },
    title: 'Search Terms',
    description:
      'Enter keywords. The search bar will suggest related terms sorted by relevancy',
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
    description: 'Switch between different funding agencies',
  },
  filterDivisions: {
    anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
    transformOrigin: { vertical: 'top', horizontal: 'center' },
    title: 'Filter By Division',
    description: 'Select subset of divisions to view',
  },
  chartToggles: {
    anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
    // transformOrigin: { vertical: 'top', horizontal: 'left' },
    title: 'Toggle Chart Settings',
    description: 'View aggregates by $ amount or count',
  },
  anyAllSetting: {
    anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
    // transformOrigin: { vertical: 'top', horizontal: 'left' },
    title: 'Keywords: Any vs. All',
    description:
      'Select whether included grants should contain *any* of the included keywords, or *all* of them',
  },
  filterYears: {
    anchorOrigin: { vertical: 'top', horizontal: 'center' },
    transformOrigin: { vertical: 'bottom', horizontal: 'center' },
    title: 'Filter By Year Range',
    description: 'Drag the box to adjust the date range',
  },
  overflowMenu: {
    anchorOrigin: { vertical: 'top', horizontal: 'left' },
    transformOrigin: { vertical: 'center', horizontal: 'right' },
    title: 'Extras',
    description: 'See detailed grant data and external links',
  },
};

const refs: any[] = [];

export const useWizard = () => {
  const [stepIdx, setStepIdx] = useTutorial();

  const navigateForward = useCallback(() => {
    setStepIdx((idx) =>
      idx != undefined && idx < stepOrder.length - 1 ? idx + 1 : undefined
    );
  }, [setStepIdx]);

  const navigateBack = useCallback(() => {
    setStepIdx((idx) => Math.max((idx ?? 0) - 1, 0));
  }, [setStepIdx]);

  const cancelWizard = useCallback(() => {
    setStepIdx(undefined);
    localStorage.setItem('tutorialViewed', 'true');
  }, [setStepIdx]);

  const tutorialNav = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Enter':
        case 'ArrowRight':
        case ' ': // spacebar
          navigateForward();
          break;
        case 'Backspace':
        case 'ArrowLeft':
          navigateBack();
          break;
        case 'Escape':
        case 'q':
          cancelWizard();
          break;
      }
    },
    [navigateForward, navigateBack, cancelWizard]
  );

  // startup tutorial check
  useEffect(() => {
    const tutorialViewed = localStorage.getItem('tutorialViewed') === 'true';
    setStepIdx(tutorialViewed ? undefined : 0);
    // clean up listener on unmount
    return () => {
      window.removeEventListener('keydown', tutorialNav);
    };
  }, []);

  const prevStepIdx = useRef(stepIdx);

  useEffect(() => {
    if (stepIdx == undefined) {
      window.removeEventListener('keydown', tutorialNav);
    } else if (prevStepIdx.current == undefined) {
      window.addEventListener('keydown', tutorialNav);
    }
    prevStepIdx.current = stepIdx;
  }, [stepIdx, tutorialNav]);

  const step: Step | undefined = Object.values(steps)[stepIdx ?? -1];

  return {
    navigateBack:
      stepIdx != undefined && stepIdx > 0 ? navigateBack : undefined,
    navigateForward:
      stepIdx != undefined && stepIdx + 1 < stepOrder.length
        ? navigateForward
        : undefined,
    cancelWizard,
    step,
    ref: stepIdx != undefined ? refs[stepIdx] : {},
  };
};

type WizardRef<T> = {
  ref: RefObject<T>;
  active: boolean;
};

export const useWizardRef = <T>(
  step: typeof stepOrder[number]
): WizardRef<T> => {
  const ref = useRef<T>(null);
  const [stepIdx] = useQueryParam('tutorial', NumberParam);
  const idx = stepOrder.indexOf(step);
  refs[idx] = ref;
  return {
    ref,
    active: stepIdx === idx,
  };
};
