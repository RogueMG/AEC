// Shapes shared by the enquiry form, POST /api/enquiries and the admin inbox.

export type EnquiryInput = {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  interest?: string;
  message: string;
  /** The page the visitor sent it from. */
  page?: string;
  /** Cloudflare Turnstile token. */
  turnstileToken?: string;
  /** Honeypot: real people never see or fill this field. */
  website?: string;
};

export type EnquiryStatus = "new" | "read" | "archived";

export type Enquiry = {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  interest: string;
  message: string;
  page: string;
  status: EnquiryStatus;
  notified: boolean;
  createdAt: string;
};

export type EnquiryCounts = Record<EnquiryStatus, number>;

export type EnquiryList = { enquiries: Enquiry[]; counts: EnquiryCounts };
