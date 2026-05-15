import type { PortalGuildCachedMemberProfile } from "@domain/discord";
import { escapeHtml } from "@kitajs/html";
import type { SelectOption } from "@web/shared/components/select";

/** Wire **`value=""`** ↔ omits **`creator`** query param on **`GET`** (see {@link serializePredictionBrowseQuery}). */
export const ANY_PREDICTOR_SELECT_OPTION: SelectOption = {
  value: "",
  label: "Any predictor",
};

type PredictorMemberOptionLabelProps = {
  member: PortalGuildCachedMemberProfile;
};

/** Avatar URL and display name are user-controlled; {@link escapeHtml} matches Kitajs XSS guidance (JSX does not auto-escape interpolations). */
function PredictorMemberOptionLabel(props: PredictorMemberOptionLabelProps): JSX.Element {
  return (
    <span class="select__member-option">
      <img
        class="select__member-option-avatar"
        src={escapeHtml(props.member.avatarUrl)}
        alt=""
        width="28"
        height="28"
        loading="lazy"
        decoding="async"
      />
      <span class="select__member-option-name">{escapeHtml(props.member.displayName)}</span>
    </span>
  );
}

type UnknownPredictorOptionLabelProps = {
  discordId: string;
};

function UnknownPredictorOptionLabel(props: UnknownPredictorOptionLabelProps): JSX.Element {
  return (
    <span class="select__member-option select__member-option--fallback">
      <span class="select__member-option-name">{escapeHtml(props.discordId)}</span>
      <span class="select__member-option-hint">Not in guild cache</span>
    </span>
  );
}

function mapMemberToOption(member: PortalGuildCachedMemberProfile): SelectOption {
  return {
    value: member.discordId,
    label: `${member.displayName} (${member.discordId})`,
    labelHtml: String(PredictorMemberOptionLabel({ member })),
  };
}

function unknownPredictorOption(discordId: string): SelectOption {
  return {
    value: discordId,
    label: discordId,
    labelHtml: String(UnknownPredictorOptionLabel({ discordId })),
  };
}

/**
 * **`Select`** options for prediction browse predictor filter: guild cache members plus **`Any predictor`** (**`""`**).
 * When **`selectedDiscordId`** is set but missing from **`members`**, adds a synthetic row (**`fallback`** avatar/name when REST resolves).
 */
export function buildPredictionPredictorSelectOptions(
  members: readonly PortalGuildCachedMemberProfile[],
  selectedDiscordId: string | undefined,
  fallback?: PortalGuildCachedMemberProfile,
): SelectOption[] {
  const byId = new Map(members.map((m) => [m.discordId, m]));
  const memberOpts = members.map(mapMemberToOption);

  const extras: SelectOption[] = [];
  if (
    selectedDiscordId !== undefined &&
    selectedDiscordId !== "" &&
    !byId.has(selectedDiscordId)
  ) {
    extras.push(
      fallback !== undefined && fallback.discordId === selectedDiscordId
        ? mapMemberToOption(fallback)
        : unknownPredictorOption(selectedDiscordId),
    );
  }

  return [ANY_PREDICTOR_SELECT_OPTION, ...extras, ...memberOpts];
}
