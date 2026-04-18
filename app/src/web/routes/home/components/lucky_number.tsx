export type lucky_number_props = {
  value: number;
};

/** Small HTML component for HTMX to swap into `#lucky-result` (not a full document). */
export function lucky_number(props: lucky_number_props): JSX.Element {
  return <span class="lucky-number">{props.value}</span>;
}
