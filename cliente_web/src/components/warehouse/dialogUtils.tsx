import { useCallback, useMemo } from "react";
import type { ReactNode } from "react";

import type {
  WarehouseDialogLayoutProps,
  WarehouseDialogStep,
} from "./WarehouseDialogLayout";
import { LocationResultCard, SkuSelect } from "./shared";
import type { WarehouseDialogActionsProps } from "./shared";
import type { ProductLocation } from "@/types/warehouse";

type ResetFn = () => void;

type OnOpenChange = (open: boolean) => void;

export const useWarehouseDialogControls = (
  reset: ResetFn,
  onOpenChange: OnOpenChange
) => {
  const handleDialogChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        reset();
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, reset]
  );

  const handleCancel = useCallback(() => {
    reset();
    onOpenChange(false);
  }, [onOpenChange, reset]);

  return { handleDialogChange, handleCancel };
};

interface SkuSelectionStepParams<TOption extends { id: string; sku: string }>
  extends Pick<WarehouseDialogActionsProps, "isLoading"> {
  value: string;
  onValueChange: (sku: string) => void;
  options?: TOption[];
  placeholder?: string;
  emptyLabel?: string;
}

export const createSkuSelectionStep = <
  TOption extends { id: string; sku: string }
>({
  value,
  onValueChange,
  options,
  isLoading,
  placeholder,
  emptyLabel,
}: SkuSelectionStepParams<TOption>): WarehouseDialogStep => ({
  title: "Seleccionar producto",
  content: (
    <SkuSelect
      value={value}
      onValueChange={onValueChange}
      isLoading={isLoading}
      options={options}
      placeholder={placeholder}
      emptyLabel={emptyLabel}
    />
  ),
});

interface LocationExecutionParams<TResult extends ProductLocation> {
  locate: () => Promise<TResult>;
  onFound: (result: TResult) => void;
  onNotFound: () => void;
  onError?: (error: unknown) => void;
  setIsLocating: (value: boolean) => void;
  setLocationResult: (value: TResult | null) => void;
}

export const runLocationRequest = async <
  TResult extends ProductLocation
>({
  locate,
  onFound,
  onNotFound,
  onError,
  setIsLocating,
  setLocationResult,
}: LocationExecutionParams<TResult>) => {
  setIsLocating(true);
  setLocationResult(null);

  try {
    const result = await locate();
    setLocationResult(result);

    if (result.encontrado) {
      onFound(result);
    } else {
      onNotFound();
    }
  } catch (error) {
    onError?.(error);
  } finally {
    setIsLocating(false);
  }
};

export const useWarehouseDialogActions = (
  actions: WarehouseDialogActionsProps
) =>
  useMemo(
    () => ({
      onCancel: actions.onCancel,
      onConfirm: actions.onConfirm,
      canConfirm: actions.canConfirm,
      isLoading: actions.isLoading,
      confirmLabel: actions.confirmLabel,
      loadingLabel: actions.loadingLabel,
    }),
    [
      actions.canConfirm,
      actions.confirmLabel,
      actions.isLoading,
      actions.loadingLabel,
      actions.onCancel,
      actions.onConfirm,
    ]
  );

interface LocationResultConfig<TResult extends ProductLocation> {
  result: TResult | null;
  successMessage: string;
  notFoundMessage: string;
  renderDetails: (result: TResult) => ReactNode;
}

export const renderLocationResult = <TResult extends ProductLocation>({
  result,
  successMessage,
  notFoundMessage,
  renderDetails,
}: LocationResultConfig<TResult>) =>
  result ? (
    <LocationResultCard
      found={result.encontrado}
      successMessage={successMessage}
      notFoundMessage={notFoundMessage}
    >
      {result.encontrado ? renderDetails(result) : null}
    </LocationResultCard>
  ) : null;

export const renderAvailabilityResult = (
  result: ProductLocation | null
) =>
  renderLocationResult({
    result,
    successMessage: "Su producto se encuentra en la bodega:",
    notFoundMessage: "Producto no localizado en ninguna bodega",
    renderDetails: (location) => (
      <>
        <p className="mt-2 text-lg font-semibold text-green-700">
          {location.bodega}
        </p>
        <p className="mt-1 text-2xl font-bold">{location.zona}</p>
      </>
    ),
  });

export const renderZoneResult = (result: ProductLocation | null) =>
  renderLocationResult({
    result,
    successMessage: "Su producto se encuentra en la zona:",
    notFoundMessage: "Producto no localizado en esta bodega",
    renderDetails: (location) => (
      <p className="mt-2 text-2xl font-bold">{location.zona}</p>
    ),
  });

interface WarehouseDialogPresentationParams<TResult extends ProductLocation> {
  result: TResult | null;
  renderResult: (value: TResult | null) => ReactNode;
  actions: {
    onCancel: () => void;
    onConfirm: () => void | Promise<void>;
    canConfirm: boolean;
    isLoading: boolean;
    confirmLabel: string;
    loadingLabel: string;
  };
}

interface DialogActionLabels {
  confirm: string;
  loading: string;
}

interface DialogActionConfig {
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  canConfirm: boolean;
  isLoading: boolean;
  labels: DialogActionLabels;
}

export const createDialogActionsConfig = ({
  onCancel,
  onConfirm,
  canConfirm,
  isLoading,
  labels,
}: DialogActionConfig) => ({
  onCancel,
  onConfirm,
  canConfirm,
  isLoading,
  confirmLabel: labels.confirm,
  loadingLabel: labels.loading,
});

type WarehouseDialogLayoutParams<TResult extends ProductLocation> = Pick<
  WarehouseDialogLayoutProps,
  "open" | "onOpenChange" | "title" | "description" | "steps"
> & {
  result: TResult | null;
  renderResult: (value: TResult | null) => ReactNode;
  actions: DialogActionConfig;
};

export const useWarehouseDialogLayoutProps = <TResult extends ProductLocation>({
  open,
  onOpenChange,
  title,
  description,
  steps,
  result,
  renderResult,
  actions,
}: WarehouseDialogLayoutParams<TResult>) => {
  const presentation = useWarehouseDialogPresentation({
    result,
    renderResult,
    actions: createDialogActionsConfig(actions),
  });

  return {
    open,
    onOpenChange,
    title,
    description,
    steps,
    result: presentation.resultContent,
    actions: presentation.dialogActions,
  } as const;
};

export const useWarehouseDialogPresentation = <
  TResult extends ProductLocation
>({
  result,
  renderResult,
  actions,
}: WarehouseDialogPresentationParams<TResult>) => {
  const dialogActions = useWarehouseDialogActions(actions);

  const resultContent = renderResult(result);

  return { dialogActions, resultContent } as const;
};
