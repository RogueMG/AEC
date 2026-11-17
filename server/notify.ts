// Email notification for a new enquiry, sent through the mailer Worker (workers/mailer) over the
// MAILER service binding. Kept free of runtime imports so it can be unit-tested in Node
// (scripts/test-enquiry-units.ts).

export type NotifyEnquiry = {
  name: string;
  company: string;
  email: string;
  phone: string;
  interest: string;
  message: string;
  page: string;
};

/** Anything with a fetch() like a Worker service binding. */
export type MailerBinding = { fetch: (input: string, init: RequestInit) => Promise<Response> };

export function notificationText(e: NotifyEnquiry): string {
  return [
    `New enquiry from the website`,
    ``,
    `Name:     ${e.name}`,
    `Company:  ${e.company || "-"}`,
    `Email:    ${e.email || "-"}`,
    `Phone:    ${e.phone || "-"}`,
    `Interest: ${e.interest || "-"}`,
    `Page:     ${e.page || "-"}`,
    ``,
    e.message,
    ``,
    `This enquiry is also saved in the admin under Enquiries.`,
  ].join("\n");
}

/** True only when the mailer accepted the message; never throws (the enquiry is already saved). */
export async function notify(mailer: MailerBinding | undefined, e: NotifyEnquiry): Promise<boolean> {
  if (!mailer) return false;
  try {
    const response = await mailer.fetch("https://mailer.internal/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: `Website enquiry: ${e.interest || e.name}`.slice(0, 150),
        text: notificationText(e),
        replyTo: e.email || undefined,
      }),
    });
    return response.ok;
  } catch (error) {
    console.error("Enquiry notification failed", error);
    return false;
  }
}
