export type LuckyNumberProps = {
  value: number;
};

/** HTMX fragment: random number result. */
export function LuckyNumber(props: LuckyNumberProps): JSX.Element {
  return <span class="lucky-number">{props.value}</span>;
}
