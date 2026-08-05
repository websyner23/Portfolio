import axios from "axios";
import config from "../../config";

/**
 * Fire-and-forget on-demand revalidation of the Next.js frontend.
 * Content edits in the admin show up on the public site within seconds
 * instead of waiting for the 5-minute time-based fallback.
 */
export const revalidateFrontend = (tags: string[]) => {
  if (!config.revalidateSecret || tags.length === 0) return;

  axios
    .post(
      `${config.frontendUrl}/api/revalidate`,
      { tags },
      {
        headers: { "x-revalidate-secret": config.revalidateSecret },
        timeout: 4000,
      }
    )
    .catch((err) => {
      console.warn(
        `[revalidate] frontend not notified (${tags.join(", ")}): ${
          (err as Error).message
        }`
      );
    });
};
