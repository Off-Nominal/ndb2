import { HeadingScreenElement } from "@web/shared/components/heading-screen-element";
import { ErrorHtmxSnippet } from "@web/shared/components/error-page";
import type { ErrorPageBody } from "@web/shared/components/error-page/error-page";
import {
  SeasonEndWebhookForm,
} from "./components/season-end-webhook-form";
import type { SeasonEndWebhookFormProps } from "./components/season-end-webhook-form";

export type AdminPageBanner = {
  kind: "success" | "error";
  title: string;
  body: ErrorPageBody;
};

export type AdminPageProps = SeasonEndWebhookFormProps & {
  banner?: AdminPageBanner;
};

/** Admin tools shell for **`GET /admin`**. */
export function AdminPage(props: AdminPageProps): JSX.Element {
  return (
    <div class="[ stack ] [ main-menu ]">
      <HeadingScreenElement>
        <h1 class="[ canvas-knockout-text ]">Admin</h1>
      </HeadingScreenElement>
      {props.banner ? (
        <div
          role={props.banner.kind === "error" ? "alert" : "status"}
          class="[ stack ]"
        >
          <p>{props.banner.title}</p>
          {typeof props.banner.body === "string" ? (
            <p>{props.banner.body}</p>
          ) : (
            props.banner.body
          )}
        </div>
      ) : null}
      <SeasonEndWebhookForm
        seasons={props.seasons}
        selectedSeasonId={props.selectedSeasonId}
      />
    </div>
  );
}
