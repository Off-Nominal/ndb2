export type LuckyNumberProps = {
  value: number;
};

/** Small HTML component for HTMX to swap into `#lucky-result` (not a full document). */
export function LuckyNumber(props: LuckyNumberProps): JSX.Element {
  return <span class="lucky-number">{props.value}</span>;
}
