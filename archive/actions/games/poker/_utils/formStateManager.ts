import { 
  CreateRoomFormData 
} from '../types';

/**
 * Form step types
 */
export type FormStep = 'name' | 'privacy' | 'maxPlayers' | 'smallBlind' | 'timeout' | 'confirmation';

/**
 * Form state interface
 */
export interface FormState {
  step: FormStep;
  data: Partial<CreateRoomFormData>;
  isComplete: boolean;
}

/**
 * Default form state
 */
export const defaultFormState: FormState = {
  step: 'name',
  data: {},
  isComplete: false
};

/**
 * Form step order
 */
export const formStepOrder: FormStep[] = [
  'name',
  'privacy', 
  'maxPlayers',
  'smallBlind',
  'timeout',
  'confirmation'
];

/**
 * Get next step in form
 */
export function getNextStep(currentStep: FormStep): FormStep | null {
  const currentIndex = formStepOrder.indexOf(currentStep);
  if (currentIndex === -1 || currentIndex === formStepOrder.length - 1) {
    return null;
  }
  return formStepOrder[currentIndex + 1];
}

/**
 * Get previous step in form
 */
export function getPreviousStep(currentStep: FormStep): FormStep | null {
  const currentIndex = formStepOrder.indexOf(currentStep);
  if (currentIndex <= 0) {
    return null;
  }
  return formStepOrder[currentIndex - 1];
}

/**
 * Update form state with new data
 */
export function updateFormState(
  currentState: FormState,
  field: keyof CreateRoomFormData,
  value: string | number | boolean
): FormState {
  const newData = { ...currentState.data, [field]: value };
  
  // Check if form is complete
  const isComplete = isFormComplete(newData);
  
  // Get next step if current step is complete
  let nextStep = currentState.step;
  if (isStepComplete(currentState.step, newData)) {
    const next = getNextStep(currentState.step);
    if (next) {
      nextStep = next;
    }
  }
  
  return {
    step: nextStep,
    data: newData,
    isComplete
  };
}

/**
 * Check if a specific step is complete
 */
export function isStepComplete(step: FormStep, data: Partial<CreateRoomFormData>): boolean {
  switch (step) {
    case 'name':
      return !!data.name && data.name.trim().length >= 3;
    case 'privacy':
      return data.isPrivate !== undefined;
    case 'maxPlayers':
      return data.maxPlayers !== undefined;
    case 'smallBlind':
      return data.smallBlind !== undefined && data.smallBlind > 0;
    case 'timeout':
      return data.turnTimeoutSec !== undefined && data.turnTimeoutSec > 0;
    case 'confirmation':
      return isFormComplete(data);
    default:
      return false;
  }
}

/**
 * Check if entire form is complete
 */
export function isFormComplete(data: Partial<CreateRoomFormData>): boolean {
  return !!(
    data.name &&
    data.isPrivate !== undefined &&
    data.maxPlayers !== undefined &&
    data.smallBlind !== undefined &&
    data.turnTimeoutSec !== undefined
  );
}

/**
 * Get form progress percentage
 */
export function getFormProgress(state: FormState): number {
  const completedSteps = formStepOrder.filter(step => 
    step !== 'confirmation' && isStepComplete(step, state.data)
  ).length;
  
  return Math.round((completedSteps / (formStepOrder.length - 1)) * 100);
}

/**
 * Get step display name
 */
export function getStepDisplayName(step: FormStep): string {
  const stepNames: Record<FormStep, string> = {
    name: 'نام روم',
    privacy: 'نوع روم',
    maxPlayers: 'تعداد بازیکنان',
    smallBlind: 'مقدار Small Blind',
    timeout: 'زمان تایم‌اوت',
    confirmation: 'تایید نهایی'
  };
  
  return stepNames[step];
}

/**
 * Get step description
 */
export function getStepDescription(step: FormStep): string {
  const descriptions: Record<FormStep, string> = {
    name: 'نام روم خود را وارد کنید (۳ تا ۳۰ کاراکتر)',
    privacy: 'آیا روم خصوصی باشد یا عمومی؟',
    maxPlayers: 'حداکثر تعداد بازیکنان را انتخاب کنید',
    smallBlind: 'مقدار Small Blind را انتخاب کنید',
    timeout: 'زمان تایم‌اوت هر نوبت را انتخاب کنید',
    confirmation: 'اطلاعات روم را بررسی و تایید کنید'
  };
  
  return descriptions[step];
} 