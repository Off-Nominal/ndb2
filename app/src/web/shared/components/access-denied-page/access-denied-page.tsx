import { getColorScheme, getThemePreference } from "../../../middleware/theme-preference";
import { documentTitle } from "@web/shared/utils/document_title";
import type { ErrorPageProps } from "../error-page/error-page";
import { ErrorPage } from "../error-page/error-page";
import { PageLayout } from "../page-layout";

/** Full public document for access-denied and similar error states (no site nav). */
export function renderAccessDeniedPage(
  props: ErrorPageProps,
): Promise<JSX.Element> {
  return Promise.resolve(
    <PageLayout
      theme={getThemePreference()}
      colorScheme={getColorScheme()}
      title={documentTitle(props.title)}
    >
      <ErrorPage {...props} />
    </PageLayout>,
  );
}
