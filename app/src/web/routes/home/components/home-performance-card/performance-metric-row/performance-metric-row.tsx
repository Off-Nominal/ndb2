import { formatNumber } from "@web/shared/utils/format_number";

export type PerformanceMetricRowProps = {
  label: string;
  value: number;
};

export function PerformanceMetricRow(props: PerformanceMetricRowProps): JSX.Element {
  return (
    <div class={"[ split-pair ] [ performance-metric-row ]"}>
      <span>{props.label}</span>
      <span>{formatNumber(props.value)}</span>
    </div>
  );
}
